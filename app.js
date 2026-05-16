const consoleData = window.KNOCKDOWN_CONSOLE_DATA || {};

const queueHealth = consoleData.queueHealth || [];
const templates = consoleData.templates || [];
const workTypes = consoleData.workTypes || [];
const onboardingWorkflow = consoleData.onboardingWorkflow || [];
const configSources = consoleData.configSources || [];
const profiles = consoleData.profiles || [];
const chats = consoleData.chats || [];
const connectors = consoleData.connectors || [];
const providers = consoleData.providers || [];
const policies = consoleData.policies || [];
const secretBindings = consoleData.secretBindings || [];
const liveRuns = consoleData.liveRuns || [];
const decisionTrace = consoleData.decisionTrace || [];
const failureHeatmap = consoleData.failureHeatmap || [];

const globalSearchInput = document.querySelector(".global-search input");
const workspaceKicker = document.getElementById("workspaceKicker");
const chatTitle = document.getElementById("chatTitle");
const chatMeta = document.getElementById("chatMeta");
const overviewStrip = document.getElementById("overviewStrip");

const historyList = document.getElementById("historyList");
const templateList = document.getElementById("templateList");

const setupSourceValue = document.getElementById("setupSourceValue");
const setupFlowValue = document.getElementById("setupFlowValue");
const setupPublishValue = document.getElementById("setupPublishValue");
const setupIntroList = document.getElementById("setupIntroList");
const setupFocus = document.getElementById("setupFocus");
const setupSourceCatalog = document.getElementById("setupSourceCatalog");
const workTypeRegistry = document.getElementById("workTypeRegistry");
const setupChecklistList = document.getElementById("setupChecklistList");
const setupConfigList = document.getElementById("setupConfigList");

const profileValue = document.getElementById("profileValue");
const sourceValue = document.getElementById("sourceValue");
const stageValue = document.getElementById("stageValue");
const nextActionValue = document.getElementById("nextActionValue");
const insightGrid = document.getElementById("insightGrid");
const runSummaryList = document.getElementById("runSummaryList");
const runDependencyList = document.getElementById("runDependencyList");
const timelineList = document.getElementById("timelineList");
const messageStream = document.getElementById("messageStream");

const runBoard = document.getElementById("runBoard");
const decisionTraceList = document.getElementById("decisionTrace");
const failureHeatmapList = document.getElementById("failureHeatmap");

const helpGlossary = document.getElementById("helpGlossary");
const connectorList = document.getElementById("connectorList");
const connectorFocus = document.getElementById("connectorFocus");
const providerGrid = document.getElementById("providerGrid");
const policyList = document.getElementById("policyList");
const secretBindingsList = document.getElementById("secretBindings");

const composerInput = document.getElementById("composerInput");
const attachContextButton = document.getElementById("attachContextButton");
const sendButton = document.getElementById("sendButton");
const exportBriefButton = document.getElementById("exportBriefButton");
const pauseRunButton = document.getElementById("pauseRunButton");
const launchRunButton = document.getElementById("launchRunButton");
const newRunButton = document.getElementById("newRunButton");
const connectSourceAdapterButton = document.getElementById("connectSourceAdapterButton");
const switchWorkTypeButton = document.getElementById("switchWorkTypeButton");
const contextDiagnosticsButton = document.getElementById("contextDiagnosticsButton");

const setupShortcut = document.getElementById("setupShortcut");
const runsShortcut = document.getElementById("runsShortcut");
const monitorShortcut = document.getElementById("monitorShortcut");
const workspaceTabs = Array.from(document.querySelectorAll(".workspace-tab"));

const historyToggle = document.getElementById("historyToggle");
const connectorToggle = document.getElementById("connectorToggle");
const historyPanel = document.getElementById("historyPanel");
const connectorPanel = document.getElementById("connectorPanel");
const filterChips = Array.from(document.querySelectorAll(".filter-chip"));

