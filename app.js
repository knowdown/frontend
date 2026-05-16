const consoleData = window.KNOCKDOWN_CONSOLE_DATA || {};

const chats = consoleData.chats || [];
const connectors = consoleData.connectors || [];
const adminConsole = consoleData.adminConsole || {};
const adminConnectorProfiles = adminConsole.connectorProfiles || [];
const adminSections = adminConsole.sections || [];
const providers = consoleData.providers || [];
const policies = consoleData.policies || [];
const queueHealth = consoleData.queueHealth || [];
const templates = consoleData.templates || [];
const profiles = consoleData.profiles || [];
const playbooks = consoleData.playbooks || [];
const routingMatrix = consoleData.routingMatrix || [];
const workflowBindings = consoleData.workflowBindings || [];
const chainGraph = consoleData.chainGraph || [];
const liveRuns = consoleData.liveRuns || [];
const decisionTrace = consoleData.decisionTrace || [];
const failureHeatmap = consoleData.failureHeatmap || [];
const secretBindings = consoleData.secretBindings || [];

const globalSearchInput = document.querySelector(".global-search input");
const historyList = document.getElementById("historyList");
const templateList = document.getElementById("templateList");
const messageStream = document.getElementById("messageStream");
const connectorList = document.getElementById("connectorList");
const connectorFocus = document.getElementById("connectorFocus");
const providerGrid = document.getElementById("providerGrid");
const policyList = document.getElementById("policyList");
const overviewStrip = document.getElementById("overviewStrip");
const insightGrid = document.getElementById("insightGrid");
const timelineList = document.getElementById("timelineList");
const chatTitle = document.getElementById("chatTitle");
const chatMeta = document.getElementById("chatMeta");
const profileValue = document.getElementById("profileValue");
const sourceValue = document.getElementById("sourceValue");
const stageValue = document.getElementById("stageValue");
const nextActionValue = document.getElementById("nextActionValue");
const composerInput = document.getElementById("composerInput");
const newChatButton = document.getElementById("newChatButton");
const sendButton = document.getElementById("sendButton");
const attachContextButton = document.getElementById("attachContextButton");
const historyToggle = document.getElementById("historyToggle");
const connectorToggle = document.getElementById("connectorToggle");
const historyPanel = document.getElementById("historyPanel");
const connectorPanel = document.getElementById("connectorPanel");
const filterChips = Array.from(document.querySelectorAll(".filter-chip"));
const secretBindingsList = document.getElementById("secretBindings");
const playbookRegistry = document.getElementById("playbookRegistry");
const routingMatrixList = document.getElementById("routingMatrix");
const workflowBindingsList = document.getElementById("workflowBindings");
const chainGraphList = document.getElementById("chainGraph");
const runBoard = document.getElementById("runBoard");
const decisionTraceList = document.getElementById("decisionTrace");
const failureHeatmapList = document.getElementById("failureHeatmap");
const workspaceTabs = Array.from(document.querySelectorAll(".workspace-tab"));
const threadsPanel = document.getElementById("threadsPanel");
const profilesPanel = document.getElementById("profilesPanel");
const adminPanel = document.getElementById("adminPanel");
const playbooksPanel = document.getElementById("playbooksPanel");
const observabilityPanel = document.getElementById("observabilityPanel");
const playbooksShortcut = document.getElementById("playbooksShortcut");
const observabilityShortcut = document.getElementById("observabilityShortcut");
const profilesShortcut = document.getElementById("profilesShortcut");
const adminShortcut = document.getElementById("adminShortcut");
const launchRunButton = document.getElementById("launchRunButton");
const exportBriefButton = document.getElementById("exportBriefButton");
const pauseRunButton = document.getElementById("pauseRunButton");
const profileRegistry = document.getElementById("profileRegistry");
const profileFocus = document.getElementById("profileFocus");
const profileValidationGrid = document.getElementById("profileValidationGrid");
const profileOutputList = document.getElementById("profileOutputList");
const adminConnectorCatalog = document.getElementById("adminConnectorCatalog");
const adminConnectorSummary = document.getElementById("adminConnectorSummary");
const runtimeModeSelector = document.getElementById("runtimeModeSelector");
const mcpFabricList = document.getElementById("mcpFabricList");
const toolMappingList = document.getElementById("toolMappingList");
const adminEnvBindings = document.getElementById("adminEnvBindings");
const writebackPolicyList = document.getElementById("writebackPolicyList");
const adminSpecList = document.getElementById("adminSpecList");
const connectSourceAdapterButton = document.getElementById("connectSourceAdapterButton");
const switchProfileButton = document.getElementById("switchProfileButton");
const contextDiagnosticsButton = document.getElementById("contextDiagnosticsButton");

