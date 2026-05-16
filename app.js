const consoleData = window.KNOCKDOWN_CONSOLE_DATA || {};

const queueHealth = consoleData.queueHealth || [];
const templates = consoleData.templates || [];
const workTypes = consoleData.workTypes || [];
const onboardingWorkflow = consoleData.onboardingWorkflow || [];
const configSources = consoleData.configSources || [];
const profiles = consoleData.profiles || [];
const chats = consoleData.chats || [];
const connectors = consoleData.connectors || [];
const adminConsole = consoleData.adminConsole || {};
const adminConnectorProfiles = adminConsole.connectorProfiles || [];
const adminSections = adminConsole.sections || [];
const providers = consoleData.providers || [];
const policies = consoleData.policies || [];
const secretBindings = consoleData.secretBindings || [];
const playbooks = consoleData.playbooks || [];
const routingMatrix = consoleData.routingMatrix || [];
const workflowBindings = consoleData.workflowBindings || [];
const chainGraph = consoleData.chainGraph || [];
const liveRuns = consoleData.liveRuns || [];
const decisionTrace = consoleData.decisionTrace || [];
const failureHeatmap = consoleData.failureHeatmap || [];

const globalSearchInput = document.querySelector(".global-search input");
const historyList = document.getElementById("historyList");
const templateList = document.getElementById("templateList");
const overviewStrip = document.getElementById("overviewStrip");
const workspaceKicker = document.getElementById("workspaceKicker");
const chatTitle = document.getElementById("chatTitle");
const chatMeta = document.getElementById("chatMeta");

const profileValue = document.getElementById("profileValue");
const sourceValue = document.getElementById("sourceValue");
const stageValue = document.getElementById("stageValue");
const nextActionValue = document.getElementById("nextActionValue");

const runSummaryList = document.getElementById("runSummaryList");
const runDependencyList = document.getElementById("runDependencyList");
const insightGrid = document.getElementById("insightGrid");
const timelineList = document.getElementById("timelineList");
const runDecisionTrace = document.getElementById("runDecisionTrace");
const messageStream = document.getElementById("messageStream");

const workTypeRegistry = document.getElementById("workTypeRegistry");
const workTypeFocus = document.getElementById("workTypeFocus");
const workTypeRouting = document.getElementById("workTypeRouting");
const workTypePlaybooks = document.getElementById("workTypePlaybooks");
const onboardingList = document.getElementById("onboardingList");
const configSourceList = document.getElementById("configSourceList");
const publishChecklist = document.getElementById("publishChecklist");

const adminConnectorCatalog = document.getElementById("adminConnectorCatalog");
const adminConnectorSummary = document.getElementById("adminConnectorSummary");
const runtimeModeSelector = document.getElementById("runtimeModeSelector");
const mcpFabricList = document.getElementById("mcpFabricList");
const toolMappingList = document.getElementById("toolMappingList");
const adminEnvBindings = document.getElementById("adminEnvBindings");
const writebackPolicyList = document.getElementById("writebackPolicyList");
const adminSpecList = document.getElementById("adminSpecList");

const playbookRegistry = document.getElementById("playbookRegistry");
const routingMatrixList = document.getElementById("routingMatrix");
const workflowBindingsList = document.getElementById("workflowBindings");
const chainGraphList = document.getElementById("chainGraph");

const runBoard = document.getElementById("runBoard");
const decisionTraceList = document.getElementById("decisionTrace");
const failureHeatmapList = document.getElementById("failureHeatmap");

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
const openBuildConnectorsButton = document.getElementById("openBuildConnectorsButton");

const operateShortcut = document.getElementById("operateShortcut");
const buildShortcut = document.getElementById("buildShortcut");
const observabilityShortcut = document.getElementById("observabilityShortcut");
const workspaceTabs = Array.from(document.querySelectorAll(".workspace-tab"));
const operateSubviewTabs = Array.from(document.querySelectorAll(".subview-tab[data-operate-view]"));
const buildSubviewTabs = Array.from(document.querySelectorAll(".subview-tab[data-build-view]"));
const filterChips = Array.from(document.querySelectorAll(".filter-chip"));

const historyToggle = document.getElementById("historyToggle");
const connectorToggle = document.getElementById("connectorToggle");
const historyPanel = document.getElementById("historyPanel");
const connectorPanel = document.getElementById("connectorPanel");

const workspacePanels = {
  operate: document.getElementById("operatePanel"),
  build: document.getElementById("buildPanel"),
  observability: document.getElementById("observabilityPanel"),
};

const operateSubPanels = {
  overview: document.getElementById("operateOverviewPanel"),
  timeline: document.getElementById("operateTimelinePanel"),
  thread: document.getElementById("operateThreadPanel"),
};

const buildSubPanels = {
  workTypes: document.getElementById("buildWorkTypesPanel"),
  connectors: document.getElementById("buildConnectorsPanel"),
  publish: document.getElementById("buildPublishPanel"),
};

let activeRunId = liveRuns[0]?.id || "";
let activeWorkTypeId = workTypes[0]?.id || "";
let activeConnectorId = connectors[0]?.id || "";
let activeFilter = "all";
let activeWorkspaceView = "operate";
let activeOperateView = "overview";
let activeBuildView = "workTypes";
let searchTerm = "";

const runtimeModeSelections = Object.fromEntries(
  adminConnectorProfiles.map((profile) => [
    profile.id,
    profile.activeRuntimeMode || profile.runtimeModes?.[0]?.id || "",
  ])
);

function searchable(values) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

function matchesSearch(values) {
  if (!searchTerm) return true;
  return searchable(values).includes(searchTerm);
}

function connectorStatusClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "live" || normalized === "active" || normalized === "running" || normalized === "online") {
    return "live";
  }
  if (normalized === "waiting" || normalized === "chained" || normalized === "shared") {
    return "pending";
  }
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
  return workTypes.find((workType) => workType.id === id) || null;
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