const workspacePanels = {
  setup: document.getElementById("setupPanel"),
  runs: document.getElementById("runsPanel"),
  monitor: document.getElementById("monitorPanel"),
};

let activeWorkspaceView = "setup";
let activeRunId = liveRuns[0]?.id || "";
let activeWorkTypeId = workTypes[0]?.id || "";
let activeConnectorId = connectors[0]?.id || "";
let activeFilter = "all";
let searchTerm = "";

const simpleGlossary = [
  { title: "Source system", detail: "Where work comes from, such as ServiceNow or GitHub." },
  { title: "Flow", detail: "A reusable automation template for one type of work." },
  { title: "Run", detail: "One execution of a flow." },
  { title: "Run thread", detail: "Troubleshooting notes for a run." },
];

function searchable(values) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

function matchesSearch(values) {
  if (!searchTerm) return true;
  return searchable(values).includes(searchTerm);
}

function connectorStatusClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (["live", "active", "running", "online"].includes(normalized)) return "live";
  if (["waiting", "chained", "shared"].includes(normalized)) return "pending";
  return "staged";
}

function insightToneClass(tone) {
  if (tone === "good") return "good";
  if (tone === "warn") return "warn";
  return "neutral";
}

function timelineStateClass(state) {
  if (state === "completed") return "completed";
  if (state === "active") return "active";
  return "pending";
}

function formatList(value, separator = ", ") {
  if (Array.isArray(value)) return value.join(separator);
  return value || "None";
}

function workTypeById(id) {
  return workTypes.find((item) => item.id === id) || null;
}

function profileForWorkType(workType) {
  if (!workType) return null;
  return profiles.find((profile) => profile.id === workType.profileId) || null;
}

function activeRun() {
  return liveRuns.find((run) => run.id === activeRunId) || liveRuns[0] || null;
}

function activeThread() {
  const run = activeRun();
  if (!run) return null;
  return chats.find((chat) => chat.id === run.threadId) || null;
}

function activeWorkType() {
  return workTypeById(activeWorkTypeId) || workTypes[0] || null;
}

function activeConnector() {
  return connectors.find((connector) => connector.id === activeConnectorId) || connectors[0] || null;
}

function visibleRuns() {
  return liveRuns.filter((run) => {
    const normalized = String(run.status || "").toLowerCase();
    const filterMatch = (
      activeFilter === "all" ||
      (activeFilter === "running" && normalized === "running") ||
      (activeFilter === "waiting" && (normalized === "waiting" || normalized === "chained"))
    );
    const workType = workTypeById(run.workTypeId);
    return filterMatch && matchesSearch([
      run.id,
      run.source,
      run.stage,
      run.status,
      run.next,
      run.owner,
      workType?.name,
    ]);
  });
}

function visibleTemplates() {
  return templates.filter((template) => matchesSearch([
    template.title,
    template.meta,
    template.profile,
    template.prompt,
  ]));
}

function visibleWorkTypes() {
  return workTypes.filter((workType) => matchesSearch([
    workType.name,
    workType.summary,
    workType.publishState,
    workType.approvalPosture,
    ...(workType.routingSignals || []),
  ]));
}

function visibleConnectors() {
  return connectors.filter((connector) => matchesSearch([
    connector.name,
    connector.detail,
    connector.mode,
    connector.meta,
  ]));
}

function ensureSelections() {
  const runs = visibleRuns();
  if (runs.length && !runs.some((run) => run.id === activeRunId)) {
    activeRunId = runs[0].id;
  }

  const workType = activeRun()?.workTypeId ? workTypeById(activeRun().workTypeId) : null;
  if (workType && !searchTerm) {
    activeWorkTypeId = workType.id;
  } else if (!visibleWorkTypes().some((item) => item.id === activeWorkTypeId) && visibleWorkTypes()[0]) {
    activeWorkTypeId = visibleWorkTypes()[0].id;
  }

  if (!visibleConnectors().some((item) => item.id === activeConnectorId) && visibleConnectors()[0]) {
    activeConnectorId = visibleConnectors()[0].id;
  }
}

