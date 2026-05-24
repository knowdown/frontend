# Request Broker Architecture

This document defines the recommended async request architecture for Knockdown when GitHub is the durable source of truth and Cloudflare acts as the intermediate broker, callback receiver, and notification layer.

## Core model

- GitHub repo is the canonical state store for every request.
- Cloudflare Worker is the request API, workflow dispatcher, callback endpoint, and polling facade.
- Cloudflare Durable Object is a live WebSocket room for each request id.
- Cloudflare KV is optional short-lived cache only.
- GitHub Actions does the async processing and commits canonical state back into the repo.

The mental model is:

- Repo commit = truth
- Callback = notification that truth changed
- WebSocket = live convenience
- Polling = recovery path

## Request id contract

Use a request id that encodes the request date so the state path can be derived without an index file.

Example:

```text
req_20260525_01JXYZABC123
```

Derived base path:

```text
requests/2026/05/25/req_20260525_01JXYZABC123
```

## Repository contract

Each request gets its own directory.

```text
requests/
  2026/
    05/
      25/
        req_20260525_01JXYZABC123/
          input.json
          state.json
          result.json
          events/
            0001-accepted.json
            0002-dispatched.json
            0003-running.json
            0004-processed.json
```

Guidelines:

- Never use a shared `all-requests.json`.
- Keep `state.json` as the latest snapshot.
- Keep `events/` as the append-only audit trail.
- Keep `result.json` only for final output or a terminal failure payload.
- Prefer one commit per lifecycle milestone, not every progress tick.

## State schema

`state.json`

```json
{
  "requestId": "req_20260525_01JXYZABC123",
  "operation": "generate-report",
  "status": "processed",
  "step": "completed",
  "progress": 100,
  "message": "Report generated successfully",
  "version": 5,
  "statePath": "requests/2026/05/25/req_20260525_01JXYZABC123/state.json",
  "inputPath": "requests/2026/05/25/req_20260525_01JXYZABC123/input.json",
  "resultPath": "requests/2026/05/25/req_20260525_01JXYZABC123/result.json",
  "createdAt": "2026-05-25T10:00:00.000Z",
  "updatedAt": "2026-05-25T10:04:00.000Z"
}
```

Allowed `status` values:

- `accepted`
- `dispatched`
- `running`
- `processed`
- `failed`

Recommended `step` values:

- `created`
- `github_workflow_dispatched`
- `started`
- `processing`
- `completed`
- `dispatch_failed`
- `processing_failed`

`events/*.json`

```json
{
  "requestId": "req_20260525_01JXYZABC123",
  "eventType": "running",
  "status": "running",
  "step": "started",
  "progress": 10,
  "message": "GitHub Action started",
  "version": 3,
  "createdAt": "2026-05-25T10:02:00.000Z"
}
```

`result.json`

```json
{
  "requestId": "req_20260525_01JXYZABC123",
  "summary": "Report generated successfully",
  "data": {
    "recordsProcessed": 120,
    "warnings": []
  }
}
```

## Ownership boundary

To reduce GitHub contents API conflicts:

- Cloudflare writes request files before dispatch.
- GitHub Action owns state transitions after dispatch.
- Cloudflare callback never writes canonical terminal state.

This is the preferred write ownership split:

### Cloudflare-owned writes

- `0001-accepted.json`
- initial `state.json`
- `0002-dispatched.json`
- `state.json` update from `accepted` to `dispatched`
- optional `dispatch_failed` state if workflow dispatch fails

### GitHub Action-owned writes

- `0003-running.json`
- `state.json` update to `running`
- `0004-processed.json` or failure event
- final `result.json`
- final `state.json` update to `processed` or `failed`

## Cloudflare responsibilities

Cloudflare must:

- generate `requestId`
- derive `statePath`, `inputPath`, `resultPath`
- create initial repo files
- dispatch GitHub workflow
- expose polling API
- accept GitHub Action callback
- broadcast WebSocket updates
- optionally cache latest state in KV for 30-300 seconds

Cloudflare must not:

- become the permanent state store
- invent state that is not persisted in GitHub
- keep unrecoverable request state only in DO or KV

## Worker API spec

### `POST /api/requests`

Creates a request, writes initial state to GitHub, dispatches the workflow, and returns tracking metadata.

Request:

```json
{
  "operation": "generate-report",
  "branch": "main",
  "input": {
    "customerId": "CUST-123"
  }
}
```

Success response:

```json
{
  "requestId": "req_20260525_01JXYZABC123",
  "status": "dispatched",
  "statePath": "requests/2026/05/25/req_20260525_01JXYZABC123/state.json",
  "statusUrl": "/api/requests/req_20260525_01JXYZABC123/status",
  "wsUrl": "/ws/requests/req_20260525_01JXYZABC123"
}
```

Failure response on dispatch failure:

```json
{
  "requestId": "req_20260525_01JXYZABC123",
  "status": "failed",
  "step": "dispatch_failed",
  "message": "Failed to dispatch GitHub Action"
}
```

### `GET /api/requests/:requestId/status`

Returns the latest canonical state for the request.

Behavior:

- check KV cache first
- if cache miss, derive path from `requestId`
- read `state.json` from GitHub
- cache briefly
- return state with `ETag` set to the state version

Response:

```json
{
  "requestId": "req_20260525_01JXYZABC123",
  "status": "running",
  "step": "processing",
  "progress": 45,
  "version": 3
}
```

### `GET /ws/requests/:requestId`