function playbooksForWorkType(workType) {
  return playbooks.filter((playbook) => (workType?.playbooks || []).includes(playbook.id));
}

function connectorsForWorkType(workType) {
  return connectors.filter((connector) => (workType?.connectorIds || []).includes(connector.id));
}

function activeConnectorProfile(visibleProfiles = adminConnectorProfiles) {
  return visibleProfiles.find((profile) => profile.id === activeConnectorId) || visibleProfiles[0] || null;
}

function currentRuntimeMode(profile) {
  if (!profile) return null;
  const selectedId = runtimeModeSelections[profile.id] || profile.activeRuntimeMode || profile.runtimeModes?.[0]?.id;
  return (profile.runtimeModes || []).find((mode) => mode.id === selectedId) || profile.runtimeModes?.[0] || null;
}

function visibleRuns() {
  return liveRuns.filter((run) => {
    const status = String(run.status || "").toLowerCase();
    const filterMatch = (
      activeFilter === "all" ||
      (activeFilter === "running" && status === "running") ||
      (activeFilter === "waiting" && (status === "waiting" || status === "chained"))
    );

    const workType = workTypeById(run.workTypeId);

    return filterMatch && matchesSearch([
      run.id,
      run.status,
      run.playbook,
      run.stage,
      run.source,
      run.owner,
      run.next,
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
    template.sourceGraph,
  ]));
}

function visibleWorkTypes() {
  return workTypes.filter((workType) => matchesSearch([
    workType.name,
    workType.summary,
    workType.defaultRunMode,
    workType.approvalPosture,
    ...(workType.routingSignals || []),
    ...(workType.playbooks || []),
  ]));
}

function visiblePlaybooks() {
  const selectedWorkType = activeWorkType();
  const allowedPlaybooks = new Set(selectedWorkType?.playbooks || []);

  return playbooks.filter((playbook) => {
    const workTypeMatch = activeBuildView !== "playbooks" || !selectedWorkType || allowedPlaybooks.size === 0 || allowedPlaybooks.has(playbook.id) || String(playbook.workload).toLowerCase() === "shared";
    return workTypeMatch && matchesSearch([
      playbook.name,
      playbook.workload,
      playbook.status,
      playbook.owner,
      ...(playbook.stages || []),
      ...(playbook.gates || []),
      ...(playbook.chains || []),
    ]);
  });
}

function visibleRoutes() {
  const selectedProfile = profileForWorkType(activeWorkType());
  return routingMatrix.filter((route) => {
    const profileMatch = !selectedProfile || String(route.workload || "").toLowerCase() === String(selectedProfile.name || "").toLowerCase();
    return profileMatch && matchesSearch([route.workload, route.signals, route.playbook, route.fallback]);
  });
}

function visibleAdminConnectorProfiles() {
  return adminConnectorProfiles.filter((profile) => matchesSearch([
    profile.name,
    profile.category,
    profile.summary,
    ...(profile.tags || []),
    profile.connectorFile,
    profile.sourceConfig,
    profile.contractFile,
  ]));
}

function ensureActiveRunVisible() {
  const runs = visibleRuns();
  if (!runs.length) {
    activeRunId = "";
    return;
  }

  if (!runs.some((run) => run.id === activeRunId)) {
    activeRunId = runs[0].id;
  }
}

function ensureActiveWorkTypeVisible() {
  const visible = visibleWorkTypes();
  if (!visible.length) {
    activeWorkTypeId = "";
    return;
  }

  if (!visible.some((workType) => workType.id === activeWorkTypeId)) {
    activeWorkTypeId = visible[0].id;
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

function setOperateView(view) {
  activeOperateView = view;
  Object.entries(operateSubPanels).forEach(([key, panel]) => {
    if (panel) panel.hidden = key !== view;
  });
  operateSubviewTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.operateView === view));
}

function setBuildView(view) {
  activeBuildView = view;
  Object.entries(buildSubPanels).forEach(([key, panel]) => {
    if (panel) panel.hidden = key !== view;
  });
  buildSubviewTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.buildView === view));
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

function renderHeader() {
  if (activeWorkspaceView === "build") {
    const workType = activeWorkType();
    const profile = profileForWorkType(workType);
    workspaceKicker.textContent = "Selected work type";
    chatTitle.textContent = workType?.name || "Build";
    chatMeta.innerHTML = [
      workType?.status,
      profile?.name ? `Profile: ${profile.name}` : "",
      workType?.publishState ? `Publish state: ${workType.publishState}` : "",
      workType?.approvalPosture ? `Approval: ${workType.approvalPosture}` : "",
    ].filter(Boolean).map((item) => `<span>${item}</span>`).join("");
    return;
  }

  if (activeWorkspaceView === "observability") {
    workspaceKicker.textContent = "Control plane health";
    chatTitle.textContent = "Health";
    chatMeta.innerHTML = "<span>Runs, routing, and failure hotspots across environments</span>";
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

function renderRunRail() {
  historyList.innerHTML = "";
  ensureActiveRunVisible();
  const runs = visibleRuns();

  runs.forEach((run) => {
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
      setWorkspaceView("operate");
      renderAll();
      closePanelsOnMobile();
    });

    historyList.appendChild(button);
  });

  if (!runs.length) {
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
    templateList.innerHTML = '<div class="history-empty">No starter flows match the current search.</div>';
  }
}

function renderRunBanner() {
  const run = activeRun();
  const workType = workTypeById(run?.workTypeId);
  profileValue.textContent = workType?.name || "Unknown";
  sourceValue.textContent = run?.source || "Awaiting source";
  stageValue.textContent = run?.stage || "Idle";
  nextActionValue.textContent = run?.next || "Select a run";
}