const workspacePanels = {
  threads: threadsPanel,
  profiles: profilesPanel,
  admin: adminPanel,
  playbooks: playbooksPanel,
  observability: observabilityPanel,
};

let activeChatId = chats[0]?.id || "";
let activeConnectorId = connectors[0]?.id || "";
let activeFilter = "all";
let activeWorkspaceView = "threads";
let activeProfileId = profiles[0]?.id || "";
let searchTerm = "";
const runtimeModeSelections = Object.fromEntries(
  adminConnectorProfiles.map((profile) => [
    profile.id,
    profile.activeRuntimeMode || profile.runtimeModes?.[0]?.id || "",
  ])
);

function normalizeProfileId(value) {
  return String(value || "").trim().toLowerCase();
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

function searchable(values) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

function matchesSearch(values) {
  if (!searchTerm) return true;
  return searchable(values).includes(searchTerm);
}

function matchesActiveProfile(profileName) {
  if (!activeProfileId) return true;
  return normalizeProfileId(profileName) === activeProfileId;
}

function activeProfile() {
  return profiles.find((profile) => profile.id === activeProfileId) || profiles[0] || null;
}

function activeChat() {
  return chats.find((item) => item.id === activeChatId) || null;
}

function activeConnectorProfile(visibleProfiles = adminConnectorProfiles) {
  return visibleProfiles.find((profile) => profile.id === activeConnectorId) || visibleProfiles[0] || null;
}

function currentRuntimeMode(profile) {
  if (!profile) return null;
  const selectedId = runtimeModeSelections[profile.id] || profile.activeRuntimeMode || profile.runtimeModes?.[0]?.id;
  return (profile.runtimeModes || []).find((mode) => mode.id === selectedId) || profile.runtimeModes?.[0] || null;
}

function formatList(value, separator = ", ") {
  if (Array.isArray(value)) return value.join(separator);
  return value || "None";
}

function matchesChatFilter(chat) {
  if (activeFilter === "assigned") {
    return chat.meta.some((item) => item.toLowerCase().includes("owner:"));
  }
  if (activeFilter === "watching") {
    return chat.meta.some((item) => item.toLowerCase().includes("human gate") || item.toLowerCase().includes("await"));
  }
  return true;
}

function filteredChats() {
  return chats.filter((chat) => (
    matchesChatFilter(chat) &&
    matchesActiveProfile(chat.profile) &&
    matchesSearch([
      chat.title,
      chat.source,
      chat.profile,
      chat.workflowStage,
      ...(chat.meta || []),
      ...((chat.messages || []).map((message) => `${message.author} ${message.body}`))
    ])
  ));
}

function visibleTemplates() {
  return templates.filter((template) => (
    matchesActiveProfile(template.profile) &&
    matchesSearch([template.title, template.meta, template.profile, template.prompt, template.sourceGraph])
  ));
}

function visiblePlaybooks() {
  return playbooks.filter((playbook) => (
    (activeProfileId ? normalizeProfileId(playbook.workload) === activeProfileId || normalizeProfileId(playbook.workload) === "shared" : true) &&
    matchesSearch([
      playbook.name,
      playbook.workload,
      playbook.status,
      playbook.owner,
      ...(playbook.stages || []),
      ...(playbook.gates || []),
      ...(playbook.chains || [])
    ])
  ));
}

function visibleRoutes() {
  return routingMatrix.filter((route) => (
    matchesActiveProfile(route.workload) &&
    matchesSearch([route.workload, route.signals, route.playbook, route.fallback])
  ));
}

function visibleRuns() {
  return liveRuns.filter((run) => (
    (!activeProfileId || searchable([run.playbook, run.source]).includes(activeProfileId)) &&
    matchesSearch([run.id, run.status, run.playbook, run.stage, run.source, run.risk, run.next])
  ));
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

function setWorkspaceView(view) {
  activeWorkspaceView = view;
  Object.entries(workspacePanels).forEach(([key, panel]) => {
    if (panel) panel.hidden = key !== view;
  });
  workspaceTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
}

function setActiveProfile(profileId, options = {}) {
  activeProfileId = profileId || profiles[0]?.id || "";
  renderHistory();
  renderTemplates();
  renderChat();
  renderPlaybooks();
  renderRoutingMatrix();
  renderRuns();
  renderDecisionTrace();
  renderFailureHeatmap();
  renderProfiles();

  if (options.view) {
    setWorkspaceView(options.view);
  }
}

function ensureActiveChatVisible(visibleChats) {
  if (!visibleChats.length) {
    activeChatId = "";
    return;
  }

  if (!visibleChats.some((chat) => chat.id === activeChatId)) {
    activeChatId = visibleChats[0].id;
  }
}

function renderHistory() {
  historyList.innerHTML = "";
  const visibleChats = filteredChats();
  ensureActiveChatVisible(visibleChats);

  visibleChats.forEach((chat) => {
    const button = document.createElement("button");
    button.className = `history-item${chat.id === activeChatId ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <div class="history-item-header">
        <div class="history-item-title">${chat.title}</div>
        <div class="history-item-time">${chat.time}</div>
      </div>
      <div class="history-item-meta">
        <span class="history-item-source">${chat.source}</span>
        <span class="history-item-stage">${chat.stage}</span>
      </div>
    `;

    button.addEventListener("click", () => {
      activeChatId = chat.id;
      setWorkspaceView("threads");
      renderHistory();
      renderChat();
      closePanelsOnMobile();
    });

    historyList.appendChild(button);
  });

  if (!visibleChats.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    const profileName = activeProfile()?.name || "current";
    empty.textContent = `No ${profileName.toLowerCase()} threads match the current search or filter.`;
    historyList.appendChild(empty);
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
      createTemplateChat(template);
      closePanelsOnMobile();
    });

    templateList.appendChild(button);
  });

  if (!templateList.children.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = "No templates match the active profile or search.";
    templateList.appendChild(empty);
  }
}

