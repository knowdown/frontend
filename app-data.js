window.KNOCKDOWN_CONSOLE_DATA = {
  queueHealth: [
    {
      label: "Active runs",
      value: "12",
      note: "3 awaiting human gate"
    },
    {
      label: "Connector health",
      value: "94%",
      note: "1 staged runtime still warming"
    },
    {
      label: "Median cycle",
      value: "3h 18m",
      note: "Across defect and story profiles"
    }
  ],
  templates: [
    {
      id: "template-defect",
      title: "Defect to PR",
      meta: "Triage, RCA, verify, package",
      profile: "Defect",
      sourceGraph: "Configured source + repo + runtime",
      stage: "Intake",
      prompt: "Normalize the defect, inspect similar issues, determine reproduction strategy, then build the safest execution plan before making code changes."
    },
    {
      id: "template-story",
      title: "Story Delivery",
      meta: "Clarify, implement, validate",
      profile: "Story",
      sourceGraph: "Issue source + docs + tests",
      stage: "Planning",
      prompt: "Turn the requirement into a delivery plan, identify impacted repos and acceptance checks, then stage implementation with guarded validation."
    },
    {
      id: "template-case",
      title: "Case Resolution",
      meta: "Diagnose, recommend, sync back",
      profile: "Case",
      sourceGraph: "Case source + KB + runtime context",
      stage: "Diagnosis",
      prompt: "Assess the case, pull relevant knowledge and environment context, identify workaround or fix path, and pause before any source-system writeback."
    }
  ],
  chats: [
    {
      id: "defect-bt1",
      title: "Deliver DEF0842192 across configured enterprise connectors",
      source: "ServiceNow BT1 / DEF0842192",
      time: "2m ago",
      stage: "Validation",
      profile: "Defect",
      sourceGraph: "ServiceNow BT1 + GitHub + Knowledge Plane",
      workflowStage: "Validation",
      meta: ["Owner: UXC Controls", "Repo: dev/sn-form", "Human gate: PR + source sync"],
      insights: [
        {
          label: "Confidence",
          value: "High",
          tone: "good"
        },
        {
          label: "Risk",
          value: "Medium",
          tone: "warn"
        },
        {
          label: "Validation",
          value: "2 / 3 passed",
          tone: "neutral"
        },
        {
          label: "Writeback",
          value: "Guarded",
          tone: "good"
        }
      ],
      timeline: [
        {
          stage: "Intake",
          state: "completed",
          summary: "Work item normalized from configured ServiceNow BT1 connector."
        },
        {
          stage: "Context Assembly",
          state: "completed",
          summary: "Similar work, repo mappings, wiki entries, and tests loaded."
        },
        {
          stage: "RCA & Fix",
          state: "completed",
          summary: "Patch prepared and packaged for validation."
        },
        {
          stage: "Validation",
          state: "active",
          summary: "Runtime verification is green; one regression scenario still missing."
        },
        {
          stage: "Source Sync",
          state: "pending",
          summary: "Blocked on human approval for comment and attachment writeback."
        }
      ],
      messages: [
        {
          role: "system",
          author: "Work Delivery Agent",
          timestamp: "15:26",
          chips: ["Normalized work item", "Defect profile", "Runtime verify"],
          body: `
            <p>The configured source adapter resolved <strong>DEF0842192</strong> and assembled cross-system context from similar work, pull requests, wiki hotspots, and linked test assets.</p>
            <ul>
              <li>Existing fix patterns point to <code>dev/sn-form</code> ownership rather than shared platform code.</li>
              <li>Browser reproduction succeeded in workspace only, so the runtime policy stayed on the UI validation path.</li>
              <li>Source sync policy permits labels, comments, attachments, and assignee changes only.</li>
            </ul>
          `,
        },
        {
          role: "user",
          author: "Delivery Operator",
          timestamp: "15:28",
          chips: ["Execution request"],
          body: `
            <p>Proceed through validation, update the PR package if verification remains clean, and pause before final source write-back.</p>
          `,
        },
        {
          role: "agent",
          author: "Validation Mesh",
          timestamp: "15:31",
          chips: ["VerifyBot", "UnitTestBot", "Context assembly"],
          body: `
            <p>The latest pass remains clean. Runtime verification and affected unit tests both passed, while functional test generation found one missing regression scenario for list filtering.</p>
            <ul>
              <li>Primary outcome: <strong>Fix verified</strong></li>
              <li>Packaging action: append generated regression test before label sync</li>
              <li>Next recommendation: open human gate for comment and attachment sync</li>
            </ul>
          `,
        },
      ],
    },
    {
      id: "story-github",
      title: "Implement GitHub issue driven story workflow",
      source: "GitHub / knockdown#42",
      time: "19m ago",
      stage: "Planning",
      profile: "Story",
      sourceGraph: "GitHub Issues + Repo Docs",
      workflowStage: "Planning",
      meta: ["Owner: Platform DX", "Acceptance criteria present", "PR required"],
      insights: [
        {
          label: "Confidence",
          value: "Medium",
          tone: "neutral"
        },
        {
          label: "Scope",
          value: "3 workstreams",
          tone: "good"
        },
        {
          label: "Dependencies",
          value: "2 repos",
          tone: "warn"
        },
        {
          label: "Approval",
          value: "Architect review",
          tone: "neutral"
        }
      ],
      timeline: [
        {
          stage: "Intake",
          state: "completed",
          summary: "Issue normalized into a story profile."
        },
        {
          stage: "Context Assembly",
          state: "completed",
          summary: "Repo docs, related PRs, and acceptance criteria loaded."
        },
        {
          stage: "Planning",
          state: "active",
          summary: "Implementation plan split into runtime, lifecycle, and UI workstreams."
        },
        {
          stage: "Execution",
          state: "pending",
          summary: "Waiting for delivery plan confirmation."
        }
      ],
      messages: [
        {
          role: "system",
          author: "Work Delivery Agent",
          timestamp: "15:08",
          chips: ["GitHub adapter", "Story profile", "Docs-first"],
          body: `
            <p>The issue was normalized as a <strong>story</strong>. Acceptance criteria were extracted from the issue body and compared against repository documentation and prior pull requests.</p>
          `,
        },
        {
          role: "agent",
          author: "Planning Layer",
          timestamp: "15:13",
          chips: ["Implementation plan", "Cross-repo impact"],
          body: `
            <p>The work splits into three deliverables: source adapter runtime wiring, lifecycle dispatch, and UI affordances for connector health.</p>
            <ul>
              <li>Suggested validation mode: acceptance criteria plus repo-local tests</li>
              <li>Suggested reviewer set: architect review only if SCM abstraction changes</li>
            </ul>
          `,
        },
      ],
    },
    {
      id: "case-direct",
      title: "Customer case triage for failing provisioning flow",
      source: "Direct input / Customer case",
      time: "48m ago",
      stage: "Diagnosis",
      profile: "Case",
      sourceGraph: "Direct Input + KB + Runtime Context",
      workflowStage: "Diagnosis",
      meta: ["No PR path yet", "Workaround allowed", "Source sync comments only"],
      insights: [
        {
          label: "Confidence",
          value: "Low",
          tone: "warn"
        },
        {
          label: "Likely cause",
          value: "Environment mismatch",
          tone: "good"
        },
        {
          label: "Code change",
          value: "Not needed yet",
          tone: "neutral"
        },
        {
          label: "Customer sync",
          value: "Comment-only",
          tone: "neutral"
        }
      ],
      timeline: [
        {
          stage: "Intake",
          state: "completed",
          summary: "Direct input converted into case profile."
        },
        {
          stage: "Diagnosis",
          state: "active",
          summary: "Knowledge sources suggest a configuration scope mismatch."
        },
        {
          stage: "Workaround",
          state: "pending",
          summary: "Awaiting environment validation."
        },
        {
          stage: "Source Sync",
          state: "pending",
          summary: "Will publish summary comment after workaround validation."
        }
      ],
      messages: [
        {
          role: "system",
          author: "Case Resolution Agent",
          timestamp: "14:42",
          chips: ["Case profile", "Knowledge search", "Runtime inventory"],
          body: `
            <p>The case currently points to an environment mismatch, not a confirmed product defect. Knowledge sources show a similar failure resolved through connector scope repair.</p>
          `,
        },
        {
          role: "agent",
          author: "Diagnosis Mesh",
          timestamp: "14:49",
          chips: ["Workaround candidate"],
          body: `
            <p>Recommended next step: validate the connector scope workaround against the staging environment before opening any code-change branch.</p>
          `,
        },
      ],
    },
  ],
  connectors: [
    {
      id: "servicenow-bt1",
      name: "ServiceNow BT1 (OOTB)",
      status: "LIVE",
      mode: "Source + writeback connector",
      detail: "Defects, stories, labels, comments, attachments, semantic similar-work lookup, and runtime pool metadata.",
      meta: "Config: config/connectors/servicenow-bt1.json • Auth: OAuth + integration user • Policy: guarded writes",
      health: "92%",
      latency: "240ms median",
      capabilities: ["Source reads", "Label sync", "Comments", "Attachments", "Validation run creation"],
      env: ["KNOCKDOWN_SOURCE_CONNECTOR", "KNOCKDOWN_SOURCE_BASE_URL", "BT1_OAUTH_TOKEN", "SN_PROXY_URL"],
      operations: ["add_label", "remove_label", "add_comment", "add_attachment", "update_work_item", "create_validation_run"]
    },
    {
      id: "github-issues",
      name: "GitHub Issues (OOTB)",
      status: "LIVE",
      mode: "SCM + issue source",
      detail: "Issues, pull requests, repository code, docs, branch metadata, labels, and assignees.",
      meta: "Config: config/connectors/github-issues.json • Auth: PAT / App token • Policy: issue + PR sync",
      health: "98%",
      latency: "180ms median",
      capabilities: ["Issue reads", "Repo search", "PR metadata", "Issue comments", "Label sync"],
      env: ["KNOCKDOWN_SOURCE_CONNECTOR", "GH_OWNER", "GH_REPO", "GH_TOKEN"],
      operations: ["issue_read", "issue_write", "search_issues", "pull_request_read"]
    },
    {
      id: "playwright",
      name: "Playwright MCP",
      status: "STAGED",
      mode: "Validation runtime",
      detail: "Browser reproduction, UI verification, and live evidence capture for runtime-backed profiles.",
      meta: "Config: connector specific runtime policy • Auth: session / creds • Coverage: validation stages",
      health: "Warmup",
      latency: "Session-based",
      capabilities: ["Runtime reproduction", "Verification", "Screenshots", "Interactive diagnostics"],
      env: ["PLAYWRIGHT_BROWSERS_PATH", "INSTANCE_URL", "ADMIN_USERNAME", "ADMIN_PASSWORD"],
      operations: ["browser_navigate", "browser_snapshot", "browser_evaluate", "browser_screenshot"]
    },
    {
      id: "knowledge-plane",
      name: "Compiled Knowledge Plane",
      status: "LIVE",
      mode: "Context provider",
      detail: "Root cause clusters, file hotspots, anti-patterns, related SMEs, and prior delivery intelligence.",
      meta: "Config: config/context-providers/*.yaml • Auth: inherited • Policy: read-only",
      health: "100%",
      latency: "Cached",
      capabilities: ["Similar work context", "Hotspots", "KB fusion", "SME hints"],
      env: ["SME_DIR", "REPO_*"],
      operations: ["context_lookup", "knowledge_query", "repo_map_resolution"]
    },
    {
      id: "enterprise-template",
      name: "Enterprise Connector Template",
      status: "STAGED",
      mode: "Customer connector slot",
      detail: "Starting point for Jira, Linear, Zendesk, Salesforce, or internal systems through adapter and capability config.",
      meta: "Config: config/connectors/template.json • Auth: customer-defined • Coverage: source-specific",
      health: "Not configured",
      latency: "N/A",
      capabilities: ["Custom source reads", "Custom writeback", "Vendor-specific routing"],
      env: ["KNOCKDOWN_SOURCE_BASE_URL", "KNOCKDOWN_SOURCE_TOKEN", "KNOCKDOWN_SOURCE_USERNAME"],
      operations: ["replace_with_customer_operations"]
    },
  ],
  providers: [
    {
      name: "Similar work",
      source: "Connector-bound search tools, issue search, historical records"
    },
    {
      name: "Test assets",
      source: "Repo discovery, linked test cases, automation parsers"
    },
    {
      name: "Knowledge base",
      source: "Wiki query, KB articles, prior run reports"
    },
    {
      name: "Runtime metadata",
      source: "Instance pools, deploy paths, environment notes"
    }
  ],
  policies: [
    {
      label: "Require reproduction",
      value: "Profile-based"
    },
    {
      label: "Require PR before sync",
      value: "Connector policy"
    },
    {
      label: "Pause on missing context",
      value: "Enabled"
    },
    {
      label: "Capability resolution",
      value: "Config-driven"
    }
  ]
};