function renderOperateOverview() {
  const run = activeRun();
  const thread = activeThread();
  const workType = workTypeById(run?.workTypeId);

  insightGrid.innerHTML = "";
  (thread?.insights || []).forEach((insight) => {
    const card = document.createElement("div");
    card.className = `insight-card ${insightToneClass(insight.tone)}`;
    card.innerHTML = `
      <div class="insight-label">${insight.label}</div>
      <div class="insight-value">${insight.value}</div>
    `;
    insightGrid.appendChild(card);
  });

  runSummaryList.innerHTML = "";
  [
    ["Work type", workType?.name || "n/a"],
    ["Current playbook", run?.playbook || "n/a"],
    ["Stage", run?.stage || "n/a"],
    ["Approval posture", run?.approval || "n/a"],
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
    `Trigger: ${run?.trigger || "n/a"}`,
    `Connectors: ${formatList(run?.connectors || [])}`,
    `Outputs: ${formatList(run?.outputs || [])}`,
    `Approval: ${run?.approval || "n/a"}`,
    `Summary: ${run?.summary || "n/a"}`,
  ].forEach((text) => {
    const item = document.createElement("div");
    item.className = "focus-list-item";
    item.textContent = text;
    runDependencyList.appendChild(item);
  });
}

function renderOperateTimeline() {
  const thread = activeThread();
  const run = activeRun();

  timelineList.innerHTML = "";
  (thread?.timeline || []).forEach((entry) => {
    const item = document.createElement("div");
    item.className = `timeline-item ${timelineStateClass(entry.state)}`;
    item.innerHTML = `
      <div class="timeline-marker"></div>
      <div class="timeline-copy">
        <div class="timeline-stage-row">
          <div class="timeline-stage">${entry.stage}</div>
          <div class="timeline-state">${entry.state}</div>
        </div>
        <div class="timeline-summary">${entry.summary}</div>
      </div>
    `;
    timelineList.appendChild(item);
  });

  if (!timelineList.children.length) {
    timelineList.innerHTML = '<div class="history-empty">No timeline available for this run.</div>';
  }

  runDecisionTrace.innerHTML = "";
  const traceMatches = decisionTrace.filter((trace) => {
    const runRef = run?.source?.split("/").pop()?.trim() || "";
    return matchesSearch([trace.title, ...(trace.details || [])]) && (
      trace.title.includes(runRef) ||
      trace.title.includes(run?.playbook || "") ||
      trace.title.toLowerCase().includes(String(workTypeById(run?.workTypeId)?.profileId || "").toLowerCase())
    );
  });

  (traceMatches.length ? traceMatches : decisionTrace.slice(0, 1)).forEach((trace) => {
    const block = document.createElement("div");
    block.className = "route-row";
    block.innerHTML = `
      <div class="playbook-name">${trace.title}</div>
      <div class="focus-list">
        ${(trace.details || []).map((detail) => `<div class="focus-list-item">${detail}</div>`).join("")}
      </div>
    `;
    runDecisionTrace.appendChild(block);
  });
}