function setWorkspaceView(view) {
  activeWorkspaceView = view;
  Object.entries(workspacePanels).forEach(([key, panel]) => {
    if (panel) panel.hidden = key !== view;
  });
  workspaceTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  renderHeader();
}

function renderHeader() {
  if (activeWorkspaceView === "setup") {
    const workType = activeWorkType();
    const connector = activeConnector();
    workspaceKicker.textContent = "Start here";
    chatTitle.textContent = "Set up a new automation flow";
    chatMeta.innerHTML = [
      connector?.name ? `Source: ${connector.name}` : "",
      workType?.name ? `Flow: ${workType.name}` : "",
      workType?.publishState ? `Status: ${workType.publishState}` : "",
    ].filter(Boolean).map((item) => `<span>${item}</span>`).join("");
    return;
  }

  if (activeWorkspaceView === "monitor") {
    workspaceKicker.textContent = "Live status";
    chatTitle.textContent = "Monitor automation health";
    chatMeta.innerHTML = "<span>See active runs, routing reasons, and problems that need attention.</span>";
    return;
  }

  const run = activeRun();
  const workType = workTypeById(run?.workTypeId);
  workspaceKicker.textContent = "Selected run";
  chatTitle.textContent = run ? `${run.id} · ${run.source}` : "No run selected";
  chatMeta.innerHTML = [
    workType?.name,
    run?.status ? `Status: ${run.status}` : "",
    run?.owner ? `Owner: ${run.owner}` : "",
    run?.approval ? run.approval : "",
  ].filter(Boolean).map((item) => `<span>${item}</span>`).join("");
}

function renderOverviewStrip() {
  overviewStrip.innerHTML = "";
  queueHealth.forEach((item) => {
    const card = document.createElement("div");
    card.className = "overview-card";
    card.innerHTML = `
      <div class="overview-label">${item.label}</div>
      <div class="overview-value">${item.value}</div>
      <div class="overview-note">${item.note}</div>
    `;
    overviewStrip.appendChild(card);
  });
}

function renderRunRail() {
  historyList.innerHTML = "";
  visibleRuns().forEach((run) => {
    const button = document.createElement("button");
    button.className = `history-item${run.id === activeRunId ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <div class="history-item-header">
        <div class="history-item-title">${run.id}</div>
        <div class="history-item-time">${run.duration}</div>
      </div>
      <div class="history-item-meta">
        <span class="history-item-source">${run.source}</span>
        <span class="history-item-stage">${run.stage}</span>
      </div>
    `;
    button.addEventListener("click", () => {
      activeRunId = run.id;
      activeWorkTypeId = run.workTypeId || activeWorkTypeId;
      setWorkspaceView("runs");
      renderAll();
      closePanelsOnMobile();
    });
    historyList.appendChild(button);
  });

  if (!historyList.children.length) {
    historyList.innerHTML = '<div class="history-empty">No runs match the current search or filter.</div>';
  }
}

function renderTemplates() {
  templateList.innerHTML = "";
  visibleTemplates().forEach((template) => {
    const button = document.createElement("button");
    button.className = "template-card";
    button.type = "button";
    button.innerHTML = `
      <span class="template-title">${template.title}</span>
      <span class="template-meta">${template.meta}</span>
    `;
    button.addEventListener("click", () => {
      createTemplateRun(template);
      closePanelsOnMobile();
    });
    templateList.appendChild(button);
  });

  if (!templateList.children.length) {
    templateList.innerHTML = '<div class="history-empty">No starter examples match the current search.</div>';
  }
}