function renderOverview() {
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

function renderEmptyThreadState() {
  const profile = activeProfile();
  chatTitle.textContent = profile ? `${profile.name} delivery view` : "No active thread";
  chatMeta.innerHTML = "<span>No active thread selected</span>";
  profileValue.textContent = profile?.name || "N/A";
  sourceValue.textContent = "Awaiting source graph";
  stageValue.textContent = "Idle";
  nextActionValue.textContent = "Create or select a thread";
  composerInput.value = profile
    ? `Start a ${profile.name.toLowerCase()} workflow and route it through ${profile.defaultPlaybook}.`
    : "Start a workflow.";
  messageStream.innerHTML = '<div class="history-empty">No thread matches the current profile or search scope.</div>';
  insightGrid.innerHTML = "";
  timelineList.innerHTML = '<div class="history-empty">Timeline will appear once a thread is selected.</div>';
}

function renderChat() {
  const chat = activeChat();
  if (!chat) {
    renderEmptyThreadState();
    return;
  }

  chatTitle.textContent = chat.title;
  profileValue.textContent = chat.profile;
  sourceValue.textContent = chat.sourceGraph;
  stageValue.textContent = chat.workflowStage;
  composerInput.value = `Continue the ${chat.profile.toLowerCase()} workflow for "${chat.title}" and keep source sync guarded until approval.`;
  nextActionValue.textContent = chat.timeline?.find((item) => item.state === "active")?.summary || "Review active stage details";

  chatMeta.innerHTML = chat.meta.map((item) => `<span>${item}</span>`).join("");
  messageStream.innerHTML = "";
  insightGrid.innerHTML = "";
  timelineList.innerHTML = "";

  (chat.insights || []).forEach((insight) => {
    const card = document.createElement("div");
    card.className = `insight-card ${insightToneClass(insight.tone)}`;
    card.innerHTML = `
      <div class="insight-label">${insight.label}</div>
      <div class="insight-value">${insight.value}</div>
    `;
    insightGrid.appendChild(card);
  });

  (chat.timeline || []).forEach((entry) => {
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

  chat.messages.forEach((message) => {
    const article = document.createElement("article");
    article.className = `message ${message.role}`;
    article.innerHTML = `
      <div class="message-top">
        <div>
          <div class="message-author">${message.author}</div>
          <div class="message-meta">${message.timestamp}</div>
        </div>
        <div class="message-chips">
          ${message.chips.map((chip) => `<span class="message-chip">${chip}</span>`).join("")}
        </div>
      </div>
      <div class="message-body">${message.body}</div>
    `;
    messageStream.appendChild(article);
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
    ...(connector.env || [])
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
      renderConnectors();
      renderAdminConsole();
    });

    connectorList.appendChild(card);
  });

  if (!visibleConnectors.length) {
    connectorFocus.innerHTML = `
      <div class="focus-kicker">Selected connector</div>
      <h3 class="focus-title">No connector match</h3>
      <div class="focus-meta">Try a broader search to inspect connector configuration and capability details.</div>
    `;
    return;
  }

  const activeConnector = connectors.find((connector) => connector.id === activeConnectorId);
  if (!activeConnector) return;

  connectorFocus.innerHTML = `
    <div class="focus-kicker">Selected connector</div>
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
      <div class="focus-section-title">Operations</div>
      <div class="focus-list">
        ${(activeConnector.operations || []).map((operation) => `<div class="focus-list-item">${operation}</div>`).join("")}
      </div>
    </div>
    <div class="focus-section">
      <div class="focus-section-title">Environment keys</div>
      <div class="focus-list env-list">
        ${(activeConnector.env || []).map((envKey) => `<div class="focus-list-item">${envKey}</div>`).join("")}
      </div>
    </div>
  `;
}

function renderProviders() {
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
}

function renderPolicies() {
  policyList.innerHTML = "";

  policies.forEach((policy) => {
    const row = document.createElement("div");
    row.className = "policy-row";
    row.innerHTML = `
      <span>${policy.label}</span>
      <span class="policy-value">${policy.value}</span>
    `;
    policyList.appendChild(row);
  });
}

function renderSecretBindings() {
  secretBindingsList.innerHTML = "";

  secretBindings.forEach((binding) => {
    const row = document.createElement("div");
    row.className = "policy-row";
    row.innerHTML = `
      <span>${binding.label}</span>
      <span class="policy-value">${binding.value}</span>
    `;

    const detail = document.createElement("div");
    detail.className = "policy-subtext";
    detail.textContent = binding.detail;

    const wrapper = document.createElement("div");
    wrapper.className = "secret-row";
    wrapper.appendChild(row);
    wrapper.appendChild(detail);
    secretBindingsList.appendChild(wrapper);
  });
}

function renderProfiles() {
  profileRegistry.innerHTML = "";
  profileValidationGrid.innerHTML = "";
  profileOutputList.innerHTML = "";

  const selectedProfile = activeProfile();
  const visibleProfiles = profiles.filter((profile) => matchesSearch([
    profile.name,
    profile.description,
    profile.policySummary,
    profile.defaultPlaybook,
    ...(profile.stages || []),
    ...(profile.validationModes || []),
    ...(profile.outputs || [])
  ]));

  visibleProfiles.forEach((profile) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `playbook-row${profile.id === activeProfileId ? " active-card" : ""}`;
    card.innerHTML = `
      <div class="playbook-title-row">
        <div>
          <div class="playbook-name">${profile.name}</div>
          <div class="playbook-meta">${profile.defaultPlaybook} • ${profile.stages.length} stages</div>
        </div>
        <span class="connector-status ${connectorStatusClass(profile.status)}">${profile.status}</span>
      </div>
      <div class="playbook-detail">${profile.description}</div>
    `;
    card.addEventListener("click", () => setActiveProfile(profile.id, { view: "profiles" }));
    profileRegistry.appendChild(card);
  });

  if (!visibleProfiles.length) {
    profileRegistry.innerHTML = '<div class="history-empty">No profiles match the current search.</div>';
  }

  if (!selectedProfile) {
    profileFocus.innerHTML = '<div class="history-empty">No profile available.</div>';
    return;
  }

  profileFocus.innerHTML = `
    <div class="focus-kicker">Profile focus</div>
    <div class="focus-title-row">
      <h3 class="focus-title">${selectedProfile.name}</h3>
      <span class="connector-status ${connectorStatusClass(selectedProfile.status)}">${selectedProfile.status}</span>
    </div>
    <div class="focus-meta">${selectedProfile.description}</div>
    <div class="focus-section">
      <div class="focus-section-title">Default playbook</div>
      <div class="focus-list">
        <div class="focus-list-item">${selectedProfile.defaultPlaybook}</div>
      </div>
    </div>
    <div class="focus-section">
      <div class="focus-section-title">Gate posture</div>
      <div class="focus-chip-row">
        ${(selectedProfile.gates || []).map((gate) => `<span class="focus-chip">${gate}</span>`).join("")}
      </div>
    </div>
    <div class="focus-section">
      <div class="focus-section-title">Policy summary</div>
      <div class="focus-meta">${selectedProfile.policySummary}</div>
    </div>
  `;

  (selectedProfile.validationModes || []).forEach((mode) => {
    const card = document.createElement("div");
    card.className = "provider-card";
    card.innerHTML = `
      <div class="provider-name">${mode}</div>
      <div class="provider-source">Validation strategy enabled for the ${selectedProfile.name.toLowerCase()} lifecycle.</div>
    `;
    profileValidationGrid.appendChild(card);
  });

  (selectedProfile.outputs || []).forEach((output) => {
    const row = document.createElement("div");
    row.className = "policy-row";
    row.innerHTML = `
      <span>${output}</span>
      <span class="policy-value">required</span>
    `;
    profileOutputList.appendChild(row);
  });
}