Establishes a request-scoped WebSocket connection.

On connect:

- validate caller access
- join Durable Object room for that `requestId`
- fetch latest state from KV or GitHub
- emit snapshot immediately

Initial message:

```json
{
  "type": "snapshot",
  "requestId": "req_20260525_01JXYZABC123",
  "status": "running",
  "progress": 45,
  "version": 3
}
```

Update message:

```json
{
  "type": "update",
  "requestId": "req_20260525_01JXYZABC123",
  "status": "processed",
  "progress": 100,
  "version": 5
}
```

### `POST /internal/requests/callback`

Called only by GitHub Actions after canonical state has already been committed.

Auth:

- `Authorization: Bearer <callback token>`

Request:

```json
{
  "requestId": "req_20260525_01JXYZABC123",
  "statePath": "requests/2026/05/25/req_20260525_01JXYZABC123/state.json",
  "resultPath": "requests/2026/05/25/req_20260525_01JXYZABC123/result.json"
}
```

Behavior:

- validate callback token
- read latest `state.json` from GitHub
- cache state briefly in KV
- broadcast to DO room for `requestId`
- return `204`

## Cloudflare environment contract

Required Worker secrets and vars:

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_BRANCH
GITHUB_WORKFLOW
GITHUB_TOKEN
GITHUB_CALLBACK_TOKEN
```

Optional bindings:

```text
REQUEST_CACHE      # KV namespace
REQUEST_ROOM       # Durable Object namespace
```

Recommended auth model:

- GitHub App installation token for Cloudflare repo writes
- workflow `permissions: contents: write`
- dedicated callback bearer token for Action -> Cloudflare notification

## GitHub contents API write rules

Every write must:

- fetch existing file first
- include latest `sha` when updating
- retry on conflict 2-3 times

Important constraint:

- GitHub warns that concurrent contents API writes can conflict
- serialize writes per file whenever possible

## Workflow dispatch inputs

Cloudflare should dispatch GitHub Actions with:

```json
{
  "ref": "main",
  "inputs": {
    "request_id": "req_20260525_01JXYZABC123",
    "state_path": "requests/2026/05/25/req_20260525_01JXYZABC123/state.json",
    "input_path": "requests/2026/05/25/req_20260525_01JXYZABC123/input.json",
    "result_path": "requests/2026/05/25/req_20260525_01JXYZABC123/result.json",
    "operation": "generate-report"
  }
}
```

## GitHub Action contract

Workflow must:

- check out the repo
- read `input.json`
- update `state.json` to `running`
- append `events/0003-running.json`
- perform the operation
- write `result.json`
- update `state.json` to `processed` or `failed`
- append terminal event
- call Cloudflare callback

Commit only milestone states:

- accepted
- dispatched
- running
- processed
- failed

Do not commit every 1% progress update.

If you want live detailed progress:

- send transient progress notifications directly to Cloudflare callback or a progress endpoint
- keep only key lifecycle states in the repo

## Frontend integration plan

### Request creation flow

1. UI calls `POST /api/requests`
2. UI stores `{ requestId, statusUrl, wsUrl }`
3. UI opens WebSocket immediately
4. UI starts a polling fallback timer
5. UI renders `dispatched` state

### Live state strategy

Use WebSocket-first with polling fallback:

- WebSocket is primary
- Poll every 3-10 seconds while request is non-terminal
- Stop polling when socket is healthy and recent
- Resume polling if socket disconnects or if no update is received within a timeout

### Suggested client state shape

```ts
type RequestTracker = {
  requestId: string;
  statusUrl: string;
  wsUrl: string;
  socketState: "idle" | "connecting" | "open" | "closed";
  lastKnownState: RequestState | null;
  lastVersion: number;
  lastUpdateAt: string | null;
  pollTimer: number | null;
};
```

### Client rules

- apply incoming state only if `version` is newer than current
- treat `processed` and `failed` as terminal
- reconnect socket with backoff
- keep polling as recovery for missed socket events
- expose request ids in UI for supportability

### Suggested polling cadence

- 2-3 seconds for first 15 seconds
- 5 seconds while running
- 10 seconds after 1 minute
- stop when terminal

## Durable Object role

Durable Object should only:

- hold WebSocket connections by request room
- broadcast updates
- optionally keep last in-memory snapshot for connected clients

Durable Object should not:

- be treated as the durable source of truth
- be required for state recovery after restart

## Security constraints

This pattern is acceptable for:

- internal tools
- demos
- operator workflows
- audit-heavy systems
- moderate async volumes

Be careful with:

- secrets
- tokens
- PII
- medical data
- financial data
- large result payloads

If sensitive payloads must be stored:

- store encrypted `input.enc.json` and `result.enc.json`
- keep encryption keys outside GitHub

Always use a private repo for anything non-public.

## Implementation order

1. Implement `POST /api/requests` in Cloudflare Worker
2. Implement GitHub file helpers with SHA-aware retry
3. Implement workflow dispatch
4. Implement `GET /api/requests/:requestId/status`
5. Implement callback endpoint
6. Implement DO WebSocket room
7. Implement frontend request tracker
8. Add KV caching and ETags
9. Add access control and request retention policy

## Open decisions

- whether transient progress should use the same callback endpoint or a separate progress endpoint
- whether results larger than a few hundred KB should move to object storage while repo keeps metadata only
- how long request folders remain in repo before archival
- whether a secondary monthly index file is needed for operator search and reporting