function renderSetup() {
  const connector = activeConnector();
  const workType = activeWorkType();
  const profile = profileForWorkType(workType);

  setupSourceValue.textContent = connector?.name || "Choose a source";
  setupFlowValue.textContent = workType?.name || "Choose a flow";
  setupPublishValue.textContent = workType?.publishState || "Draft";

  setupIntroList.innerHTML = "";
  simpleGlossary.forEach((item) => {
    const row = document.createElement("div");
    row.className = "binding-row";
    row.innerHTML = `
      <div class="playbook-name">${item.title}</div>
      <div class="playbook-detail">${item.detail}</div>
    `;
    setupIntroList.appendChild(row);
  });

  setupFocus.innerHTML = `
    <div class="focus-kicker">Selected setup</div>
    <div class="focus-title-row">
      <h3 class="focus-title">${workType?.name || "Choose a flow"}</h3>
      <span class="connector-status ${connectorStatusClass(workType?.status)}">${workType?.status || "DRAFT"}</span>
    </div>
    <div class="focus-meta">${workType?.summary || "Pick a source and a flow template to begin."}</div>
    <div class="focus-stats">
      <div class="focus-stat">
        <span>Source</span>
        <strong>${connector?.name || "n/a"}</strong>
      </div>
      <div class="focus-stat">
        <span>Profile</span>
        <strong>${profile?.name || "n/a"}</strong>
      </div>
    </div>
    <div class="focus-section">
      <div class="focus-section-title">Main steps</div>
      <div class="focus-list">
        ${(workType?.playbooks || []).map((item) => `<div class="focus-list-item">${item}</div>`).join("")}
      </div>
    </div>
    <div class="focus-section">
      <div class="focus-section-title">Approval</div>
      <div class="focus-meta">${workType?.approvalPosture || "n/a"}</div>
    </div>
  `;

  setupSourceCatalog.innerHTML = "";
  visibleConnectors().forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `playbook-row${item.id === activeConnectorId ? " active-card" : ""}`;
    card.innerHTML = `
      <div class="playbook-title-row">
        <div>
          <div class="playbook-name">${item.name}</div>
          <div class="playbook-meta">${item.mode}</div>
        </div>
        <span class="connector-status ${connectorStatusClass(item.status)}">${item.status}</span>
      </div>
      <div class="playbook-detail">${item.detail}</div>
    `;
    card.addEventListener("click", () => {
      activeConnectorId = item.id;
      renderSetup();
      renderHelpPanel();
    });
    setupSourceCatalog.appendChild(card);
  });

  workTypeRegistry.innerHTML = "";
  visibleWorkTypes().forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `playbook-row${item.id === activeWorkTypeId ? " active-card" : ""}`;
    card.innerHTML = `
      <div class="playbook-title-row">
        <div>
          <div class="playbook-name">${item.name}</div>
          <div class="playbook-meta">${item.defaultRunMode}</div>
        </div>
        <span class="connector-status ${connectorStatusClass(item.status)}">${item.status}</span>
      </div>
      <div class="playbook-detail">${item.summary}</div>
    `;
    card.addEventListener("click", () => {
      activeWorkTypeId = item.id;
      renderSetup();
    });
    workTypeRegistry.appendChild(card);
  });

  setupChecklistList.innerHTML = "";
  onboardingWorkflow.slice(0, 5).forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "binding-row";
    row.innerHTML = `
      <div class="playbook-title-row">
        <div>
          <div class="playbook-name">${index + 1}. ${item.step}</div>
          <div class="playbook-meta">${item.owner}</div>
        </div>
        <span class="focus-chip">Do this</span>
      </div>
      <div class="playbook-detail">${item.detail}</div>
    `;
    setupChecklistList.appendChild(row);
  });
  [
    { label: "Dry-run with sample item", detail: "Test the flow before allowing real writeback." },
    { label: "Review writeback safety", detail: workType?.approvalPosture || "Check which updates are allowed." },
  ].forEach((item) => {
    const row = document.createElement("div");
    row.className = "binding-row";
    row.innerHTML = `
      <div class="playbook-name">${item.label}</div>
      <div class="playbook-detail">${item.detail}</div>
    `;
    setupChecklistList.appendChild(row);
  });

  setupConfigList.innerHTML = "";
  [...configSources, ...secretBindings.map((item) => ({
    label: item.label,
    detail: item.detail,
  }))].forEach((item) => {
    const row = document.createElement("div");
    row.className = "binding-row";
    row.innerHTML = `
      <div class="playbook-name">${item.label}</div>
      <div class="playbook-detail">${item.detail}</div>
    `;
    setupConfigList.appendChild(row);
  });
}