function renderOperateThread() {
  const thread = activeThread();
  const run = activeRun();

  if (!thread) {
    messageStream.innerHTML = '<div class="history-empty">No troubleshooting thread available for this run.</div>';
    return;
  }

  composerInput.value = `Review ${run?.id || "this run"}, summarize the blocker, and recommend the safest next move before any mutation.`;
  messageStream.innerHTML = "";

  thread.messages.forEach((message) => {
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

function renderWorkTypes() {
  ensureActiveWorkTypeVisible();
  const selectedWorkType = activeWorkType();
  const selectedProfile = profileForWorkType(selectedWorkType);

  workTypeRegistry.innerHTML = "";
  visibleWorkTypes().forEach((workType) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `playbook-row${workType.id === activeWorkTypeId ? " active-card" : ""}`;
    card.innerHTML = `
      <div class="playbook-title-row">
        <div>
          <div class="playbook-name">${workType.name}</div>
          <div class="playbook-meta">${workType.defaultRunMode} • ${workType.publishState}</div>
        </div>
        <span class="connector-status ${connectorStatusClass(workType.status)}">${workType.status}</span>
      </div>
      <div class="playbook-detail">${workType.summary}</div>
    `;
    card.addEventListener("click", () => {
      activeWorkTypeId = workType.id;
      activeConnectorId = workType.connectorIds?.[0] || activeConnectorId;
      renderAll();
    });
    workTypeRegistry.appendChild(card);
  });

  if (!workTypeRegistry.children.length) {
    workTypeRegistry.innerHTML = '<div class="history-empty">No work types match the current search.</div>';
  }

  if (!selectedWorkType) {
    workTypeFocus.innerHTML = '<div class="history-empty">No work type selected.</div>';
    workTypeRouting.innerHTML = '<div class="history-empty">No routing info available.</div>';
    workTypePlaybooks.innerHTML = '<div class="history-empty">No playbooks available.</div>';
    return;
  }

  workTypeFocus.innerHTML = `
    <div class="focus-kicker">Selected work type</div>
    <div class="focus-title-row">
      <h3 class="focus-title">${selectedWorkType.name}</h3>
      <span class="connector-status ${connectorStatusClass(selectedWorkType.status)}">${selectedWorkType.status}</span>
    </div>
    <div class="focus-meta">${selectedWorkType.summary}</div>
    <div class="focus-stats">
      <div class="focus-stat">
        <span>Profile</span>
        <strong>${selectedProfile?.name || "n/a"}</strong>
      </div>
      <div class="focus-stat">
        <span>Publish state</span>
        <strong>${selectedWorkType.publishState}</strong>
      </div>
    </div>
    <div class="focus-section">
      <div class="focus-section-title">Connectors</div>
      <div class="focus-chip-row">
        ${connectorsForWorkType(selectedWorkType).map((connector) => `<span class="focus-chip">${connector.name}</span>`).join("")}
      </div>
    </div>
    <div class="focus-section">
      <div class="focus-section-title">Outputs</div>
      <div class="focus-list">
        ${(selectedWorkType.outputs || []).map((output) => `<div class="focus-list-item">${output}</div>`).join("")}
      </div>
    </div>
    <div class="focus-section">
      <div class="focus-section-title">Approval posture</div>
      <div class="focus-meta">${selectedWorkType.approvalPosture}</div>
    </div>
  `;

  workTypeRouting.innerHTML = "";
  [
    ...visibleRoutes().map((route) => ({
      title: route.workload,
      meta: route.signals,
      detail: `Default playbook: ${route.playbook} • Fallback: ${route.fallback} • Confidence: ${route.confidence}`,
    })),
    ...(visibleRoutes().length ? [] : [{
      title: "Signals",
      meta: formatList(selectedWorkType.routingSignals || []),
      detail: "This work type uses explicit routing signals defined in the control plane.",
    }]),
  ].forEach((entry) => {
    const row = document.createElement("div");
    row.className = "route-row";
    row.innerHTML = `
      <div class="route-main">
        <div class="playbook-name">${entry.title}</div>
        <div class="route-meta">${entry.meta}</div>
      </div>
      <div class="playbook-detail">${entry.detail}</div>
    `;
    workTypeRouting.appendChild(row);
  });

  workTypePlaybooks.innerHTML = "";
  (selectedWorkType.playbooks || []).forEach((playbookId) => {
    const matchingPlaybook = playbooks.find((playbook) => playbook.id === playbookId);
    const row = document.createElement("div");
    row.className = "binding-row";
    row.innerHTML = `
      <div class="playbook-title-row">
        <div>
          <div class="playbook-name">${matchingPlaybook?.name || playbookId}</div>
          <div class="playbook-meta">${matchingPlaybook?.owner || "Configured chain node"}</div>
        </div>
        <span class="focus-chip">${matchingPlaybook?.status || "CHAIN"}</span>
      </div>
      <div class="playbook-detail">${matchingPlaybook ? matchingPlaybook.stages.join(" -> ") : "Defined in the selected work type chain."}</div>
    `;
    workTypePlaybooks.appendChild(row);
  });
}

function renderOnboarding() {
  onboardingList.innerHTML = "";
  onboardingWorkflow.forEach((step, index) => {
    const row = document.createElement("div");
    row.className = "binding-row";
    row.innerHTML = `
      <div class="playbook-title-row">
        <div>
          <div class="playbook-name">${index + 1}. ${step.step}</div>
          <div class="playbook-meta">${step.owner}</div>
        </div>
        <span class="focus-chip">Required</span>
      </div>
      <div class="playbook-detail">${step.detail}</div>
    `;
    onboardingList.appendChild(row);
  });

  configSourceList.innerHTML = "";
  [...configSources, ...secretBindings.map((binding) => ({
    label: binding.label,
    detail: binding.detail,
  }))].forEach((source) => {
    const row = document.createElement("div");
    row.className = "binding-row";
    row.innerHTML = `
      <div class="playbook-name">${source.label}</div>
      <div class="playbook-detail">${source.detail}</div>
    `;
    configSourceList.appendChild(row);
  });

  const workType = activeWorkType();
  publishChecklist.innerHTML = "";
  [
    { label: "Dry-run with sample item", value: "Required" },
    { label: "Schema mapped", value: "Required" },
    { label: "Writeback reviewed", value: workType?.approvalPosture || "Required" },
    { label: "Publish state", value: workType?.publishState || "Draft" },
    { label: "Secrets ready", value: "Repo, runner, or runtime-injected" },
  ].forEach((entry) => {
    const row = document.createElement("div");
    row.className = "policy-row";
    row.innerHTML = `<span>${entry.label}</span><span class="policy-value">${entry.value}</span>`;
    publishChecklist.appendChild(row);
  });
}

function renderAdminConnectorCatalog() {
  adminConnectorCatalog.innerHTML = "";
  const visibleProfiles = visibleAdminConnectorProfiles();

  if (!visibleProfiles.some((profile) => profile.id === activeConnectorId) && visibleProfiles[0]) {
    activeConnectorId = visibleProfiles[0].id;
  }

  visibleProfiles.forEach((profile) => {
    const mode = currentRuntimeMode(profile);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `playbook-row${profile.id === activeConnectorId ? " active-card" : ""}`;
    card.innerHTML = `
      <div class="playbook-title-row">
        <div>
          <div class="playbook-name">${profile.name}</div>
          <div class="playbook-meta">${profile.category} • ${mode?.label || "Runtime pending"}</div>
        </div>
        <span class="connector-status ${connectorStatusClass(profile.status)}">${profile.status}</span>
      </div>
      <div class="playbook-detail">${profile.summary}</div>
      <div class="playbook-chip-row">
        ${(profile.tags || []).map((tag) => `<span class="focus-chip">${tag}</span>`).join("")}
      </div>
    `;
    card.addEventListener("click", () => {
      activeConnectorId = profile.id;
      renderBuildConnectors();
      renderInspector();
    });
    adminConnectorCatalog.appendChild(card);
  });

  if (!visibleProfiles.length) {
    adminConnectorCatalog.innerHTML = '<div class="history-empty">No connector profiles match the current search.</div>';
  }
}

function renderAdminConnectorSummary() {
  const profile = activeConnectorProfile(visibleAdminConnectorProfiles());
  if (!profile) {
    adminConnectorSummary.innerHTML = '<div class="history-empty">No connector selected.</div>';
    return;
  }

  const mode = currentRuntimeMode(profile);
  adminConnectorSummary.innerHTML = `
    <div class="focus-kicker">Selected connector</div>
    <div class="focus-title-row">
      <h3 class="focus-title">${profile.name}</h3>
      <span class="connector-status ${connectorStatusClass(profile.status)}">${profile.status}</span>
    </div>
    <div class="focus-meta">${profile.summary}</div>
    <div class="focus-stats">
      <div class="focus-stat">
        <span>Runtime</span>
        <strong>${mode?.label || "Unknown"}</strong>
      </div>
      <div class="focus-stat">
        <span>Mode kind</span>
        <strong>${mode?.kind || "n/a"}</strong>
      </div>
    </div>
    <div class="focus-section">
      <div class="focus-section-title">Config files</div>
      <div class="focus-list">
        <div class="focus-list-item">${profile.connectorFile}</div>
        <div class="focus-list-item">${profile.sourceConfig}</div>
        <div class="focus-list-item">${profile.contractFile}</div>
        <div class="focus-list-item">${profile.adminCatalogFile}</div>
      </div>
    </div>
  `;
}

function renderRuntimeModes() {
  runtimeModeSelector.innerHTML = "";
  const profile = activeConnectorProfile(visibleAdminConnectorProfiles());
  if (!profile) {
    runtimeModeSelector.innerHTML = '<div class="history-empty">No runtime modes available.</div>';
    return;
  }

  (profile.runtimeModes || []).forEach((mode) => {
    const selected = currentRuntimeMode(profile)?.id === mode.id;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `mode-card${selected ? " active-card" : ""}`;
    card.innerHTML = `
      <div class="playbook-title-row">
        <div>
          <div class="playbook-name">${mode.label}</div>
          <div class="playbook-meta">${mode.kind} • ${formatList(mode.requiredServerNames || [])}</div>
        </div>
        <span class="connector-status ${selected ? "live" : "pending"}">${selected ? "ACTIVE" : "AVAILABLE"}</span>
      </div>
      <div class="playbook-detail">${mode.description}</div>
      <div class="focus-list">
        ${(mode.notes || []).map((note) => `<div class="focus-list-item">${note}</div>`).join("")}
      </div>
    `;
    card.addEventListener("click", () => {
      runtimeModeSelections[profile.id] = mode.id;
      renderBuildConnectors();
    });
    runtimeModeSelector.appendChild(card);
  });
}

function renderMcpFabric() {
  mcpFabricList.innerHTML = "";
  const profile = activeConnectorProfile(visibleAdminConnectorProfiles());
  const mode = currentRuntimeMode(profile);
  const fabric = profile?.mcpFabric || {};

  [
    `Namespace: ${fabric.namespace || "n/a"}`,
    `Advertised server: ${fabric.serverName || "n/a"}`,
    `Runtime mode env var: ${fabric.runtimeModeEnvVar || "n/a"}`,
    `Namespace env var: ${fabric.namespaceEnvVar || "n/a"}`,
    `Source base URL env var: ${fabric.sourceBaseUrlEnvVar || "n/a"}`,
    `Proxy base URL env var: ${fabric.proxyBaseUrlEnvVar || "n/a"}`,
    `Required server(s): ${formatList(mode?.requiredServerNames || [])}`,
    `Read path: ${fabric.sourceReadPath || "n/a"}`,
    `Write path: ${fabric.sourceWritePath || "n/a"}`,
  ].forEach((text) => {
    const row = document.createElement("div");
    row.className = "focus-list-item";
    row.textContent = text;
    mcpFabricList.appendChild(row);
  });
}

function renderToolMappings() {
  toolMappingList.innerHTML = "";
  const profile = activeConnectorProfile(visibleAdminConnectorProfiles());
  const mode = currentRuntimeMode(profile);

  (profile?.toolMappings || []).forEach((mapping) => {
    const row = document.createElement("div");
    row.className = "mapping-row";
    row.innerHTML = `
      <div class="playbook-title-row">
        <div>
          <div class="playbook-name">${mapping.stableTool}</div>
          <div class="playbook-meta">${mapping.bindingId} • ${mapping.strategy}</div>
        </div>
        <span class="focus-chip">${mode?.id === "vendor_mcp" ? "vendor path" : "proxy path"}</span>
      </div>
      <div class="mapping-grid">
        <div class="mapping-block">
          <div class="focus-kicker">Aliases</div>
          <div class="playbook-detail">${formatList(mapping.aliases || [])}</div>
        </div>
        <div class="mapping-block">
          <div class="focus-kicker">Request contract</div>
          <div class="playbook-detail">${mapping.requestContract}</div>
        </div>
        <div class="mapping-block">
          <div class="focus-kicker">Response contract</div>
          <div class="playbook-detail">${mapping.responseContract}</div>
        </div>
        <div class="mapping-block">
          <div class="focus-kicker">Implementation</div>
          <div class="playbook-detail">${mapping.vendorTool}</div>
        </div>
        <div class="mapping-block">
          <div class="focus-kicker">Policy</div>
          <div class="playbook-detail">${mapping.policy}</div>
        </div>
      </div>
    `;
    toolMappingList.appendChild(row);
  });
}

function renderAdminBindings() {
  adminEnvBindings.innerHTML = "";
  const profile = activeConnectorProfile(visibleAdminConnectorProfiles());
  const selectedModeId = currentRuntimeMode(profile)?.id;

  (profile?.envBindings || [])
    .filter((binding) => !binding.modes || binding.modes.includes(selectedModeId))
    .forEach((binding) => {
      const row = document.createElement("div");
      row.className = "binding-row";
      row.innerHTML = `
        <div class="playbook-title-row">
          <div>
            <div class="playbook-name">${binding.key}</div>
            <div class="playbook-meta">${binding.scope} • ${binding.kind}</div>
          </div>
          <span class="focus-chip">${formatList(binding.modes || [])}</span>
        </div>
        <div class="playbook-detail">${binding.note}</div>
      `;
      adminEnvBindings.appendChild(row);
    });

  (profile?.secretBindings || []).forEach((binding) => {
    const row = document.createElement("div");
    row.className = "binding-row";
    row.innerHTML = `
      <div class="playbook-title-row">
        <div>
          <div class="playbook-name">${binding.label}</div>
          <div class="playbook-meta">${binding.scope} • secret reference</div>
        </div>
        <span class="connector-status pending">SECRET</span>
      </div>
      <div class="playbook-detail">${binding.note}</div>
    `;
    adminEnvBindings.appendChild(row);
  });
}

function renderWritebackPolicy() {
  writebackPolicyList.innerHTML = "";
  const policy = activeConnectorProfile(visibleAdminConnectorProfiles())?.writePolicy || {};

  [
    { label: "Comments", value: policy.allowComments ? "allowed" : "blocked" },
    { label: "Labels", value: policy.allowLabels ? "allowed" : "blocked" },
    { label: "Attachments", value: policy.allowAttachments ? "allowed" : "blocked" },
    { label: "Allowed field updates", value: formatList(policy.allowFieldUpdates || []) },
    { label: "Denied field updates", value: formatList(policy.denyFieldUpdates || []) },
    { label: "Approval posture", value: policy.approvalPosture || "n/a" },
  ].forEach((entry) => {
    const row = document.createElement("div");
    row.className = "policy-row";
    row.innerHTML = `<span>${entry.label}</span><span class="policy-value">${entry.value}</span>`;
    writebackPolicyList.appendChild(row);
  });
}

function renderAdminSpec() {
  adminSpecList.innerHTML = "";
  const profile = activeConnectorProfile(visibleAdminConnectorProfiles());
  if (!profile) {
    adminSpecList.innerHTML = '<div class="history-empty">No spec references available.</div>';
    return;
  }

  [
    `Admin sections: ${formatList(adminSections)}`,
    `Connector file: ${profile.connectorFile}`,
    `Source config: ${profile.sourceConfig}`,
    `Stable contract: ${profile.contractFile}`,
    `Admin catalog: ${profile.adminCatalogFile}`,
    "Model: Work Type -> Run -> Thread",
  ].forEach((item) => {
    const row = document.createElement("div");
    row.className = "binding-row";
    row.innerHTML = `<div class="playbook-detail">${item}</div>`;
    adminSpecList.appendChild(row);
  });
}

function renderBuildConnectors() {
  renderAdminConnectorCatalog();
  renderAdminConnectorSummary();
  renderRuntimeModes();
  renderMcpFabric();
  renderToolMappings();
  renderAdminBindings();
  renderWritebackPolicy();
  renderAdminSpec();
}

function renderRoutingMatrix() {
  routingMatrixList.innerHTML = "";
  visibleRoutes().forEach((route) => {
    const row = document.createElement("div");
    row.className = "route-row";
    row.innerHTML = `
      <div class="route-main">
        <div class="playbook-name">${route.workload}</div>
        <div class="route-meta">${route.signals}</div>
      </div>
      <div class="focus-list">
        <div class="focus-list-item">Selected playbook: ${route.playbook}</div>
        <div class="focus-list-item">Confidence: ${route.confidence}</div>
        <div class="focus-list-item">Fallback: ${route.fallback}</div>
      </div>
    `;
    routingMatrixList.appendChild(row);
  });

  if (!routingMatrixList.children.length) {
    routingMatrixList.innerHTML = '<div class="history-empty">No routing entries match the selected work type.</div>';
  }
}

function renderWorkflowBindings() {
  workflowBindingsList.innerHTML = "";
  workflowBindings
    .filter((binding) => matchesSearch([binding.name, binding.target, binding.workflow, binding.mode, binding.environment]))
    .forEach((binding) => {
      const row = document.createElement("div");
      row.className = "binding-row";
      row.innerHTML = `
        <div class="playbook-title-row">
          <div>
            <div class="playbook-name">${binding.name}</div>
            <div class="playbook-meta">${binding.mode} • ${binding.environment}</div>
          </div>
          <span class="focus-chip">${binding.target}</span>
        </div>
        <div class="playbook-detail">${binding.workflow}</div>
      `;
      workflowBindingsList.appendChild(row);
    });
}

function renderChainGraph() {
  chainGraphList.innerHTML = "";
  chainGraph
    .filter((chain) => matchesSearch([chain.name, ...(chain.nodes || [])]))
    .forEach((chain) => {
      const row = document.createElement("div");
      row.className = "chain-row";
      row.innerHTML = `
        <div class="playbook-name">${chain.name}</div>
        <div class="chain-nodes">
          ${chain.nodes.map((node, index) => `
            <span class="chain-node">${node}</span>${index < chain.nodes.length - 1 ? '<span class="chain-arrow">-></span>' : ""}
          `).join("")}
        </div>
      `;
      chainGraphList.appendChild(row);
    });
}

function renderRunsBoard() {
  runBoard.innerHTML = "";
  liveRuns
    .filter((run) => matchesSearch([run.id, run.status, run.playbook, run.stage, run.source, run.risk, run.next]))
    .forEach((run) => {
      const workType = workTypeById(run.workTypeId);
      const card = document.createElement("div");
      card.className = "run-card";
      card.innerHTML = `
        <div class="run-top">
          <div>
            <div class="playbook-name">${run.id}</div>
            <div class="playbook-meta">${workType?.name || "Unknown work type"} • ${run.source}</div>
          </div>
          <span class="connector-status ${connectorStatusClass(run.status)}">${run.status}</span>
        </div>
        <div class="run-meta">Stage: ${run.stage} • Duration: ${run.duration} • Risk: ${run.risk}</div>
        <div class="playbook-detail">${run.next}</div>
      `;
      card.addEventListener("click", () => {
        activeRunId = run.id;
        activeWorkTypeId = run.workTypeId || activeWorkTypeId;
        setWorkspaceView("operate");
        renderAll();
      });
      runBoard.appendChild(card);
    });
}

function renderDecisionTraceBoard() {
  decisionTraceList.innerHTML = "";
  decisionTrace
    .filter((trace) => matchesSearch([trace.title, ...(trace.details || [])]))
    .forEach((trace) => {
      const block = document.createElement("div");
      block.className = "route-row";
      block.innerHTML = `
        <div class="playbook-name">${trace.title}</div>
        <div class="focus-list">
          ${(trace.details || []).map((detail) => `<div class="focus-list-item">${detail}</div>`).join("")}
        </div>
      `;
      decisionTraceList.appendChild(block);
    });
}

function renderFailureHeatmap() {
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

function renderConnectors() {
  connectorList.innerHTML = "";
  const visibleConnectors = connectors.filter((connector) => matchesSearch([
    connector.name,
    connector.detail,
    connector.meta,
    ...(connector.capabilities || []),
    ...(connector.operations || []),
    ...(connector.env || []),
  ]));

  if (!visibleConnectors.some((connector) => connector.id === activeConnectorId) && visibleConnectors[0]) {
    activeConnectorId = visibleConnectors[0].id;
  }

  visibleConnectors.forEach((connector) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `connector-card${connector.id === activeConnectorId ? " active" : ""}`;
    card.innerHTML = `
      <div class="connector-line">
        <div class="connector-name">${connector.name}</div>
        <span class="connector-status ${connectorStatusClass(connector.status)}">${connector.status}</span>
      </div>
      <div class="connector-detail">${connector.detail}</div>
      <div class="connector-meta">
        <div>${connector.mode}</div>
        <div>${connector.meta}</div>
      </div>
    `;
    card.addEventListener("click", () => {
      activeConnectorId = connector.id;
      renderInspector();
      renderBuildConnectors();
    });
    connectorList.appendChild(card);
  });
}

function renderInspector() {
  renderConnectors();

  const activeConnector = connectors.find((connector) => connector.id === activeConnectorId);
  connectorFocus.innerHTML = activeConnector ? `
    <div class="focus-kicker">Connector focus</div>
    <div class="focus-title-row">
      <h3 class="focus-title">${activeConnector.name}</h3>
      <span class="connector-status ${connectorStatusClass(activeConnector.status)}">${activeConnector.status}</span>
    </div>
    <div class="focus-meta">${activeConnector.mode}</div>
    <div class="focus-stats">
      <div class="focus-stat">
        <span>Health</span>
        <strong>${activeConnector.health}</strong>
      </div>
      <div class="focus-stat">
        <span>Latency</span>
        <strong>${activeConnector.latency}</strong>
      </div>
    </div>
    <div class="focus-section">
      <div class="focus-section-title">Capabilities</div>
      <div class="focus-chip-row">
        ${(activeConnector.capabilities || []).map((capability) => `<span class="focus-chip">${capability}</span>`).join("")}
      </div>
    </div>
    <div class="focus-section">
      <div class="focus-section-title">Environment keys</div>
      <div class="focus-list">
        ${(activeConnector.env || []).map((item) => `<div class="focus-list-item">${item}</div>`).join("")}
      </div>
    </div>
  ` : '<div class="history-empty">No connector selected.</div>';

  providerGrid.innerHTML = "";
  providers.forEach((provider) => {
    const card = document.createElement("div");
    card.className = "provider-card";
    card.innerHTML = `
      <div class="provider-name">${provider.name}</div>
      <div class="provider-source">${provider.source}</div>
    `;
    providerGrid.appendChild(card);
  });

  policyList.innerHTML = "";
  policies.forEach((policy) => {
    const row = document.createElement("div");
    row.className = "policy-row";
    row.innerHTML = `<span>${policy.label}</span><span class="policy-value">${policy.value}</span>`;
    policyList.appendChild(row);
  });

  secretBindingsList.innerHTML = "";
  secretBindings.forEach((binding) => {
    const wrapper = document.createElement("div");
    wrapper.className = "secret-row";
    wrapper.innerHTML = `
      <div class="policy-row">
        <span>${binding.label}</span>
        <span class="policy-value">${binding.value}</span>
      </div>
      <div class="policy-subtext">${binding.detail}</div>
    `;
    secretBindingsList.appendChild(wrapper);
  });
}

function createTemplateRun(template) {
  const matchingWorkType = workTypes.find((workType) => String(workType.profileId).toLowerCase() === String(template.profile).toLowerCase()) || workTypes[0];
  const runNumber = liveRuns.length + 1;
  const newRunId = `kd-run-${170 + runNumber}`;
  const newThreadId = `thread-${runNumber}`;

  chats.unshift({
    id: newThreadId,
    title: `${template.title} ${runNumber}`,
    source: template.sourceGraph,
    time: "just now",
    stage: template.stage,
    profile: template.profile,
    sourceGraph: template.sourceGraph,
    workflowStage: template.stage,
    meta: ["Template seeded", "Awaiting full execution", "Thread attached to run"],
    insights: [
      { label: "Confidence", value: "Pending", tone: "neutral" },
      { label: "Risk", value: "Unknown", tone: "warn" },
      { label: "Validation", value: "Not planned", tone: "neutral" },
      { label: "Writeback", value: "Not armed", tone: "neutral" },
    ],
    timeline: [
      { stage: "Intake", state: "active", summary: "Run created from a starter flow and waiting for execution." },
      { stage: "Routing", state: "pending", summary: "The work type and playbook path will be confirmed on launch." },
      { stage: "Execution", state: "pending", summary: "Execution begins after operator confirmation." },
    ],
    messages: [
      {
        role: "system",
        author: "Run Bootstrap",
        timestamp: "now",
        chips: ["Starter flow", template.profile],
        body: `<p>${template.prompt}</p>`,
      },
    ],
  });

  liveRuns.unshift({
    id: newRunId,
    workTypeId: matchingWorkType.id,
    threadId: newThreadId,
    status: "WAITING",
    playbook: matchingWorkType.playbooks?.[0] || "work-intake",
    stage: "intake",
    source: `Direct / ${template.title}`,
    duration: "0m",
    risk: "Medium",
    next: "Confirm launch and route work",
    owner: "Operator",
    approval: "Awaiting launch",
    summary: "New run created from a starter flow and ready for routing.",
    outputs: ["Run created"],
    connectors: matchingWorkType.connectorIds || [],
    trigger: "manual.launch",
  });

  activeRunId = newRunId;
  activeWorkTypeId = matchingWorkType.id;
  setWorkspaceView("operate");
  setOperateView("thread");
  renderAll();
}

function createNewRun() {
  createTemplateRun(templates[0] || {
    title: "Ad hoc work item",
    profile: "Task",
    sourceGraph: "Direct input",
    stage: "Intake",
    prompt: "Start a dry-run and collect enough context to choose the right work type.",
    meta: "ad hoc",
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

function appendThreadMessage() {
  const thread = activeThread();
  const text = composerInput.value.trim();
  if (!thread || !text) return;

  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  thread.messages.push({
    role: "user",
    author: "Operator",
    timestamp,
    chips: ["Manual intervention"],
    body: `<p>${text.replace(/\n/g, "<br>")}</p>`,
  });

  thread.messages.push({
    role: "agent",
    author: "Run Analysis",
    timestamp,
    chips: ["Thread update", "Run scoped"],
    body: "<p>The run thread has been updated. In a live environment this would persist the intervention, refresh the run summary, and notify any waiting approval or routing surfaces.</p>",
  });

  renderOperateThread();
  renderRunRail();
}

function attachRunContext() {
  const run = activeRun();
  if (!run) return;
  composerInput.value = `${composerInput.value.trim()}\n\nRun context:\n- Run id: ${run.id}\n- Work type: ${workTypeById(run.workTypeId)?.name || "Unknown"}\n- Stage: ${run.stage}\n- Next: ${run.next}`;
}

function handleLaunchRun() {
  if (!activeRun()) {
    createNewRun();
    return;
  }
  appendSystemNote("Launch requested", "The selected run has been staged for execution. In a live environment this would queue the playbook chain and allocate runtime capacity.");
  setWorkspaceView("operate");
  setOperateView("thread");
  renderOperateThread();
}

function handleExportBrief() {
  const run = activeRun();
  if (!run) return;
  const workType = workTypeById(run.workTypeId);

  composerInput.value = [
    `Run: ${run.id}`,
    `Work type: ${workType?.name || "n/a"}`,
    `Source: ${run.source}`,
    `Stage: ${run.stage}`,
    `Next: ${run.next}`,
    "",
    composerInput.value,
  ].join("\n").trim();
  appendSystemNote("Brief exported", "A run-level brief has been inserted into the thread composer.");
  renderOperateThread();
}

function handlePauseRun() {
  const run = activeRun();
  if (!run) return;
  run.status = "WAITING";
  run.next = "Resume required";
  run.approval = "Operator paused execution";
  appendSystemNote("Run paused", "The selected run is paused. The thread remains open for troubleshooting and next-step planning.");
  renderAll();
}

function handleConnectorsBuildOpen() {
  setWorkspaceView("build");
  setBuildView("connectors");
  renderHeader();
}

function handleSwitchWorkType() {
  const storyWorkType = workTypes.find((workType) => workType.id === "story-delivery");
  if (!storyWorkType) return;
  activeWorkTypeId = storyWorkType.id;
  setWorkspaceView("build");
  setBuildView("workTypes");
  renderAll();
}

function handleContextDiagnostics() {
  connectorPanel.classList.add("open");
  appendSystemNote("Diagnostics opened", "The inspector is now focused on connectors, policies, and secret scope for the current run.");
  renderOperateThread();
}

function renderAll() {
  renderHeader();
  renderOverviewStrip();
  renderRunRail();
  renderTemplates();
  renderRunBanner();
  renderOperateOverview();
  renderOperateTimeline();
  renderOperateThread();
  renderWorkTypes();
  renderOnboarding();
  renderBuildConnectors();
  renderRoutingMatrix();
  renderWorkflowBindings();
  renderChainGraph();
  renderRunsBoard();
  renderDecisionTraceBoard();
  renderFailureHeatmap();
  renderInspector();
}

function closePanelsOnMobile() {
  if (window.innerWidth <= 980) {
    historyPanel.classList.remove("open");
    connectorPanel.classList.remove("open");
  }
}

newRunButton.addEventListener("click", createNewRun);
launchRunButton.addEventListener("click", handleLaunchRun);
exportBriefButton.addEventListener("click", handleExportBrief);
pauseRunButton.addEventListener("click", handlePauseRun);
attachContextButton.addEventListener("click", attachRunContext);
sendButton.addEventListener("click", appendThreadMessage);
connectSourceAdapterButton.addEventListener("click", handleConnectorsBuildOpen);
switchWorkTypeButton.addEventListener("click", handleSwitchWorkType);
contextDiagnosticsButton.addEventListener("click", handleContextDiagnostics);
openBuildConnectorsButton.addEventListener("click", handleConnectorsBuildOpen);

operateShortcut.addEventListener("click", () => setWorkspaceView("operate"));
buildShortcut.addEventListener("click", () => setWorkspaceView("build"));
observabilityShortcut.addEventListener("click", () => setWorkspaceView("observability"));

workspaceTabs.forEach((tab) => {
  tab.addEventListener("click", () => setWorkspaceView(tab.dataset.view));
});

operateSubviewTabs.forEach((tab) => {
  tab.addEventListener("click", () => setOperateView(tab.dataset.operateView));
});

buildSubviewTabs.forEach((tab) => {
  tab.addEventListener("click", () => setBuildView(tab.dataset.buildView));
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
    renderRunsBoard();
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
setOperateView(activeOperateView);
setBuildView(activeBuildView);