function renderAdminConsole() {
  renderAdminConnectorCatalog();
  renderAdminConnectorSummary();
  renderRuntimeModes();
  renderMcpFabric();
  renderToolMappings();
  renderAdminBindings();
  renderWritebackPolicy();
  renderAdminSpec();
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
      renderConnectors();
      renderAdminConsole();
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
    adminConnectorSummary.innerHTML = '<div class="history-empty">No connector profile selected.</div>';
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
    <div class="focus-section">
      <div class="focus-section-title">Tags</div>
      <div class="focus-chip-row">
        ${(profile.tags || []).map((tag) => `<span class="focus-chip">${tag}</span>`).join("")}
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
      renderConnectors();
      renderAdminConsole();
    });
    runtimeModeSelector.appendChild(card);
  });
}

function renderMcpFabric() {
  mcpFabricList.innerHTML = "";
  const profile = activeConnectorProfile(visibleAdminConnectorProfiles());
  if (!profile) {
    mcpFabricList.innerHTML = '<div class="history-empty">No MCP fabric data available.</div>';
    return;
  }

  const mode = currentRuntimeMode(profile);
  const fabric = profile.mcpFabric || {};
  const rows = [
    `Namespace: ${fabric.namespace || "n/a"}`,
    `Advertised server: ${fabric.serverName || "n/a"}`,
    `Runtime mode env var: ${fabric.runtimeModeEnvVar || profile.runtimeModeEnvVar || "n/a"}`,
    `Namespace env var: ${fabric.namespaceEnvVar || profile.namespaceEnvVar || "n/a"}`,
    `Source base URL env var: ${fabric.sourceBaseUrlEnvVar || "n/a"}`,
    `Proxy base URL env var: ${fabric.proxyBaseUrlEnvVar || "n/a"}`,
    `Required server(s) for selected mode: ${formatList(mode?.requiredServerNames || [])}`,
    `Read path: ${fabric.sourceReadPath || "n/a"}`,
    `Write path: ${fabric.sourceWritePath || "n/a"}`,
  ];

  rows.forEach((text) => {
    const row = document.createElement("div");
    row.className = "focus-list-item";
    row.textContent = text;
    mcpFabricList.appendChild(row);
  });
}