function renderRuns() {
  const run = activeRun();
  const thread = activeThread();
  const workType = workTypeById(run?.workTypeId);

  profileValue.textContent = workType?.name || "Unknown flow";
  sourceValue.textContent = run?.source || "No source";
  stageValue.textContent = run?.stage || "Idle";
  nextActionValue.textContent = run?.next || "Select a run";

  insightGrid.innerHTML = "";
  (thread?.insights || []).forEach((item) => {
    const card = document.createElement("div");
    card.className = `insight-card ${insightToneClass(item.tone)}`;
    card.innerHTML = `
      <div class="insight-label">${item.label}</div>
      <div class="insight-value">${item.value}</div>
    `;
    insightGrid.appendChild(card);
  });

  runSummaryList.innerHTML = "";
  [
    ["Run", run?.id || "n/a"],
    ["Owner", run?.owner || "n/a"],
    ["Current step", run?.stage || "n/a"],
    ["Approval", run?.approval || "n/a"],
    ["Risk", run?.risk || "n/a"],
    ["Next action", run?.next || "n/a"],
  ].forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "summary-row";
    row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    runSummaryList.appendChild(row);
  });

  runDependencyList.innerHTML = "";
  [
    `Flow chosen: ${workType?.name || "n/a"}`,
    `Triggered by: ${run?.trigger || "n/a"}`,
    `Source systems: ${formatList(run?.connectors || [])}`,
    `Outputs: ${formatList(run?.outputs || [])}`,
    `Summary: ${run?.summary || "n/a"}`,
  ].forEach((text) => {
    const row = document.createElement("div");
    row.className = "focus-list-item";
    row.textContent = text;
    runDependencyList.appendChild(row);
  });

  timelineList.innerHTML = "";
  (thread?.timeline || []).forEach((item) => {
    const row = document.createElement("div");
    row.className = `timeline-item ${timelineStateClass(item.state)}`;
    row.innerHTML = `
      <div class="timeline-marker"></div>
      <div class="timeline-copy">
        <div class="timeline-stage-row">
          <div class="timeline-stage">${item.stage}</div>
          <div class="timeline-state">${item.state}</div>
        </div>
        <div class="timeline-summary">${item.summary}</div>
      </div>
    `;
    timelineList.appendChild(row);
  });

  messageStream.innerHTML = "";
  (thread?.messages || []).forEach((message) => {
    const article = document.createElement("article");
    article.className = `message ${message.role}`;
    article.innerHTML = `
      <div class="message-top">
        <div>
          <div class="message-author">${message.author}</div>
          <div class="message-meta">${message.timestamp}</div>
        </div>
        <div class="message-chips">
          ${(message.chips || []).map((chip) => `<span class="message-chip">${chip}</span>`).join("")}
        </div>
      </div>
      <div class="message-body">${message.body}</div>
    `;
    messageStream.appendChild(article);
  });
}

