window.KNOCKDOWN_CONSOLE_DATA = {
  queueHealth: [
    {
      label: "Active runs",
      value: "18",
      note: "5 waiting on gates across chained playbooks"
    },
    {
      label: "Playbooks live",
      value: "9",
      note: "Defect, story, case, and shared governance flows"
    },
    {
      label: "Decision trace coverage",
      value: "100%",
      note: "Every route emits a persisted routing artifact"
    }
  ],
  templates: [
    {
      id: "template-defect",
      title: "Defect to PR",
      meta: "Intake, fix, verify, closeout",
      profile: "Defect",
      sourceGraph: "Configured source + repo + runtime",
      stage: "Intake",
      prompt: "Normalize the defect, detect the correct playbook chain, assemble related work, and stage the safest fix plan before code changes."
    },
    {
      id: "template-story",
      title: "Story Delivery",
      meta: "Clarify, implement, validate",
      profile: "Story",
      sourceGraph: "Issue source + docs + tests",
      stage: "Planning",
      prompt: "Route this requirement into the right story delivery playbook, map dependencies, and produce an implementation-ready execution plan."
    },
    {
      id: "template-case",
      title: "Case Resolution",
      meta: "Diagnose, workaround, sync",
      profile: "Case",
      sourceGraph: "Case source + KB + runtime context",
      stage: "Diagnosis",
      prompt: "Run the case diagnosis playbook, look for known issue patterns, and decide whether the chain should escalate into a defect workflow."
    }
  ],
  profiles: [
    {
      id: "defect",
      name: "Defect",
      status: "ACTIVE",
      description: "Bug investigation and resolution with reproduction, RCA, validation, and guarded writeback.",
      policySummary: "Requires reproduction, fix validation, and PR packaging for code changes.",
      defaultPlaybook: "defect-intake",
      stages: ["intake", "classify", "validity", "enrich", "plan", "prepare_environment", "execute", "review", "validate", "harden", "package", "source_sync", "learn"],
      validationModes: ["runtime_reproduction_check", "browser_verify", "api_verify", "unit_tests", "functional_tests"],
      outputs: ["outcome", "report", "pull_request", "regression_tests"],
      gates: ["architect review", "critic review", "source sync approval"]
    },
    {
      id: "story",
      name: "Story",
      status: "ACTIVE",
      description: "Implementation profile for feature work and enhancements driven by acceptance criteria and repo context.",
      policySummary: "Requires acceptance criteria, implementation plan, and PR review for code changes.",
      defaultPlaybook: "story-intake",
      stages: ["intake", "classify", "validity", "enrich", "plan", "prepare_environment", "execute", "review", "validate", "harden", "package", "source_sync", "learn"],
      validationModes: ["acceptance_criteria_validation", "runtime_verify_if_applicable", "api_verify_if_applicable", "unit_tests"],
      outputs: ["outcome", "implementation_summary", "report", "rollout_notes"],
      gates: ["architect review", "product-owner approval"]
    },
    {
      id: "case",
      name: "Case",
      status: "ACTIVE",
      description: "Diagnosis-first profile for support cases, workarounds, escalation, and customer-safe source sync.",
      policySummary: "Allows workaround-only completion and comment-safe source sync before escalating to a defect chain.",
      defaultPlaybook: "case-diagnosis",
      stages: ["intake", "classify", "dedup", "enrich", "diagnose", "workaround", "source_sync", "learn"],
      validationModes: ["environment_validation", "known_issue_match", "manual_checkpoint"],
      outputs: ["outcome", "diagnosis", "customer_safe_summary", "next_action"],
      gates: ["customer-safe writeback", "fix escalation approval"]
    },
    {
      id: "task",
      name: "Task",
      status: "STAGED",
      description: "General execution profile for operational tasks, automation follow-ups, and scoped delivery requests.",
      policySummary: "Uses lighter validation and package rules unless the task escalates into story or defect behavior.",
      defaultPlaybook: "task-intake",
      stages: ["intake", "classify", "enrich", "plan", "execute", "review", "source_sync"],
      validationModes: ["manual_checkpoint", "script_validation"],
      outputs: ["outcome", "summary", "next_action"],
      gates: ["execution approval when risky"]
    },
    {
      id: "research",
      name: "Research",
      status: "STAGED",
      description: "Recommendation profile for spikes, investigations, architecture questions, and option analysis.",
      policySummary: "Optimized for evidence gathering, analysis, and decision artifact production rather than code change.",
      defaultPlaybook: "research-intake",
      stages: ["intake", "clarify", "enrich", "analyze", "review", "publish"],
      validationModes: ["evidence_review", "manual_signoff"],
      outputs: ["outcome", "recommendation", "tradeoffs", "next_action"],
      gates: ["review before publish"]
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
      meta: ["Owner: UXC Controls", "Playbook chain: intake -> fix -> verify", "Human gate: PR + source sync"],
      insights: [
        { label: "Confidence", value: "High", tone: "good" },
        { label: "Risk", value: "Medium", tone: "warn" },
        { label: "Validation", value: "2 / 3 passed", tone: "neutral" },
        { label: "Writeback", value: "Guarded", tone: "good" }
      ],
      timeline: [
        { stage: "Intake", state: "completed", summary: "Defect intake playbook normalized the work item and selected the defect-fix chain." },
        { stage: "Context Assembly", state: "completed", summary: "Related work, repo mappings, wiki entries, and tests loaded." },
        { stage: "RCA & Fix", state: "completed", summary: "Patch prepared and packaged with approval-review artifacts." },
        { stage: "Validation", state: "active", summary: "Runtime verification is green; one generated regression scenario still missing." },
        { stage: "Source Sync", state: "pending", summary: "Blocked on human approval for comment and attachment writeback." }
      ],
      messages: [
        {
          role: "system",
          author: "Work Delivery Agent",
          timestamp: "15:26",
          chips: ["Routing result", "Defect profile", "Runtime verify"],
          body: `
            <p>The routing layer selected <strong>defect-intake</strong> with 0.91 confidence, then chained into <strong>defect-fix</strong> after normalization.</p>
            <ul>
              <li>Existing fix patterns point to <code>dev/sn-form</code> ownership rather than shared platform code.</li>
              <li>The current gate posture allows comments and attachments, but PR creation remains approval-bound.</li>
              <li>Decision trace and output contract artifacts have been attached to the run record.</li>
            </ul>
          `
        },
        {
          role: "user",
          author: "Delivery Operator",
          timestamp: "15:28",
          chips: ["Execution request"],
          body: `
            <p>Proceed through validation, update the PR package if verification remains clean, and pause before final source write-back.</p>
          `
        },
        {
          role: "agent",
          author: "Validation Mesh",
          timestamp: "15:31",
          chips: ["VerifyBot", "Decision trace", "Context assembly"],
          body: `
            <p>The latest pass remains clean. Runtime verification and affected unit tests both passed, while functional test generation found one missing regression scenario for list filtering.</p>
            <ul>
              <li>Primary outcome: <strong>Fix verified</strong></li>
              <li>Packaging action: append generated regression test before label sync</li>
              <li>Next recommendation: open human gate for comment and attachment sync</li>
            </ul>
          `
        }
      ]
    },
    {
      id: "story-github",
      title: "Implement GitHub issue driven story workflow",
      source: "GitHub / knowdown/framework#42",
      time: "19m ago",
      stage: "Planning",
      profile: "Story",
      sourceGraph: "GitHub Issues + Repo Docs",
      workflowStage: "Planning",
      meta: ["Owner: Platform DX", "Playbook: story-delivery", "PR required"],
      insights: [
        { label: "Confidence", value: "Medium", tone: "neutral" },
        { label: "Scope", value: "3 workstreams", tone: "good" },
        { label: "Dependencies", value: "2 repos", tone: "warn" },
        { label: "Approval", value: "Architect review", tone: "neutral" }
      ],
      timeline: [
        { stage: "Intake", state: "completed", summary: "Issue normalized into a story profile." },
        { stage: "Context Assembly", state: "completed", summary: "Repo docs, related PRs, and acceptance criteria loaded." },
        { stage: "Planning", state: "active", summary: "Implementation plan split into runtime, lifecycle, and UI workstreams." },
        { stage: "Execution", state: "pending", summary: "Waiting for delivery plan confirmation." }
      ],
      messages: [
        {
          role: "system",
          author: "Work Delivery Agent",
          timestamp: "15:08",
          chips: ["GitHub adapter", "Story profile", "Docs-first"],
          body: `
            <p>The issue was normalized as a <strong>story</strong>. Acceptance criteria were extracted from the issue body and compared against repository documentation and prior pull requests.</p>
          `
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
          `
        }
      ]
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
      meta: ["No PR path yet", "Playbook: case-diagnosis", "Source sync comments only"],
      insights: [
        { label: "Confidence", value: "Low", tone: "warn" },
        { label: "Likely cause", value: "Environment mismatch", tone: "good" },
        { label: "Code change", value: "Not needed yet", tone: "neutral" },
        { label: "Customer sync", value: "Comment-only", tone: "neutral" }
      ],
      timeline: [
        { stage: "Intake", state: "completed", summary: "Direct input converted into case profile." },
        { stage: "Diagnosis", state: "active", summary: "Knowledge sources suggest a configuration scope mismatch." },
        { stage: "Workaround", state: "pending", summary: "Awaiting environment validation." },
        { stage: "Source Sync", state: "pending", summary: "Will publish summary comment after workaround validation." }
      ],
      messages: [
        {
          role: "system",
          author: "Case Resolution Agent",
          timestamp: "14:42",
          chips: ["Case profile", "Knowledge search", "Runtime inventory"],
          body: `
            <p>The case currently points to an environment mismatch, not a confirmed product defect. Knowledge sources show a similar failure resolved through connector scope repair.</p>
          `
        },
        {
          role: "agent",
          author: "Diagnosis Mesh",
          timestamp: "14:49",
          chips: ["Workaround candidate", "Chain trigger pending"],
          body: `
            <p>Recommended next step: validate the connector scope workaround against the staging environment before opening any code-change branch.</p>
          `
        }
      ]
    }
  ],
  connectors: [
    {
      id: "servicenow-bt1",
      name: "ServiceNow BT1 (OOTB)",
      status: "LIVE",
      mode: "Source + proxy-backed write connector",
      detail: "Defects, stories, labels, comments, attachments, semantic similar-work lookup, and runtime pool metadata.",
      meta: "Config: config/connectors/servicenow-bt1.json • Auth: source proxy credentials • Policy: guarded writes",
      health: "92%",
      latency: "240ms median",
      capabilities: ["Source reads", "Label sync", "Comments", "Attachments", "Validation run creation"],
      env: ["KNOCKDOWN_SOURCE_CONNECTOR", "KNOCKDOWN_SOURCE_RUNTIME_MODE", "KNOCKDOWN_SOURCE_BASE_URL", "SN_PROXY_URL", "SN_PROXY_USERNAME", "SN_PROXY_PASSWORD", "BT1_USER"],
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
    }
  ],
  adminConsole: {
    sections: [
      "connector_catalog",
      "runtime_mode_selector",
      "mcp_fabric",
      "tool_mapping_inspector",
      "env_and_secret_bindings",
      "writeback_policy_inspector"
    ],
    connectorProfiles: [
      {
        id: "servicenow-bt1",
        name: "ServiceNow BT1 (OOTB)",
        status: "LIVE",
        category: "OOTB source connector",
        summary: "Stable BT1-like contract with a generic proxy runtime or direct vendor MCP replacement.",
        connectorFile: "config/connectors/servicenow-bt1.json",
        sourceConfig: "config/sources/bt1.yaml",
        contractFile: "config/connectors/source-proxy-tool-contract.json",
        adminCatalogFile: "config/connectors/admin-console.catalog.json",
        tags: ["ootb", "servicenow", "defect-workflow", "proxy-ready"],
        activeRuntimeMode: "proxy_mcp",
        runtimeModeEnvVar: "KNOCKDOWN_SOURCE_RUNTIME_MODE",
        namespaceEnvVar: "KNOCKDOWN_SOURCE_PROXY_NAMESPACE",
        runtimeModes: [
          {
            id: "proxy_mcp",
            label: "Proxy MCP",
            kind: "proxy",
            description: "Expose a stable BT1-like tool surface through source-proxy-mcp and route each tool through configured HTTP bindings.",
            requiredServerNames: ["source_proxy"],
            notes: ["Best fit for external environments without a native BT1 MCP", "Keeps request and response shapes stable for existing agents"]
          },
          {
            id: "vendor_mcp",
            label: "Vendor MCP",
            kind: "replacement",
            description: "Bypass the generic proxy at runtime and bind each stable capability to a native vendor MCP server.",
            requiredServerNames: ["buildtools1", "sn_proxy"],
            notes: ["Keeps the stable control-plane contract visible", "Uses configured vendor tool mappings instead of proxy transport"]
          }
        ],
        mcpFabric: {
          namespace: "source_proxy",
          serverName: "source-proxy-mcp",
          runtimeModeEnvVar: "KNOCKDOWN_SOURCE_RUNTIME_MODE",
          namespaceEnvVar: "KNOCKDOWN_SOURCE_PROXY_NAMESPACE",
          sourceBaseUrlEnvVar: "KNOCKDOWN_SOURCE_BASE_URL",
          proxyBaseUrlEnvVar: "SN_PROXY_URL",
          sourceReadPath: "mcp__buildtools1__* or source_proxy::*",
          sourceWritePath: "mcp__sn_proxy__* or source_proxy::*"
        },
        toolMappings: [
          {
            stableTool: "get_work_item_context",
            aliases: ["bt1_get_defect"],
            bindingId: "get_work_item_context",
            strategy: "http_json",
            requestContract: "{ identifier, fields[] }",
            responseContract: "{ result, raw_result, found }",
            vendorTool: "mcp__buildtools1__get_work_item_context",
            policy: "read-only"
          },
          {
            stableTool: "find_similar_defects",
            aliases: ["find_similar_work_items"],
            bindingId: "find_similar_defects",
            strategy: "http_json",
            requestContract: "{ query_text, additional_condition?, limit?, document_match_threshold? }",
            responseContract: "{ results[], raw_results[], count }",
            vendorTool: "mcp__buildtools1__find_similar_defects",
            policy: "read-only"
          },
          {
            stableTool: "global_ai_search",
            aliases: [],
            bindingId: "global_ai_search",
            strategy: "http_json",
            requestContract: "{ query, max_results?, similarity_threshold? }",
            responseContract: "{ results[], raw_results[], count }",
            vendorTool: "mcp__buildtools1__global_ai_search",
            policy: "read-only"
          },
          {
            stableTool: "query_source_records",
            aliases: ["query_bt1_table"],
            bindingId: "query_source_records",
            strategy: "http_json",
            requestContract: "{ table, sysparm_query?, sysparm_fields?, sysparm_limit? }",
            responseContract: "{ results[], raw_results[], count }",
            vendorTool: "mcp__claude_ai_BT1_MCP__query_bt1_table",
            policy: "read-only"
          },
          {
            stableTool: "work_item_add_label",
            aliases: ["bt1_add_tag"],
            bindingId: "add_label",
            strategy: "http_json",
            requestContract: "{ work_item_id, label_name }",
            responseContract: "{ result/raw transport response }",
            vendorTool: "mcp__sn_proxy__bt1_add_tag",
            policy: "writeback: labels"
          },
          {
            stableTool: "work_item_add_comment",
            aliases: ["bt1_add_work_note"],
            bindingId: "add_comment",
            strategy: "http_json",
            requestContract: "{ work_item_id, comment }",
            responseContract: "{ result/raw transport response }",
            vendorTool: "mcp__sn_proxy__bt1_add_work_note",
            policy: "writeback: comments"
          },
          {
            stableTool: "work_item_update",
            aliases: ["bt1_update_defect"],
            bindingId: "update_work_item",
            strategy: "http_json",
            requestContract: "{ work_item_id, fields }",
            responseContract: "{ result/raw transport response }",
            vendorTool: "mcp__sn_proxy__bt1_update_defect",
            policy: "writeback: guarded fields only"
          }
        ],
        envBindings: [
          {
            key: "KNOCKDOWN_SOURCE_CONNECTOR",
            scope: "connector selector",
            kind: "env",
            modes: ["proxy_mcp", "vendor_mcp"],
            note: "Resolves the active connector profile."
          },
          {
            key: "KNOCKDOWN_SOURCE_RUNTIME_MODE",
            scope: "runtime selector",
            kind: "env",
            modes: ["proxy_mcp", "vendor_mcp"],
            note: "Chooses proxy transport versus vendor-native MCP replacement."
          },
          {
            key: "KNOCKDOWN_SOURCE_PROXY_NAMESPACE",
            scope: "tool namespace",
            kind: "env",
            modes: ["proxy_mcp", "vendor_mcp"],
            note: "Controls the namespace label advertised by the proxy MCP surface."
          },
          {
            key: "KNOCKDOWN_SOURCE_BASE_URL",
            scope: "source endpoint",
            kind: "env",
            modes: ["proxy_mcp", "vendor_mcp"],
            note: "Canonical source-system base URL."
          },
          {
            key: "SN_PROXY_URL",
            scope: "proxy transport",
            kind: "env",
            modes: ["proxy_mcp"],
            note: "Base URL used by the ServiceNow write/read proxy bindings."
          },
          {
            key: "SN_PROXY_USERNAME",
            scope: "proxy auth",
            kind: "secret",
            modes: ["proxy_mcp"],
            note: "Username for the generic proxy transport."
          },
          {
            key: "SN_PROXY_PASSWORD",
            scope: "proxy auth",
            kind: "secret",
            modes: ["proxy_mcp"],
            note: "Password for the generic proxy transport."
          },
          {
            key: "BT1_USER",
            scope: "autopilot convenience",
            kind: "env",
            modes: ["vendor_mcp"],
            note: "Only used by the OOTB BT1 autopilot default assignee lookup."
          }
        ],
        secretBindings: [
          {
            label: "ServiceNow proxy credentials",
            scope: "connector scope",
            note: "Used by source-proxy-mcp when runtime mode is proxy_mcp."
          },
          {
            label: "Vendor MCP session or OAuth",
            scope: "environment scope",
            note: "Resolved outside the static UI when runtime mode is vendor_mcp."
          }
        ],
        writePolicy: {
          allowComments: true,
          allowLabels: true,
          allowAttachments: true,
          allowFieldUpdates: ["assigned_to"],
          denyFieldUpdates: ["state", "u_yw_state"],
          approvalPosture: "Guarded source sync and policy-checked writes"
        }
      },
      {
        id: "github-issues",
        name: "GitHub Issues (OOTB)",
        status: "LIVE",
        category: "OOTB SCM/source connector",
        summary: "Issue and repository connector used for stories, tasks, pull requests, and code search.",
        connectorFile: "config/connectors/github-issues.json",
        sourceConfig: "config/sources/github-issues.yaml",
        contractFile: "native vendor MCP surface",
        adminCatalogFile: "config/connectors/admin-console.catalog.json",
        tags: ["ootb", "github", "issues", "repo-context"],
        activeRuntimeMode: "vendor_mcp",
        runtimeModeEnvVar: "KNOCKDOWN_SOURCE_RUNTIME_MODE",
        namespaceEnvVar: "KNOCKDOWN_SOURCE_PROXY_NAMESPACE",
        runtimeModes: [
          {
            id: "vendor_mcp",
            label: "Vendor MCP",
            kind: "replacement",
            description: "Use the GitHub MCP surface directly for issue, repo, and PR operations.",
            requiredServerNames: ["github"],
            notes: ["No generic proxy binding defined yet", "Best fit for repo and issue native workflows"]
          }
        ],
        mcpFabric: {
          namespace: "github",
          serverName: "github-mcp-server",
          runtimeModeEnvVar: "KNOCKDOWN_SOURCE_RUNTIME_MODE",
          namespaceEnvVar: "KNOCKDOWN_SOURCE_PROXY_NAMESPACE",
          sourceBaseUrlEnvVar: "KNOCKDOWN_GITHUB_HOST",
          proxyBaseUrlEnvVar: "not_applicable",
          sourceReadPath: "mcp__github__issue_read / search_issues / search_code",
          sourceWritePath: "mcp__github__issue_write / create_pull_request"
        },
        toolMappings: [
          {
            stableTool: "issue_read",
            aliases: [],
            bindingId: "native.issue_read",
            strategy: "vendor_mcp",
            requestContract: "{ owner?, repo?, issue_number }",
            responseContract: "{ title, body, labels, assignees, metadata }",
            vendorTool: "mcp__github__issue_read",
            policy: "read-only"
          },
          {
            stableTool: "search_issues",
            aliases: [],
            bindingId: "native.search_issues",
            strategy: "vendor_mcp",
            requestContract: "{ query }",
            responseContract: "{ results[] }",
            vendorTool: "mcp__github__search_issues",
            policy: "read-only"
          },
          {
            stableTool: "issue_write",
            aliases: [],
            bindingId: "native.issue_write",
            strategy: "vendor_mcp",
            requestContract: "{ comment?, labels?, assignees?, state? }",
            responseContract: "{ result }",
            vendorTool: "mcp__github__issue_write",
            policy: "writeback: issue-safe fields"
          }
        ],
        envBindings: [
          {
            key: "KNOCKDOWN_GITHUB_HOST",
            scope: "github host",
            kind: "env",
            modes: ["vendor_mcp"],
            note: "GitHub host override for enterprise environments."
          },
          {
            key: "GH_OWNER",
            scope: "repo scope",
            kind: "env",
            modes: ["vendor_mcp"],
            note: "Default issue/repo owner."
          },
          {
            key: "GH_REPO",
            scope: "repo scope",
            kind: "env",
            modes: ["vendor_mcp"],
            note: "Default issue/repo name."
          },
          {
            key: "GH_TOKEN",
            scope: "github auth",
            kind: "secret",
            modes: ["vendor_mcp"],
            note: "PAT or app-scoped token for issue and repo operations."
          }
        ],
        secretBindings: [
          {
            label: "GitHub token or app installation secret",
            scope: "connector scope",
            note: "Used for issue sync, repository reads, and PR creation."
          }
        ],
        writePolicy: {
          allowComments: true,
          allowLabels: true,
          allowAttachments: false,
          allowFieldUpdates: ["assignees", "labels", "milestone", "state"],
          denyFieldUpdates: [],
          approvalPosture: "Issue and PR writeback stays within GitHub policy boundaries"
        }
      },
      {
        id: "enterprise-template",
        name: "Enterprise Connector Template",
        status: "STAGED",
        category: "Customer-editable template",
        summary: "Starting point for a reusable external-environment connector with either generic proxy or vendor-native MCP runtime.",
        connectorFile: "config/connectors/template.json",
        sourceConfig: "config/sources/template.yaml",
        contractFile: "config/connectors/source-proxy-tool-contract.json",
        adminCatalogFile: "config/connectors/admin-console.catalog.json",
        tags: ["template", "customer-editable", "proxy-capable"],
        activeRuntimeMode: "proxy_mcp",
        runtimeModeEnvVar: "KNOCKDOWN_SOURCE_RUNTIME_MODE",
        namespaceEnvVar: "KNOCKDOWN_SOURCE_PROXY_NAMESPACE",
        runtimeModes: [
          {
            id: "proxy_mcp",
            label: "Proxy MCP",
            kind: "proxy",
            description: "Use source-proxy-mcp with a customer-defined HTTP implementation per stable tool.",
            requiredServerNames: ["source_proxy"],
            notes: ["Fastest path for external systems without a native MCP", "Lets legacy BT1-shaped flows run on new vendors"]
          },
          {
            id: "vendor_mcp",
            label: "Vendor MCP",
            kind: "replacement",
            description: "Swap the generic proxy with one or more customer/vendor MCP servers.",
            requiredServerNames: ["replace-with-vendor-server-name"],
            notes: ["Best when the enterprise already has first-class MCP servers", "Requires explicit tool mapping coverage"]
          }
        ],
        mcpFabric: {
          namespace: "source_proxy",
          serverName: "source-proxy-mcp",
          runtimeModeEnvVar: "KNOCKDOWN_SOURCE_RUNTIME_MODE",
          namespaceEnvVar: "KNOCKDOWN_SOURCE_PROXY_NAMESPACE",
          sourceBaseUrlEnvVar: "KNOCKDOWN_SOURCE_BASE_URL",
          proxyBaseUrlEnvVar: "customer-defined",
          sourceReadPath: "source_proxy::* or vendor-native read tools",
          sourceWritePath: "source_proxy::* or vendor-native write tools"
        },
        toolMappings: [
          {
            stableTool: "get_work_item_context",
            aliases: ["bt1_get_defect"],
            bindingId: "get_work_item_context",
            strategy: "http_json",
            requestContract: "{ identifier, fields[] }",
            responseContract: "{ result, raw_result, found }",
            vendorTool: "mcp__vendor__get_work_item_context",
            policy: "read-only"
          },
          {
            stableTool: "find_similar_defects",
            aliases: ["find_similar_work_items"],
            bindingId: "find_similar_defects",
            strategy: "http_json",
            requestContract: "{ query_text, limit?, threshold? }",
            responseContract: "{ results[], raw_results[], count }",
            vendorTool: "mcp__vendor__find_similar_work_items",
            policy: "read-only"
          },
          {
            stableTool: "work_item_update",
            aliases: [],
            bindingId: "update_work_item",
            strategy: "http_json",
            requestContract: "{ work_item_id, fields }",
            responseContract: "{ result }",
            vendorTool: "mcp__vendor__update_work_item",
            policy: "customer-defined writeback"
          }
        ],
        envBindings: [
          {
            key: "KNOCKDOWN_SOURCE_CONNECTOR",
            scope: "connector selector",
            kind: "env",
            modes: ["proxy_mcp", "vendor_mcp"],
            note: "Selects the customer connector profile."
          },
          {
            key: "KNOCKDOWN_SOURCE_BASE_URL",
            scope: "source endpoint",
            kind: "env",
            modes: ["proxy_mcp", "vendor_mcp"],
            note: "Base URL for the external source system."
          },
          {
            key: "KNOCKDOWN_SOURCE_TOKEN",
            scope: "source auth",
            kind: "secret",
            modes: ["proxy_mcp", "vendor_mcp"],
            note: "Bearer token or API token used by customer-defined bindings."
          },
          {
            key: "KNOCKDOWN_SOURCE_USERNAME",
            scope: "source auth",
            kind: "secret",
            modes: ["proxy_mcp", "vendor_mcp"],
            note: "Optional username for basic-auth implementations."
          },
          {
            key: "KNOCKDOWN_SOURCE_PASSWORD",
            scope: "source auth",
            kind: "secret",
            modes: ["proxy_mcp", "vendor_mcp"],
            note: "Optional password for basic-auth implementations."
          }
        ],
        secretBindings: [
          {
            label: "Customer source API credentials",
            scope: "connector scope",
            note: "Resolved per environment and never embedded in playbooks."
          }
        ],
        writePolicy: {
          allowComments: true,
          allowLabels: true,
          allowAttachments: true,
          allowFieldUpdates: [],
          denyFieldUpdates: [],
          approvalPosture: "Customer-defined and expected to be reviewed before promotion"
        }
      }
    ]
  },
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
    { label: "Require reproduction", value: "Profile-based" },
    { label: "Require PR before sync", value: "Connector policy" },
    { label: "Pause on missing context", value: "Enabled" },
    { label: "Capability resolution", value: "Config-driven" }
  ],
  secretBindings: [
    {
      label: "GitHub App installation",
      value: "Connector scope",
      detail: "Used for repo writes, issue sync, and workflow dispatches."
    },
    {
      label: "BT1 OAuth token",
      value: "Source scope",
      detail: "Allows guarded comment, label, and attachment writeback."
    },
    {
      label: "Runtime credentials",
      value: "Environment scope",
      detail: "Bound only to validation stages that require browser execution."
    },
    {
      label: "PAGES_ADMIN_TOKEN",
      value: "Frontend repo scope",
      detail: "Used for GitHub Pages configuration through API-managed deploy automation."
    }
  ],
  playbooks: [
    {
      id: "defect-intake",
      name: "Defect Intake",
      status: "ACTIVE",
      workload: "Defect",
      owner: "Platform DX",
      triggers: ["work_item.created", "queue.tick"],
      stages: ["normalize", "classify"],
      agents: ["BT1 source adapter"],
      workflows: [],
      gates: ["pause on missing context"],
      outputs: "defect_delivery",
      chains: ["defect-fix"]
    },
    {
      id: "defect-fix",
      name: "Defect Fix",
      status: "ACTIVE",
      workload: "Defect",
      owner: "Platform DX",
      triggers: ["playbook.completed:defect-intake"],
      stages: ["enrich", "execute_fix", "review"],
      agents: ["Context Assembler", "RCA Fix"],
      workflows: ["approval-review"],
      gates: ["architect approval", "PR gate"],
      outputs: "defect_delivery",
      chains: ["defect-verify"]
    },
    {
      id: "defect-verify",
      name: "Defect Verify",
      status: "ACTIVE",
      workload: "Defect",
      owner: "Platform DX",
      triggers: ["playbook.completed:defect-fix"],
      stages: ["verify_runtime", "harden"],
      agents: ["VerifyBot"],
      workflows: [".github/workflows/capability-doc-guard.yml"],
      gates: ["source sync approval"],
      outputs: "defect_delivery",
      chains: ["defect-closeout"]
    },
    {
      id: "story-delivery",
      name: "Story Delivery",
      status: "ACTIVE",
      workload: "Story",
      owner: "Platform DX",
      triggers: ["playbook.completed:story-intake"],
      stages: ["enrich", "implementation_plan", "execute", "review", "sync"],
      agents: ["Context Assembler"],
      workflows: [".github/workflows/capability-doc-guard.yml"],
      gates: ["architect review", "product-owner approval"],
      outputs: "story_delivery",
      chains: ["source-sync"]
    },
    {
      id: "case-diagnosis",
      name: "Case Diagnosis",
      status: "ACTIVE",
      workload: "Case",
      owner: "Support Automation",
      triggers: ["work_item.created", "queue.tick"],
      stages: ["enrich", "diagnose"],
      agents: ["Context Assembler", "TriageBot"],
      workflows: [],
      gates: ["customer-safe writeback"],
      outputs: "case_resolution",
      chains: ["defect-intake", "source-sync"]
    },
    {
      id: "source-sync",
      name: "Source Sync",
      status: "SHARED",
      workload: "Shared",
      owner: "Platform Governance",
      triggers: ["playbook.completed"],
      stages: ["policy_check", "writeback"],
      agents: ["Writeback policy engine"],
      workflows: [],
      gates: ["connector mutation policy"],
      outputs: "source_sync",
      chains: []
    }
  ],
  routingMatrix: [
    {
      workload: "Defect",
      signals: "DEF prefix, bug label, reproduction fields",
      playbook: "defect-intake",
      confidence: "0.91",
      fallback: "case-diagnosis"
    },
    {
      workload: "Story",
      signals: "enhancement label, acceptance criteria, repo hints",
      playbook: "story-intake",
      confidence: "0.84",
      fallback: "case-diagnosis"
    },
    {
      workload: "Case",
      signals: "support labels, customer impact, environment notes",
      playbook: "case-diagnosis",
      confidence: "0.78",
      fallback: "research"
    }
  ],
  workflowBindings: [
    {
      name: "Docs and release guard",
      target: "story-delivery / defect-verify",
      workflow: ".github/workflows/capability-doc-guard.yml",
      mode: "GitHub Actions",
      environment: "framework / main"
    },
    {
      name: "Frontend Pages deploy",
      target: "frontend-admin surfaces",
      workflow: ".github/workflows/deploy-pages.yml",
      mode: "GitHub Actions",
      environment: "frontend / main"
    },
    {
      name: "Runtime validation runner",
      target: "defect-verify",
      workflow: "playwright + MCP runtime",
      mode: "Runner + toolchain",
      environment: "staging"
    }
  ],
  chainGraph: [
    {
      name: "Case to fix escalation",
      nodes: ["case-diagnosis", "defect-intake", "defect-fix", "defect-verify", "source-sync"]
    },
    {
      name: "Story delivery path",
      nodes: ["story-intake", "story-delivery", "approval-review", "source-sync"]
    },
    {
      name: "Defect closeout path",
      nodes: ["defect-intake", "defect-fix", "defect-verify", "defect-closeout"]
    }
  ],
  liveRuns: [
    {
      id: "kd-run-184",
      status: "RUNNING",
      playbook: "defect-verify",
      stage: "verify_runtime",
      source: "BT1 / DEF0842192",
      duration: "18m",
      risk: "Medium",
      next: "Await source sync approval"
    },
    {
      id: "kd-run-177",
      status: "WAITING",
      playbook: "story-delivery",
      stage: "review",
      source: "GitHub / knowdown/framework#42",
      duration: "42m",
      risk: "High",
      next: "Architect approval required"
    },
    {
      id: "kd-run-171",
      status: "CHAINED",
      playbook: "case-diagnosis",
      stage: "diagnose",
      source: "Direct / customer case",
      duration: "9m",
      risk: "Low",
      next: "May trigger defect-intake"
    }
  ],
  decisionTrace: [
    {
      title: "DEF0842192 -> defect-intake",
      details: [
        "Matched DEF prefix from BT1 source adapter",
        "Detected bug semantics and reproduction fields",
        "Found runtime validation capability and repo mapping"
      ]
    },
    {
      title: "knockdown/framework#42 -> story-intake",
      details: [
        "GitHub issue carried enhancement semantics",
        "Acceptance criteria present in source record",
        "Delivery plan required cross-repo workflow binding"
      ]
    }
  ],
  failureHeatmap: [
    {
      area: "Connector auth drift",
      value: "3 blocked runs",
      note: "BT1 token refresh and one GitHub App scope mismatch"
    },
    {
      area: "Approval bottleneck",
      value: "2 waiting reviews",
      note: "Architect review latency above 20 minutes"
    },
    {
      area: "Runtime availability",
      value: "1 staged runtime warming",
      note: "Playwright environment not yet promoted to live"
    }
  ]
};