function renderToolMappings() {
  toolMappingList.innerHTML = "";
  const profile = activeConnectorProfile(visibleAdminConnectorProfiles());
  if (!profile) {
    toolMappingList.innerHTML = '<div class="history-empty">No tool mappings available.</div>';
    return;
  }

  const mode = currentRuntimeMode(profile);
  (profile.toolMappings || []).forEach((mapping) => {
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
  if (!profile) {
    adminEnvBindings.innerHTML = '<div class="history-empty">No env bindings available.</div>';
    return;
  }

  const selectedModeId = currentRuntimeMode(profile)?.id;

  (profile.envBindings || [])
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

  (profile.secretBindings || []).forEach((binding) => {
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
  const profile = activeConnectorProfile(visibleAdminConnectorProfiles());
  if (!profile) {
    writebackPolicyList.innerHTML = '<div class="history-empty">No writeback policy available.</div>';
    return;
  }

  const policy = profile.writePolicy || {};
  const rows = [
    { label: "Comments", value: policy.allowComments ? "allowed" : "blocked" },
    { label: "Labels", value: policy.allowLabels ? "allowed" : "blocked" },
    { label: "Attachments", value: policy.allowAttachments ? "allowed" : "blocked" },
    { label: "Allowed field updates", value: formatList(policy.allowFieldUpdates || []) },
    { label: "Denied field updates", value: formatList(policy.denyFieldUpdates || []) },
    { label: "Approval posture", value: policy.approvalPosture || "n/a" },
  ];

  rows.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "policy-row";
    row.innerHTML = `
      <span>${entry.label}</span>
      <span class="policy-value">${entry.value}</span>
    `;
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

  const items = [
    `Admin sections: ${formatList(adminSections)}`,
    `Connector file: ${profile.connectorFile}`,
    `Source config: ${profile.sourceConfig}`,
    `Stable contract: ${profile.contractFile}`,
    `Admin catalog: ${profile.adminCatalogFile}`,
    "Spec document: Knockdown/docs/admin-console-spec.md",
  ];

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "binding-row";
    row.innerHTML = `<div class="playbook-detail">${item}</div>`;
    adminSpecList.appendChild(row);
  });
}

function renderPlaybooks() {
  playbookRegistry.innerHTML = "";
  const visible = visiblePlaybooks();

  visible.forEach((playbook) => {
    const card = document.createElement("div");
    card.className = "playbook-row";
    card.innerHTML = `
      <div class="playbook-title-row">
        <div>
          <div class="playbook-name">${playbook.name}</div>
          <div class="playbook-meta">${playbook.workload} • ${playbook.owner}</div>
        </div>
        <span class="connector-status ${connectorStatusClass(playbook.status)}">${playbook.status}</span>
      </div>
      <div class="playbook-chip-row">
        <span class="focus-chip">${playbook.outputs}</span>
        <span class="focus-chip">${playbook.stages.length} stages</span>
        <span class="focus-chip">${playbook.chains.length} downstream</span>
      </div>
      <div class="playbook-detail">${playbook.triggers.join(" • ")}</div>
      <div class="focus-list">
        <div class="focus-list-item">Stages: ${playbook.stages.join(" -> ")}</div>
        <div class="focus-list-item">Gates: ${playbook.gates.join(" • ")}</div>
      </div>
    `;
    playbookRegistry.appendChild(card);
  });

  if (!visible.length) {
    playbookRegistry.innerHTML = '<div class="history-empty">No playbooks match the current search or profile.</div>';
  }
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
    routingMatrixList.innerHTML = '<div class="history-empty">No routing entries match the active profile or search.</div>';
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

  if (!workflowBindingsList.children.length) {
    workflowBindingsList.innerHTML = '<div class="history-empty">No workflow bindings match the current search.</div>';
  }
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

  if (!chainGraphList.children.length) {
    chainGraphList.innerHTML = '<div class="history-empty">No chain graph entries match the current search.</div>';
  }
}

function renderRuns() {
  runBoard.innerHTML = "";

  visibleRuns().forEach((run) => {
    const card = document.createElement("div");
    card.className = "run-card";
    card.innerHTML = `
      <div class="run-top">
        <div>
          <div class="playbook-name">${run.id}</div>
          <div class="playbook-meta">${run.playbook} • ${run.source}</div>
        </div>
        <span class="connector-status ${connectorStatusClass(run.status)}">${run.status}</span>
      </div>
      <div class="run-meta">Stage: ${run.stage} • Duration: ${run.duration} • Risk: ${run.risk}</div>
      <div class="playbook-detail">${run.next}</div>
    `;
    runBoard.appendChild(card);
  });

  if (!runBoard.children.length) {
    runBoard.innerHTML = '<div class="history-empty">No live runs match the active profile or search.</div>';
  }
}

function renderDecisionTrace() {
  decisionTraceList.innerHTML = "";

  decisionTrace
    .filter((trace) => {
      const profile = activeProfile();
      const profileMatch = !profile || normalizeProfileId(trace.title).includes(profile.id);
      return profileMatch && matchesSearch([trace.title, ...(trace.details || [])]);
    })
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

  if (!decisionTraceList.children.length) {
    decisionTraceList.innerHTML = '<div class="history-empty">No decision trace entries match the active profile or search.</div>';
  }
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

  if (!failureHeatmapList.children.length) {
    failureHeatmapList.innerHTML = '<div class="history-empty">No failure hotspots match the current search.</div>';
  }
}

function createNewChat() {
  const profile = activeProfile();
  const threadNumber = chats.length + 1;
  const profileName = profile?.name || "Task";
  const stageName = profileName === "Case" ? "Diagnosis" : "Intake";
  const draft = {
    id: `draft-${threadNumber}`,
    title: `New ${profileName.toLowerCase()} delivery thread ${threadNumber}`,
    source: "Direct input / Unclassified",
    time: "just now",
    stage: stageName,
    profile: profileName,
    sourceGraph: "Awaiting adapter selection",
    workflowStage: stageName,
    meta: ["No source adapter selected", "Awaiting normalization", `Default playbook: ${profile?.defaultPlaybook || "task-intake"}`],
    insights: [],
    timeline: [
      { stage: "Intake", state: "active", summary: "Thread created and waiting for source normalization." },
      { stage: "Routing", state: "pending", summary: "Knockdown will select the initial playbook automatically." },
      { stage: "Execution", state: "pending", summary: "Execution stages will appear after routing completes." }
    ],
    messages: [
      {
        role: "system",
        author: "Work Delivery Agent",
        timestamp: "now",
        chips: ["Intake", profileName],
        body: `
          <p>Start with a requirement, issue URL, defect number, case reference, or direct task description. The generic pipeline will resolve the source adapter, normalize the work item, select <strong>${profile?.defaultPlaybook || "the right playbook"}</strong>, and emit a routing trace.</p>
        `
      }
    ]
  };

  chats.unshift(draft);
  activeChatId = draft.id;
  setWorkspaceView("threads");
  renderHistory();
  renderChat();
}

function createTemplateChat(template) {
  const threadNumber = chats.length + 1;
  const draft = {
    id: `${template.id}-${threadNumber}`,
    title: `${template.title} ${threadNumber}`,
    source: "Direct input / Template",
    time: "just now",
    stage: template.stage,
    profile: template.profile,
    sourceGraph: template.sourceGraph,
    workflowStage: template.stage,
    meta: ["Template seeded", "Awaiting source adapter selection", "Playbook chain not selected yet"],
    insights: [
      { label: "Confidence", value: "Pending", tone: "neutral" },
      { label: "Risk", value: "Unknown", tone: "warn" },
      { label: "Validation", value: "Not planned", tone: "neutral" },
      { label: "Writeback", value: "Not armed", tone: "neutral" }
    ],
    timeline: [
      { stage: "Intake", state: "active", summary: "Template thread created and waiting for a requirement or source identifier." },
      { stage: "Routing", state: "pending", summary: "The routing layer will pick the initial playbook after source normalization." },
      { stage: "Execution", state: "pending", summary: "Execution path will depend on the selected playbook chain." }
    ],
    messages: [
      {
        role: "system",
        author: "Work Delivery Agent",
        timestamp: "now",
        chips: [template.profile, "Template"],
        body: `<p>${template.prompt}</p>`
      }
    ]
  };

  chats.unshift(draft);
  activeChatId = draft.id;
  setActiveProfile(normalizeProfileId(template.profile));
  setWorkspaceView("threads");
  renderHistory();
  renderChat();
  composerInput.value = template.prompt;
}

function appendComposerMessage() {
  const text = composerInput.value.trim();
  const chat = activeChat();
  if (!text || !chat) return;

  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  chat.messages.push({
    role: "user",
    author: "Delivery Operator",
    timestamp,
    chips: ["Manual instruction"],
    body: `<p>${text.replace(/\n/g, "<br>")}</p>`
  });

  chat.messages.push({
    role: "agent",
    author: "Work Delivery Agent",
    timestamp,
    chips: ["Queued update", "Playbook routing"],
    body: `
      <p>The request has been staged in the operator console. In a live runtime this would re-run source resolution, update the decision trace, refresh playbook eligibility, and queue the next lifecycle action for the active thread.</p>
    `
  });

  chat.time = "just now";
  renderHistory();
  renderChat();
}

function attachContextToComposer() {
  const chat = activeChat();
  if (!chat) return;

  composerInput.value = `${composerInput.value.trim()}\n\nContext to include:\n- Source graph: ${chat.sourceGraph}\n- Active stage: ${chat.workflowStage}\n- Current gates: ${chat.meta.join(" | ")}`;
}

function handleLaunchRun() {
  if (!activeChat()) {
    createNewChat();
    return;
  }
  appendSystemNote("Run launch requested", "The active thread has been staged for execution. In a live environment this would queue the selected playbook chain.");
}

function handleExportBrief() {
  const chat = activeChat();
  if (!chat) return;

  const brief = [
    `Thread: ${chat.title}`,
    `Profile: ${chat.profile}`,
    `Stage: ${chat.workflowStage}`,
    `Source: ${chat.source}`,
    `Next: ${nextActionValue.textContent}`
  ].join("\n");

  composerInput.value = `${brief}\n\n${composerInput.value}`.trim();
  appendSystemNote("Brief exported", "A short delivery brief has been inserted into the composer so it can be shared or refined.");
}

function handlePauseRun() {
  const chat = activeChat();
  if (!chat) return;
  chat.meta = chat.meta.filter((item) => !item.startsWith("Run state:"));
  chat.meta.push("Run state: Paused");
  appendSystemNote("Run paused", "The active thread is now marked as paused and will not advance until resumed.");
  renderChat();
  renderHistory();
}

function handleConnectSourceAdapter() {
  setWorkspaceView("admin");
  appendSystemNote("Adapter workflow opened", "Use the connector catalog and secrets panel to configure a new source adapter safely.");
}

function handleSwitchProfile() {
  const storyProfile = profiles.find((profile) => profile.id === "story");
  if (!storyProfile) return;
  setActiveProfile(storyProfile.id, { view: "profiles" });
  appendSystemNote("Profile switched", "The console is now scoped to the story lifecycle profile.");
}

function handleContextDiagnostics() {
  if (connectorPanel) {
    connectorPanel.classList.add("open");
  }
  appendSystemNote("Diagnostics opened", "Context providers and connector capabilities are now in focus on the right-hand panel.");
}

function appendSystemNote(chip, body) {
  const chat = activeChat();
  if (!chat) return;

  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  chat.messages.push({
    role: "agent",
    author: "Console Control Plane",
    timestamp,
    chips: [chip],
    body: `<p>${body}</p>`
  });
}

function closePanelsOnMobile() {
  if (window.innerWidth <= 980) {
    historyPanel.classList.remove("open");
    connectorPanel.classList.remove("open");
  }
}

newChatButton.addEventListener("click", createNewChat);
sendButton.addEventListener("click", appendComposerMessage);
attachContextButton.addEventListener("click", attachContextToComposer);
launchRunButton.addEventListener("click", handleLaunchRun);
exportBriefButton.addEventListener("click", handleExportBrief);
pauseRunButton.addEventListener("click", handlePauseRun);
connectSourceAdapterButton.addEventListener("click", handleConnectSourceAdapter);
switchProfileButton.addEventListener("click", handleSwitchProfile);
contextDiagnosticsButton.addEventListener("click", handleContextDiagnostics);

workspaceTabs.forEach((tab) => {
  tab.addEventListener("click", () => setWorkspaceView(tab.dataset.view));
});

playbooksShortcut.addEventListener("click", () => setWorkspaceView("playbooks"));
observabilityShortcut.addEventListener("click", () => setWorkspaceView("observability"));
profilesShortcut.addEventListener("click", () => setWorkspaceView("profiles"));
adminShortcut.addEventListener("click", () => setWorkspaceView("admin"));

globalSearchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderHistory();
  renderTemplates();
  renderChat();
  renderConnectors();
  renderProfiles();
  renderAdminConsole();
  renderPlaybooks();
  renderRoutingMatrix();
  renderWorkflowBindings();
  renderChainGraph();
  renderRuns();
  renderDecisionTrace();
  renderFailureHeatmap();
});

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeFilter = chip.dataset.filter || "all";
    filterChips.forEach((button) => button.classList.toggle("active", button === chip));
    renderHistory();
    renderChat();
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

renderOverview();
renderHistory();
renderTemplates();
renderChat();
renderConnectors();
renderProviders();
renderPolicies();
renderSecretBindings();
renderProfiles();
renderAdminConsole();
renderPlaybooks();
renderRoutingMatrix();
renderWorkflowBindings();
renderChainGraph();
renderRuns();
renderDecisionTrace();
renderFailureHeatmap();
setWorkspaceView(activeWorkspaceView);