function renderMonitor() {
  runBoard.innerHTML = "";
  liveRuns
    .filter((run) => matchesSearch([run.id, run.source, run.status, run.stage, run.next]))
    .forEach((run) => {
      const workType = workTypeById(run.workTypeId);
      const card = document.createElement("div");
      card.className = "run-card";
      card.innerHTML = `
        <div class="run-top">
          <div>
            <div class="playbook-name">${run.id}</div>
            <div class="playbook-meta">${workType?.name || "Unknown flow"} • ${run.source}</div>
          </div>
          <span class="connector-status ${connectorStatusClass(run.status)}">${run.status}</span>
        </div>
        <div class="run-meta">Step: ${run.stage} • Duration: ${run.duration} • Risk: ${run.risk}</div>
        <div class="playbook-detail">${run.next}</div>
      `;
      card.addEventListener("click", () => {
        activeRunId = run.id;
        activeWorkTypeId = run.workTypeId || activeWorkTypeId;
        setWorkspaceView("runs");
        renderAll();
      });
      runBoard.appendChild(card);
    });

  decisionTraceList.innerHTML = "";
  decisionTrace
    .filter((item) => matchesSearch([item.title, ...(item.details || [])]))
    .forEach((item) => {
      const row = document.createElement("div");
      row.className = "route-row";
      row.innerHTML = `
        <div class="playbook-name">${item.title}</div>
        <div class="focus-list">
          ${(item.details || []).map((detail) => `<div class="focus-list-item">${detail}</div>`).join("")}
        </div>
      `;
      decisionTraceList.appendChild(row);
    });

  failureHeatmapList.innerHTML = "";
  failureHeatmap
    .filter((item) => matchesSearch([item.area, item.value, item.note]))
    .forEach((item) => {
      const row = document.createElement("div");
      row.className = "heatmap-row";
      row.innerHTML = `
        <div class="playbook-title-row">
          <div>
            <div class="playbook-name">${item.area}</div>
            <div class="playbook-meta">${item.value}</div>
          </div>
        </div>
        <div class="playbook-detail">${item.note}</div>
      `;
      failureHeatmapList.appendChild(row);
    });
}

function renderHelpPanel() {
  helpGlossary.innerHTML = "";
  simpleGlossary.forEach((item) => {
    const row = document.createElement("div");
    row.className = "binding-row";
    row.innerHTML = `
      <div class="playbook-name">${item.title}</div>
      <div class="playbook-detail">${item.detail}</div>
    `;
    helpGlossary.appendChild(row);
  });

  connectorList.innerHTML = "";
  visibleConnectors().forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `connector-card${item.id === activeConnectorId ? " active" : ""}`;
    card.innerHTML = `
      <div class="connector-line">
        <div class="connector-name">${item.name}</div>
        <span class="connector-status ${connectorStatusClass(item.status)}">${item.status}</span>
      </div>
      <div class="connector-detail">${item.detail}</div>
    `;
    card.addEventListener("click", () => {
      activeConnectorId = item.id;
      renderSetup();
      renderHelpPanel();
    });
    connectorList.appendChild(card);
  });

  const connector = activeConnector();
  connectorFocus.innerHTML = connector ? `
    <div class="focus-kicker">Selected source</div>
    <div class="focus-title-row">
      <h3 class="focus-title">${connector.name}</h3>
      <span class="connector-status ${connectorStatusClass(connector.status)}">${connector.status}</span>
    </div>
    <div class="focus-meta">${connector.mode}</div>
    <div class="focus-stats">
      <div class="focus-stat">
        <span>Health</span>
        <strong>${connector.health}</strong>
      </div>
      <div class="focus-stat">
        <span>Latency</span>
        <strong>${connector.latency}</strong>
      </div>
    </div>
    <div class="focus-section">
      <div class="focus-section-title">What it can do</div>
      <div class="focus-chip-row">
        ${(connector.capabilities || []).map((item) => `<span class="focus-chip">${item}</span>`).join("")}
      </div>
    </div>
  ` : '<div class="history-empty">No source selected.</div>';

  providerGrid.innerHTML = "";
  providers.forEach((item) => {
    const card = document.createElement("div");
    card.className = "provider-card";
    card.innerHTML = `
      <div class="provider-name">${item.name}</div>
      <div class="provider-source">${item.source}</div>
    `;
    providerGrid.appendChild(card);
  });

  policyList.innerHTML = "";
  policies.forEach((item) => {
    const row = document.createElement("div");
    row.className = "policy-row";
    row.innerHTML = `<span>${item.label}</span><span class="policy-value">${item.value}</span>`;
    policyList.appendChild(row);
  });

  secretBindingsList.innerHTML = "";
  secretBindings.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "secret-row";
    wrapper.innerHTML = `
      <div class="policy-row">
        <span>${item.label}</span>
        <span class="policy-value">${item.value}</span>
      </div>
      <div class="policy-subtext">${item.detail}</div>
    `;
    secretBindingsList.appendChild(wrapper);
  });
}

function createTemplateRun(template) {
  const matchingWorkType = workTypes.find((item) => String(item.profileId).toLowerCase() === String(template.profile).toLowerCase()) || workTypes[0];
  const runNumber = liveRuns.length + 1;
  const runId = `kd-run-${170 + runNumber}`;
  const threadId = `thread-${runNumber}`;

  chats.unshift({
    id: threadId,
    title: `${template.title} ${runNumber}`,
    source: template.sourceGraph,
    time: "just now",
    stage: template.stage,
    profile: template.profile,
    sourceGraph: template.sourceGraph,
    workflowStage: template.stage,
    meta: ["Example started", "Awaiting run launch", "Thread attached to run"],
    insights: [
      { label: "Confidence", value: "Pending", tone: "neutral" },
      { label: "Risk", value: "Unknown", tone: "warn" },
      { label: "Validation", value: "Not planned", tone: "neutral" },
      { label: "Writeback", value: "Not armed", tone: "neutral" },
    ],
    timeline: [
      { stage: "Intake", state: "active", summary: "Run created from a starter example." },
      { stage: "Routing", state: "pending", summary: "The best flow will be confirmed on launch." },
      { stage: "Execution", state: "pending", summary: "Execution starts after operator confirmation." },
    ],
    messages: [
      {
        role: "system",
        author: "Run Bootstrap",
        timestamp: "now",
        chips: ["Starter example", template.profile],
        body: `<p>${template.prompt}</p>`,
      },
    ],
  });

  liveRuns.unshift({
    id: runId,
    workTypeId: matchingWorkType.id,
    threadId,
    status: "WAITING",
    playbook: matchingWorkType.playbooks?.[0] || "flow-start",
    stage: "intake",
    source: `Direct / ${template.title}`,
    duration: "0m",
    risk: "Medium",
    next: "Launch the test run",
    owner: "Developer",
    approval: "Waiting to start",
    summary: "New test run created from an example.",
    outputs: ["Run created"],
    connectors: matchingWorkType.connectorIds || [],
    trigger: "manual.launch",
  });

  activeRunId = runId;
  activeWorkTypeId = matchingWorkType.id;
  setWorkspaceView("runs");
  renderAll();
}

function createNewRun() {
  createTemplateRun(templates[0] || {
    title: "Ad hoc work item",
    profile: "Task",
    sourceGraph: "Direct input",
    stage: "Intake",
    prompt: "Start a dry-run and choose the best flow.",
  });
}

function appendSystemNote(chip, body) {
  const thread = activeThread();
  if (!thread) return;

  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  thread.messages.push({
    role: "agent",
    author: "Control Plane",
    timestamp,
    chips: [chip],
    body: `<p>${body}</p>`,
  });
}

function appendRunNote() {
  const thread = activeThread();
  const text = composerInput.value.trim();
  if (!thread || !text) return;

  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  thread.messages.push({
    role: "user",
    author: "Developer",
    timestamp,
    chips: ["Note"],
    body: `<p>${text.replace(/\n/g, "<br>")}</p>`,
  });

  thread.messages.push({
    role: "agent",
    author: "Run Analysis",
    timestamp,
    chips: ["Run updated"],
    body: "<p>The note was added to the run thread. In a live system this would update the run summary and audit trail.</p>",
  });

  renderRuns();
  renderRunRail();
}

function attachRunContext() {
  const run = activeRun();
  const workType = workTypeById(run?.workTypeId);
  if (!run) return;
  composerInput.value = `${composerInput.value.trim()}\n\nRun context:\n- Run id: ${run.id}\n- Flow: ${workType?.name || "Unknown"}\n- Step: ${run.stage}\n- Next: ${run.next}`;
}

function handleLaunchRun() {
  if (!activeRun()) {
    createNewRun();
    return;
  }
  appendSystemNote("Launch requested", "The selected run has been staged for execution.");
  setWorkspaceView("runs");
  renderRuns();
}

function handleExportNotes() {
  const run = activeRun();
  const workType = workTypeById(run?.workTypeId);
  if (!run) return;
  composerInput.value = [
    `Run: ${run.id}`,
    `Flow: ${workType?.name || "n/a"}`,
    `Source: ${run.source}`,
    `Step: ${run.stage}`,
    `Next: ${run.next}`,
    "",
    composerInput.value,
  ].join("\n").trim();
  appendSystemNote("Notes exported", "A short run summary was added to the notes box.");
  renderRuns();
}

function handlePauseRun() {
  const run = activeRun();
  if (!run) return;
  run.status = "WAITING";
  run.next = "Resume required";
  run.approval = "Paused by developer";
  appendSystemNote("Run paused", "The run is paused until you resume it.");
  renderAll();
}

function handleSwitchWorkType() {
  const story = workTypes.find((item) => item.id === "story-delivery");
  if (!story) return;
  activeWorkTypeId = story.id;
  setWorkspaceView("setup");
  renderAll();
}

function handleOpenSetup() {
  setWorkspaceView("setup");
  renderHeader();
}

function handleOpenHelp() {
  connectorPanel.classList.add("open");
  if (activeWorkspaceView === "runs") {
    appendSystemNote("Help opened", "The help panel is focused on source details, helpers, and safety rules.");
    renderRuns();
  }
}

function closePanelsOnMobile() {
  if (window.innerWidth <= 980) {
    historyPanel.classList.remove("open");
    connectorPanel.classList.remove("open");
  }
}

function renderAll() {
  ensureSelections();
  renderHeader();
  renderOverviewStrip();
  renderRunRail();
  renderTemplates();
  renderSetup();
  renderRuns();
  renderMonitor();
  renderHelpPanel();
}

newRunButton.addEventListener("click", createNewRun);
launchRunButton.addEventListener("click", handleLaunchRun);
exportBriefButton.addEventListener("click", handleExportNotes);
pauseRunButton.addEventListener("click", handlePauseRun);
attachContextButton.addEventListener("click", attachRunContext);
sendButton.addEventListener("click", appendRunNote);
connectSourceAdapterButton.addEventListener("click", handleOpenSetup);
switchWorkTypeButton.addEventListener("click", handleSwitchWorkType);
contextDiagnosticsButton.addEventListener("click", handleOpenHelp);

setupShortcut.addEventListener("click", () => setWorkspaceView("setup"));
runsShortcut.addEventListener("click", () => setWorkspaceView("runs"));
monitorShortcut.addEventListener("click", () => setWorkspaceView("monitor"));

workspaceTabs.forEach((tab) => {
  tab.addEventListener("click", () => setWorkspaceView(tab.dataset.view));
});

globalSearchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderAll();
});

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeFilter = chip.dataset.filter || "all";
    filterChips.forEach((button) => button.classList.toggle("active", button === chip));
    renderRunRail();
    renderMonitor();
  });
});

historyToggle.addEventListener("click", () => {
  historyPanel.classList.toggle("open");
  connectorPanel.classList.remove("open");
});

connectorToggle.addEventListener("click", () => {
  connectorPanel.classList.toggle("open");
  historyPanel.classList.remove("open");
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 980) {
    historyPanel.classList.remove("open");
    connectorPanel.classList.remove("open");
  }
});

renderAll();
setWorkspaceView(activeWorkspaceView);
