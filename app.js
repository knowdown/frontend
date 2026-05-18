const data = window.KNOCKDOWN_CONSOLE_DATA || {};

const templates = data.templates || [];
const workTypes = data.workTypes || [];
const connectors = data.connectors || [];
const configSources = data.configSources || [];
const chats = data.chats || [];
const liveRuns = data.liveRuns || [];
const decisionTrace = data.decisionTrace || [];
const failureHeatmap = data.failureHeatmap || [];
const profiles = data.profiles || [];
const onboardingWorkflow = data.onboardingWorkflow || [];
const adminConsole = data.adminConsole || {};
const baseConnectorProfiles = adminConsole.connectorProfiles || [];
const githubPersistenceDefaults = data.githubPersistenceDefaults || {};
const baseWorkflowProfiles = workTypes.map((flow) => ({
  id: flow.id,
  name: flow.name,
  workflowFile: flow.workflowAdmin?.workflowFile || `.github/workflows/${flow.id}.yml`,
  activationState: flow.workflowAdmin?.activationState || (flow.status === "LIVE" ? "active" : "inactive"),
  retryCount: flow.workflowAdmin?.retryCount ?? 1,
  maxConcurrency: flow.workflowAdmin?.maxConcurrency ?? 1,
  triggerConditions: flow.workflowAdmin?.triggerConditions || (flow.routingSignals || []).join(", "),
  requiredConnectorIds: flow.workflowAdmin?.requiredConnectorIds || flow.connectorIds || [],
  optionalConnectorIds: flow.workflowAdmin?.optionalConnectorIds || [],
  summary: flow.summary || "",
}));

const ADMIN_STORAGE_KEY = "knockdown.admin.connectorProfiles.v1";
const WORKFLOW_STORAGE_KEY = "knockdown.admin.workflowProfiles.v1";
const GITHUB_PERSISTENCE_STORAGE_KEY = "knockdown.admin.githubPersistence.v1";
const GITHUB_API_VERSION = "2022-11-28";

const $ = (id) => document.getElementById(id);

const panels = {
  setup: $("setupPanel"),
  runs: $("runsPanel"),
  monitor: $("monitorPanel"),
  admin: $("adminPanel"),
};

const navButtons = Array.from(document.querySelectorAll(".primary-nav"));
const searchInput = document.querySelector(".global-search input");
const filterChips = Array.from(document.querySelectorAll(".filter-chip"));

let activeView = "setup";
let activeRunId = liveRuns[0]?.id || "";
let activeTemplateId = templates[0]?.id || "";
let activeFlowId = workTypes[0]?.id || "";
let activeSourceId = connectors[0]?.id || "";
let activeFilter = "all";
let searchTerm = "";
let adminMode = "view";
let adminStage = "catalog";
let adminEntity = "connectors";
let adminCatalogSearchTerm = "";
let activeAdminWorkflowId = workTypes[0]?.id || "";
let adminCatalogFilter = "all";
let adminCreatedProfileIds = new Set();
let connectorProfilesState = hydrateConnectorProfiles(baseConnectorProfiles, loadAdminOverrides());
let workflowProfilesState = hydrateWorkflowProfiles(baseWorkflowProfiles, loadWorkflowOverrides());
let githubPersistenceState = hydrateGithubPersistence(loadGithubPersistence());
let persistenceStatus = {
  tone: "pending",
  message: "Local admin edits are ready. Connect GitHub to persist connector config, variables, and secrets.",
  details: [],
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base, override) {
  if (override === undefined) return deepClone(base);
  if (Array.isArray(base) || Array.isArray(override)) return deepClone(override);
  if (isObject(base) && isObject(override)) {
    const result = {};
    const keys = new Set([...Object.keys(base || {}), ...Object.keys(override || {})]);
    keys.forEach((key) => {
      result[key] = key in override ? deepMerge(base?.[key], override[key]) : deepClone(base?.[key]);
    });
    return result;
  }
  return deepClone(override);
}

function storageAvailable() {
  try {
    return Boolean(window?.localStorage);
  } catch (_error) {
    return false;
  }
}

function loadAdminOverrides() {
  if (!storageAvailable()) return null;
  try {
    const value = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch (_error) {
    return null;
  }
}

function saveAdminOverrides() {
  if (!storageAvailable()) return;
  window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(connectorProfilesState));
}

function clearAdminOverrides() {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(ADMIN_STORAGE_KEY);
}

function loadWorkflowOverrides() {
  if (!storageAvailable()) return null;
  try {
    const value = window.localStorage.getItem(WORKFLOW_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch (_error) {
    return null;
  }
}

function saveWorkflowOverrides() {
  if (!storageAvailable()) return;
  window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(workflowProfilesState));
}

function clearWorkflowOverrides() {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(WORKFLOW_STORAGE_KEY);
}

function loadGithubPersistence() {
  if (!storageAvailable()) return null;
  try {
    const value = window.localStorage.getItem(GITHUB_PERSISTENCE_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch (_error) {
    return null;
  }
}

function hydrateGithubPersistence(saved) {
  return {
    apiBase: githubPersistenceDefaults.apiBase || "https://api.github.com",
    owner: githubPersistenceDefaults.owner || "",
    repo: githubPersistenceDefaults.repo || "",
    branch: githubPersistenceDefaults.branch || "main",
    environment: githubPersistenceDefaults.environment || "",
    commitMessagePrefix: githubPersistenceDefaults.commitMessagePrefix || "chore(connectors): update",
    token: "",
    ...saved,
  };
}

function saveGithubPersistence() {
  if (!storageAvailable()) return;
  window.localStorage.setItem(GITHUB_PERSISTENCE_STORAGE_KEY, JSON.stringify(githubPersistenceState));
}

function updateGithubPersistence(patch) {
  githubPersistenceState = {
    ...githubPersistenceState,
    ...patch,
  };
  saveGithubPersistence();
}

function setPersistenceStatus(tone, message, details = []) {
  persistenceStatus = { tone, message, details };
}

function hydrateConnectorProfiles(baseProfiles, overrides) {
  const base = deepClone(baseProfiles);
  if (!Array.isArray(overrides) || !overrides.length) return base;
  const byId = new Map(overrides.map((profile) => [profile.id, profile]));
  return base.map((profile) => {
    const override = byId.get(profile.id);
    return override ? deepMerge(profile, override) : profile;
  });
}

function hydrateWorkflowProfiles(baseProfiles, overrides) {
  const base = deepClone(baseProfiles);
  if (!Array.isArray(overrides) || !overrides.length) return base;
  const byId = new Map(overrides.map((profile) => [profile.id, profile]));
  return base.map((profile) => {
    const override = byId.get(profile.id);
    return override ? deepMerge(profile, override) : profile;
  });
}

function resetConnectorProfile(connectorId) {
  const base = baseConnectorProfiles.find((profile) => profile.id === connectorId);
  if (!base) return;
  connectorProfilesState = connectorProfilesState.map((profile) => (
    profile.id === connectorId ? deepClone(base) : profile
  ));
  saveAdminOverrides();
}

function resetAllConnectorProfiles() {
  connectorProfilesState = deepClone(baseConnectorProfiles);
  clearAdminOverrides();
}

function resetAllWorkflowProfiles() {
  workflowProfilesState = deepClone(baseWorkflowProfiles);
  clearWorkflowOverrides();
}

function updateConnectorProfile(connectorId, transform) {
  connectorProfilesState = connectorProfilesState.map((profile) => {
    if (profile.id !== connectorId) return profile;
    const nextProfile = transform(deepClone(profile));
    return nextProfile || profile;
  });
  saveAdminOverrides();
}

function updateWorkflowProfile(workflowId, transform) {
  workflowProfilesState = workflowProfilesState.map((profile) => {
    if (profile.id !== workflowId) return profile;
    const nextProfile = transform(deepClone(profile));
    return nextProfile || profile;
  });
  saveWorkflowOverrides();
}

function upsertConnectorDescriptorFromProfile(profile) {
  const existing = connectors.find((connector) => connector.id === profile.id);
  const descriptor = {
    id: profile.id,
    name: profile.name || profile.displayName || profile.id,
    status: profile.status || "STAGED",
    lifecycleState: profile.lifecycleState || "inactive",
    mode: profile.category || "Custom connector",
    detail: profile.summary || "Customer-managed connector configuration.",
    meta: `Config: ${profile.connectorFile || "pending"} • Source: ${profile.sourceConfig || "pending"} • State: ${profile.lifecycleState || "inactive"} • Policy: ${profile.writePolicy?.approvalPosture || "review before publish"}`,
    health: existing?.health || "Draft",
    latency: existing?.latency || "N/A",
    capabilities: existing?.capabilities || ["Custom source reads", "Custom writeback"],
    env: existing?.env || (profile.envBindings || []).map((binding) => binding.key),
    operations: existing?.operations || (profile.toolMappings || []).map((mapping) => mapping.bindingId).filter(Boolean),
    setupGuide: existing?.setupGuide || {
      setupType: "Custom connector config",
      readiness: "Configure bindings in Admin, then dry-run before promotion.",
      steps: [
        "Fill in connector basics and runtime mode.",
        "Map MCP tools to real implementations.",
        "Bind env values and secrets, then save to GitHub.",
      ],
      testHint: "Use the New Setup page after saving to validate this connector with a representative work item.",
    },
  };

  if (existing) {
    Object.assign(existing, descriptor);
    return existing;
  }

  connectors.push(descriptor);
  return descriptor;
}

function createConnectorProfileFromTemplate(sourceProfileId = "enterprise-template", options = {}) {
  const sourceProfile = connectorProfile(sourceProfileId) || connectorProfile("enterprise-template") || connectorProfilesState[0];
  if (!sourceProfile) return null;

  const nextName = options.name || `New ${sourceProfile.name || "Connector"} Config`;
  const nextId = ensureUniqueConnectorId(options.id || `${sourceProfile.id || "connector"}-copy`);
  const nextProfile = deepClone(sourceProfile);

  nextProfile.id = nextId;
  nextProfile.name = nextName;
  nextProfile.status = "STAGED";
  nextProfile.lifecycleState = "inactive";
  nextProfile.summary = options.summary || "New connector config. Update the source contract, runtime mode, bindings, and writeback policy before publishing.";
  nextProfile.category = options.category || "Customer-editable connector";
  nextProfile.connectorFile = `config/connectors/${nextId}.json`;
  nextProfile.sourceConfig = `config/sources/${nextId}.yaml`;
  nextProfile.tags = Array.from(new Set([...(nextProfile.tags || []), "draft", "editable"]));

  connectorProfilesState = [nextProfile, ...connectorProfilesState];
  saveAdminOverrides();
  upsertConnectorDescriptorFromProfile(nextProfile);
  activeSourceId = nextProfile.id;
  adminCreatedProfileIds.add(nextProfile.id);
  setPersistenceStatus("pending", `Created local connector config ${nextProfile.name}. Fill in the basics, runtime mappings, and bindings, then save to GitHub.`);
  return nextProfile;
}

function createConnectorProfileForSource(source = activeSource()) {
  const nextSource = source || activeSource();
  return createConnectorProfileFromTemplate("enterprise-template", {
    id: nextSource?.id || "connector-config",
    name: nextSource?.name ? `${nextSource.name} Config` : "New Connector Config",
    category: nextSource?.mode || "Customer-editable connector",
    summary: nextSource?.name
      ? `Editable connector config for ${nextSource.name}. Update runtime mode, MCP mappings, env values, secrets, and writeback policy before promotion.`
      : "New connector config. Update the source contract, runtime mode, bindings, and writeback policy before publishing.",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function decodeBase64Utf8(value) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function ensureUniqueConnectorId(baseId) {
  const startingId = slugify(baseId) || "connector-config";
  let candidate = startingId;
  let index = 2;
  while (connectorProfilesState.some((profile) => profile.id === candidate)) {
    candidate = `${startingId}-${index}`;
    index += 1;
  }
  return candidate;
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function matches(values) {
  if (!searchTerm) return true;
  return values.filter(Boolean).join(" ").toLowerCase().includes(searchTerm);
}

function matchesAdminCatalog(values) {
  const haystack = values.filter(Boolean).join(" ").toLowerCase();
  if (searchTerm && !haystack.includes(searchTerm)) return false;
  if (adminCatalogSearchTerm && !haystack.includes(adminCatalogSearchTerm)) return false;
  return true;
}

function matchesAdminFilter(profile) {
  if (adminEntity === "workflows") return true;
  if (adminCatalogFilter === "all") return true;
  const tags = profile.tags || [];
  const runtimeIds = (profile.runtimeModes || []).map((mode) => mode.id);
  if (adminCatalogFilter === "ootb") return tags.includes("ootb");
  if (adminCatalogFilter === "draft") return profile.status === "STAGED" || profile.status === "DRAFT" || tags.includes("draft");
  if (adminCatalogFilter === "proxy_mcp") return runtimeIds.includes("proxy_mcp");
  if (adminCatalogFilter === "vendor_mcp") return runtimeIds.includes("vendor_mcp");
  return true;
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (["live", "active", "running", "online"].includes(value)) return "live";
  if (["waiting", "chained", "shared"].includes(value)) return "pending";
  return "staged";
}

function connectorProfile(id) {
  return connectorProfilesState.find((item) => item.id === id) || null;
}

function setAdminMode(mode) {
  adminMode = mode === "edit" ? "edit" : "view";
}

function setAdminEntity(entity) {
  adminEntity = entity === "workflows" ? "workflows" : "connectors";
}

function workflowProfile(id) {
  return workflowProfilesState.find((item) => item.id === id) || null;
}

function activeAdminWorkflow() {
  return workflowProfile(activeAdminWorkflowId) || workflowProfile(activeFlowId) || workflowProfilesState[0] || null;
}

function setAdminStage(stage) {
  adminStage = stage === "detail" ? "detail" : "catalog";
}

function openAdminCatalog() {
  setAdminStage("catalog");
  setAdminMode("view");
}

function openAdminDetail(options = {}) {
  setAdminStage("detail");
  if (options.entity) setAdminEntity(options.entity);
  if (options.mode) setAdminMode(options.mode);
}

function removeConnectorProfile(connectorId) {
  connectorProfilesState = connectorProfilesState.filter((profile) => profile.id !== connectorId);
  saveAdminOverrides();
  const connectorIndex = connectors.findIndex((connector) => connector.id === connectorId);
  if (connectorIndex >= 0) connectors.splice(connectorIndex, 1);
  adminCreatedProfileIds.delete(connectorId);
}

function cancelConnectorChanges(connectorId = activeSourceId) {
  if (!connectorId) return;
  if (adminCreatedProfileIds.has(connectorId)) {
    removeConnectorProfile(connectorId);
  } else if (baseConnectorProfiles.some((profile) => profile.id === connectorId)) {
    resetConnectorProfile(connectorId);
    const updated = connectorProfile(connectorId);
    if (updated) upsertConnectorDescriptorFromProfile(updated);
  }
  activeSourceId = connectorProfilesState[0]?.id || connectors[0]?.id || "";
  setPersistenceStatus("pending", "Canceled connector changes and returned to the connector catalog.");
}

function resetWorkflowProfile(workflowId) {
  const base = baseWorkflowProfiles.find((profile) => profile.id === workflowId);
  if (!base) return;
  workflowProfilesState = workflowProfilesState.map((profile) => (
    profile.id === workflowId ? deepClone(base) : profile
  ));
  saveWorkflowOverrides();
}

function cancelWorkflowChanges(workflowId = activeAdminWorkflowId) {
  if (!workflowId) return;
  resetWorkflowProfile(workflowId);
  setPersistenceStatus("pending", "Canceled workflow changes and returned to the workflow catalog.");
}

function summarizeMappingPreview(mappings = [], limit = 3) {
  return mappings
    .slice(0, limit)
    .map((mapping) => `${mapping.stableTool} -> ${mapping.vendorTool || mapping.bindingId || "pending"}`);
}

function formatListValue(list) {
  return Array.isArray(list) && list.length ? list.join(", ") : "None";
}

function renderGuideRows(rows) {
  return rows.map(([label, value]) => `
    <div class="guide-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");
}

function connectorLifecycleState(profile = activeAdminProfile()) {
  return profile?.lifecycleState || "inactive";
}

function connectorValidationSummary(profile = activeAdminProfile()) {
  const envCount = currentEnvBindings(profile).length;
  const secretCount = currentSecretBindings(profile).length;
  const totalBindings = envCount + secretCount;
  const configuredCount = configuredBindingCount(profile);
  if (!profile) {
    return {
      ready: false,
      status: "inactive",
      detail: "No connector selected.",
    };
  }
  if (totalBindings === 0) {
    return {
      ready: true,
      status: connectorLifecycleState(profile),
      detail: "No runtime bindings are modeled for the active runtime mode.",
    };
  }
  if (configuredCount < totalBindings) {
    return {
      ready: false,
      status: "inactive",
      detail: `${configuredCount} of ${totalBindings} required bindings are configured.`,
    };
  }
  return {
    ready: true,
    status: connectorLifecycleState(profile) === "active" ? "active" : "validated",
    detail: `${configuredCount} of ${totalBindings} required bindings are configured.`,
  };
}

function workflowConnectorReadiness(workflow = activeAdminWorkflow()) {
  const required = (workflow?.requiredConnectorIds || []).map((connectorId) => {
    const profile = connectorProfile(connectorId);
    return {
      id: connectorId,
      name: profile?.name || connectors.find((item) => item.id === connectorId)?.name || connectorId,
      state: connectorLifecycleState(profile),
      ready: ["validated", "active"].includes(connectorLifecycleState(profile)),
    };
  });
  const optional = (workflow?.optionalConnectorIds || []).map((connectorId) => {
    const profile = connectorProfile(connectorId);
    return {
      id: connectorId,
      name: profile?.name || connectors.find((item) => item.id === connectorId)?.name || connectorId,
      state: connectorLifecycleState(profile),
      ready: ["validated", "active"].includes(connectorLifecycleState(profile)),
    };
  });
  const missingRequired = required.filter((item) => !item.ready);
  return {
    required,
    optional,
    missingRequired,
    canActivate: missingRequired.length === 0,
  };
}

function activeRun() {
  return liveRuns.find((run) => run.id === activeRunId) || liveRuns[0] || null;
}

function activeThread() {
  const run = activeRun();
  return chats.find((chat) => chat.id === run?.threadId) || null;
}

function activeFlow() {
  return workTypes.find((flow) => flow.id === activeFlowId) || workTypes[0] || null;
}

function activeSource() {
  return connectors.find((source) => source.id === activeSourceId) || connectors[0] || null;
}

function activeTemplate() {
  return templates.find((template) => template.id === activeTemplateId) || templates[0] || null;
}

function activeProfile() {
  const flow = activeFlow();
  return profiles.find((profile) => profile.id === flow?.profileId) || null;
}

function activeAdminProfile() {
  return connectorProfile(activeSourceId) || connectorProfilesState[0] || null;
}

function flowSources(flow = activeFlow()) {
  if (!flow) return [];
  return (flow.connectorIds || [])
    .map((id) => connectors.find((connector) => connector.id === id))
    .filter(Boolean);
}

function recommendedSourceForFlow(flow = activeFlow()) {
  if (!flow) return null;
  return connectors.find((connector) => connector.id === flow.recommendedSourceId) || flowSources(flow)[0] || null;
}

function primarySourceLabel(flow = activeFlow()) {
  const recommended = recommendedSourceForFlow(flow);
  return flow?.primarySourceLabel || recommended?.name || "Primary source";
}

function defaultImplementationVendor(flow = activeFlow()) {
  const recommended = recommendedSourceForFlow(flow);
  return flow?.defaultImplementationVendor || recommended?.name || "Default implementation";
}

function sourceSupportedByFlow(source = activeSource(), flow = activeFlow()) {
  if (!source || !flow) return false;
  return (flow.connectorIds || []).includes(source.id);
}

function isPrimarySource(source = activeSource(), flow = activeFlow()) {
  const recommended = recommendedSourceForFlow(flow);
  return Boolean(source && recommended && source.id === recommended.id);
}

function ensureSourceForFlow(flow = activeFlow(), preferRecommended = false) {
  const currentSource = activeSource();
  const supported = sourceSupportedByFlow(currentSource, flow);
  if (!supported || preferRecommended) {
    const recommended = recommendedSourceForFlow(flow);
    if (recommended) activeSourceId = recommended.id;
  }
}

function setFlow(flowId, options = {}) {
  activeFlowId = flowId;
  activeAdminWorkflowId = flowId;
  ensureSourceForFlow(activeFlow(), Boolean(options.preferRecommended));
}

function applyTemplate(template) {
  const flow = workTypes.find((item) => item.profileId.toLowerCase() === template.profile.toLowerCase()) || activeFlow();
  activeTemplateId = template.id;
  setFlow(flow.id, { preferRecommended: true });
  setView("setup");
  renderAll();
}

function currentRuntimeMode(profile = activeAdminProfile()) {
  if (!profile) return null;
  return (profile.runtimeModes || []).find((mode) => mode.id === profile.activeRuntimeMode)
    || profile.runtimeModes?.[0]
    || null;
}

function bindingMatchesMode(binding, profile = activeAdminProfile()) {
  const modeId = currentRuntimeMode(profile)?.id;
  if (!binding?.modes?.length || !modeId) return true;
  return binding.modes.includes(modeId);
}

function currentEnvBindings(profile = activeAdminProfile()) {
  return (profile?.envBindings || []).filter((binding) => binding.kind !== "secret" && bindingMatchesMode(binding, profile));
}

function currentSecretBindings(profile = activeAdminProfile()) {
  return (profile?.envBindings || []).filter((binding) => binding.kind === "secret" && bindingMatchesMode(binding, profile));
}

function currentSecretNotes(profile = activeAdminProfile()) {
  return profile?.secretBindings || [];
}

function configuredBindingCount(profile = activeAdminProfile()) {
  const envCount = currentEnvBindings(profile).filter((binding) => String(binding.value || "").trim()).length;
  const secretCount = currentSecretBindings(profile).filter((binding) => String(binding.value || "").trim()).length;
  return envCount + secretCount;
}

function visibleRuns() {
  return liveRuns.filter((run) => {
    const status = String(run.status || "").toLowerCase();
    const filterMatch = activeFilter === "all" ||
      (activeFilter === "running" && status === "running") ||
      (activeFilter === "waiting" && ["waiting", "chained"].includes(status));
    const flow = workTypes.find((item) => item.id === run.workTypeId);
    return filterMatch && matches([run.id, run.source, run.stage, run.next, flow?.name]);
  });
}

function setView(view) {
  activeView = view;
  Object.entries(panels).forEach(([key, panel]) => {
    panel.hidden = key !== view;
  });
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  renderHeader();
}

function renderHeader() {
  $("launchRunButton").hidden = activeView === "admin";

  if (activeView === "setup") {
    const flow = activeFlow();
    const source = activeSource();
    const sourceRole = isPrimarySource(source, flow) ? "Primary source" : sourceSupportedByFlow(source, flow) ? "Supporting connector" : "Not mapped to this flow";
    $("workspaceKicker").textContent = "Playground";
    $("chatTitle").textContent = "Playground";
    $("chatMeta").innerHTML = [
      `Source: ${escapeHtml(source?.name || "Choose one")}`,
      `Flow: ${escapeHtml(flow?.name || "Choose one")}`,
      escapeHtml(sourceRole),
    ].map((item) => `<span>${item}</span>`).join("");
    return;
  }

  if (activeView === "monitor") {
    $("workspaceKicker").textContent = "Monitor";
    $("chatTitle").textContent = "Automation health";
    $("chatMeta").innerHTML = "<span>Active runs and items that need attention.</span>";
    return;
  }

  if (activeView === "admin") {
    const profile = activeAdminProfile();
    $("workspaceKicker").textContent = "Admin";
    $("chatTitle").textContent = profile ? `${profile.name} configuration` : "Connector control plane";
    $("chatMeta").innerHTML = [
      profile?.category || "Connector control plane",
      currentRuntimeMode(profile)?.label ? `Mode: ${currentRuntimeMode(profile).label}` : "",
      `${configuredBindingCount(profile)} configured values`,
    ].filter(Boolean).map((item) => `<span>${escapeHtml(item)}</span>`).join("");
    return;
  }

  const run = activeRun();
  const flow = workTypes.find((item) => item.id === run?.workTypeId);
  $("workspaceKicker").textContent = "Run";
  $("chatTitle").textContent = run ? `${run.id} · ${run.source}` : "No run selected";
  $("chatMeta").innerHTML = [
    flow?.name,
    run?.status ? `Status: ${run.status}` : "",
    run?.next ? `Next: ${run.next}` : "",
  ].filter(Boolean).map((item) => `<span>${escapeHtml(item)}</span>`).join("");
}

function renderSelects() {
  $("sourceSelect").innerHTML = connectors.map((source) => (
    `<option value="${escapeHtml(source.id)}"${source.id === activeSourceId ? " selected" : ""}>${escapeHtml(source.name)}</option>`
  )).join("");

  $("flowSelect").innerHTML = workTypes.map((flow) => (
    `<option value="${escapeHtml(flow.id)}"${flow.id === activeFlowId ? " selected" : ""}>${escapeHtml(flow.name)}</option>`
  )).join("");
}

function setupHint(flow, source, recommendedSource) {
  if (!flow || !source) {
    return "Pick a flow and a source. Knockdown will then show you the exact connector setup path and first dry-run target.";
  }

  const primaryLabel = primarySourceLabel(flow);
  const defaultVendor = defaultImplementationVendor(flow);

  if (!sourceSupportedByFlow(source, flow)) {
    return `${source.name} is not part of the ${flow.name} path. Start with ${primaryLabel}, then attach supporting connectors after the dry-run succeeds. ${defaultVendor} is the default shipped implementation vendor.`;
  }

  if (!isPrimarySource(source, flow)) {
    return `${source.name} is a supporting connector for ${flow.name}. Use ${primaryLabel} as the primary intake source, then add ${source.name} for validation or enrichment. ${defaultVendor} is the default shipped implementation vendor.`;
  }

  return `${source.name} is currently fulfilling the ${primaryLabel.toLowerCase()} role for ${flow.name}. Next, bind its credentials, confirm field mapping, and run one sample item through a dry-run before enabling writeback. ${defaultVendor} is the default shipped implementation vendor for this contract.`;
}

function renderSetup() {
  const template = activeTemplate();
  const flow = activeFlow();
  const profile = activeProfile();
  const source = activeSource();
  const sourceConfig = connectorProfile(source?.id);
  const sourceGuide = source?.setupGuide || {};
  const flowGuide = flow?.setupGuide || {};
  const supportedSources = flowSources(flow);
  const recommendedSource = recommendedSourceForFlow(flow);
  const envBindings = currentEnvBindings(sourceConfig);
  const sourceSecrets = currentSecretBindings(sourceConfig);
  const sourceSecretNotes = currentSecretNotes(sourceConfig);
  const sourceInputs = envBindings.length
    ? envBindings.map((binding) => ({
        kind: binding.kind === "secret" ? "Secret" : "Env",
        label: binding.key,
        detail: binding.note,
        value: binding.value || "",
      }))
    : (source?.env || []).map((key) => ({
        kind: "Env",
        label: key,
        detail: "Required by the selected source connector.",
        value: "",
      }));
  const totalBindings = envBindings.length + sourceSecrets.length;
  const configuredCount = configuredBindingCount(sourceConfig);
  const hasEditableConfig = Boolean(sourceConfig);
  const runtimeMode = currentRuntimeMode(sourceConfig);
  const mappingPreview = summarizeMappingPreview(sourceConfig?.toolMappings || []);
  const storageMap = [
    {
      title: "Workload and source selection",
      detail: "Configured on this Setup page. This choice decides which playbook path and source contract Knockdown will use for the dry-run.",
      meta: "Stay on Setup for this choice.",
    },
    {
      title: "Runtime mode, MCP server, and tool mappings",
      detail: hasEditableConfig
        ? `Edit these in Admin and save the connector file ${sourceConfig.connectorFile || "for this source"} to GitHub.`
        : "Create a connector config first, then edit runtime mode and MCP mappings in Admin.",
      meta: hasEditableConfig ? "Admin > Runtime and MCP fabric / Tool mappings" : "Create connector config",
    },
    {
      title: "Env values and secret references",
      detail: hasEditableConfig
        ? "Edit these in Admin. Save env values as GitHub variables and secrets as encrypted GitHub Actions secrets."
        : "These inputs cannot be bound until a connector config exists.",
      meta: "Admin > Env and secrets",
    },
    {
      title: "Writeback policy",
      detail: hasEditableConfig
        ? "Allowed comments, labels, attachments, and field updates are modeled in the connector profile."
        : "Writeback policy will be created from the enterprise template.",
      meta: "Admin > Writeback policy",
    },
  ];
  const displaySources = sourceSupportedByFlow(source, flow)
    ? supportedSources
    : [source, ...supportedSources.filter((item) => item.id !== source?.id)];
  const configDecision = !hasEditableConfig
    ? "No editable connector config is mapped to this source yet."
    : totalBindings === 0
      ? "This connector profile exists, but no runtime bindings are modeled for the active mode."
      : configuredCount >= totalBindings
        ? "This connector looks ready for a dry-run."
        : `${configuredCount} of ${totalBindings} required bindings are filled. Finish configuration before promotion.`;

  renderSelects();

  $("newRunButton").textContent = flow ? `Run ${flow.name} dry-run` : "Run Playground dry-run";
  $("launchRunButton").textContent = flow ? `Run ${flow.name} dry-run` : "Run Playground dry-run";
  $("setupSelectionHint").textContent = `${setupHint(flow, source, recommendedSource)} ${configDecision}`;
  $("setupStateBanner").innerHTML = `
    <strong>${escapeHtml(flow?.name || "Choose a workload")} with ${escapeHtml(source?.name || "a source")}</strong><br>
    ${escapeHtml(hasEditableConfig
      ? `A connector config is mapped to this source. Review the snapshot below, finish any missing bindings, then dry-run safely.`
      : `No editable connector config is mapped yet. Create one from the template, then return here to validate readiness.`)}
  `;

  $("setupStageStrip").innerHTML = [
    ["1. Choose workload", "Pick the playbook behavior first: defect, story, case, or onboarding."],
    ["2. Choose source", "Pick the system of record where the work item actually lives."],
    ["3. Inspect or create config", "See whether a connector profile already exists for this source and where it lives."],
    ["4. Fill inputs and dry-run", "Bind env values and secrets, then launch a safe dry-run when readiness looks good."],
  ].map(([title, detail]) => `
    <div class="setup-stage-card">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(detail)}</p>
    </div>
  `).join("");

  $("workTypeRegistry").innerHTML = "";
  workTypes
    .filter((flowItem) => matches([flowItem.name, flowItem.summary, flowItem.approvalPosture]))
    .forEach((flowItem) => {
      const primaryLabelForFlow = primarySourceLabel(flowItem);
      const defaultVendorForFlow = defaultImplementationVendor(flowItem);
      const button = document.createElement("button");
      button.className = `template-tile${flowItem.id === activeFlowId ? " active" : ""}`;
      button.type = "button";
      button.innerHTML = `
        <div class="tile-top">
          <span>${escapeHtml(flowItem.name)}</span>
          <span class="status-dot ${statusClass(flowItem.status)}">${escapeHtml(flowItem.status)}</span>
        </div>
        <p>${escapeHtml(flowItem.summary)}</p>
        <div class="tile-meta">Primary source contract: ${escapeHtml(primaryLabelForFlow)}</div>
        <div class="tile-meta">Default implementation: ${escapeHtml(defaultVendorForFlow)}</div>
      `;
      button.addEventListener("click", () => {
        setFlow(flowItem.id);
        renderAll();
      });
      $("workTypeRegistry").appendChild(button);
    });

  $("setupSourceCatalog").innerHTML = displaySources.map((item) => {
    const profileForSource = connectorProfile(item.id);
    const role = item.id === recommendedSource?.id
      ? `${primarySourceLabel(flow)} · default implementation vendor`
      : "Supporting connector";
    const status = profileForSource
      ? `${profileForSource.status || item.status} · ${currentRuntimeMode(profileForSource)?.label || "No mode"}`
      : "No editable config profile";
    return `
      <button class="source-card${item.id === activeSourceId ? " active" : ""}" data-setup-source-id="${escapeHtml(item.id)}" type="button">
        <div class="tile-top">
          <span>${escapeHtml(item.name)}</span>
          <span class="status-dot ${statusClass(profileForSource?.status || item.status)}">${escapeHtml(profileForSource?.status || item.status || "STAGED")}</span>
        </div>
        <p>${escapeHtml(item.detail || item.mode || "")}</p>
        <div class="tile-meta">${escapeHtml(`${role} · ${status}`)}</div>
      </button>
    `;
  }).join("");

  Array.from($("setupSourceCatalog").querySelectorAll?.("[data-setup-source-id]") || []).forEach((button) => {
    button.addEventListener("click", () => {
      activeSourceId = button.dataset.setupSourceId;
      renderAll();
    });
  });

  $("setupSourceRole").innerHTML = [
    ["Selected source", source?.name || "Choose a source"],
    ["Source role", isPrimarySource(source, flow) ? "Primary intake source" : sourceSupportedByFlow(source, flow) ? "Supporting connector" : "Not mapped to this workload"],
    ["Primary source contract", primarySourceLabel(flow)],
    ["Default implementation vendor", defaultImplementationVendor(flow)],
    ["What source means here", flowGuide.sourceRole || "The source is the system of record that gives Knockdown the work item plus safe writeback target."],
  ].map(([label, value]) => `
    <div class="selected-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");

  $("setupConfigStatus").innerHTML = [
    ["Connector config", hasEditableConfig ? sourceConfig.name : "No editable config profile"],
    ["Decision", configDecision],
    ["Runtime mode", currentRuntimeMode(sourceConfig)?.label || "Not configured"],
    ["Bindings ready", `${configuredCount} of ${totalBindings} required values set`],
  ].map(([label, value]) => `
    <div class="guide-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");

  $("setupConfigArtifacts").innerHTML = [
    ["Connector file", sourceConfig?.connectorFile || "Create a connector config to generate this"],
    ["Source config file", sourceConfig?.sourceConfig || "Create a connector config to generate this"],
    ["Contract file", sourceConfig?.contractFile || "No contract file modeled yet"],
    ["Tool mappings", hasEditableConfig ? `${sourceConfig.toolMappings?.length || 0} modeled mappings` : "No mappings yet"],
    ["GitHub target", hasEditableConfig ? `${githubPersistenceState.owner || "owner"}/${githubPersistenceState.repo || "repo"}` : "Not applicable yet"],
  ].map(([label, value]) => `
    <div class="guide-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");

  $("setupConfigSnapshot").innerHTML = hasEditableConfig ? `
    <div class="setup-snapshot-list">
      <div class="snapshot-card">
        <strong>${escapeHtml(sourceConfig.name || sourceConfig.id)}</strong>
        <p>${escapeHtml(sourceConfig.summary || "Connector profile ready for review.")}</p>
        <div class="snapshot-meta">${escapeHtml(`${runtimeMode?.label || "No runtime mode"} • ${sourceConfig.category || "Connector profile"}`)}</div>
      </div>
      <div class="snapshot-card">
        <strong>MCP runtime</strong>
        <p>${escapeHtml(runtimeMode?.description || "No runtime mode description is configured yet.")}</p>
        <div class="snapshot-meta">${escapeHtml(`Server: ${sourceConfig.mcpFabric?.serverName || "Not set"} • Namespace: ${sourceConfig.mcpFabric?.namespace || "Not set"}`)}</div>
      </div>
      <div class="snapshot-card">
        <strong>Mapped tools</strong>
        <p>${escapeHtml(mappingPreview.length ? mappingPreview.join(" | ") : "No stable-to-vendor mappings are modeled yet.")}</p>
        <div class="snapshot-meta">${escapeHtml(`${sourceConfig.toolMappings?.length || 0} mappings total`)}</div>
      </div>
      <div class="snapshot-card">
        <strong>Governance</strong>
        <p>${escapeHtml(sourceConfig.writePolicy?.approvalPosture || "No approval posture defined yet.")}</p>
        <div class="snapshot-meta">${escapeHtml(`${envBindings.length} env values • ${sourceSecrets.length} secrets • ${configuredCount}/${totalBindings} ready`)}</div>
      </div>
    </div>
  ` : `
    <div class="empty-state">No connector profile is currently mapped to this source. Use <strong>Create connector config</strong> to generate a starting profile and expose runtime, tool mapping, env, secret, and writeback settings.</div>
  `;

  $("setupStorageMap").innerHTML = `
    <div class="storage-map-list">
      ${storageMap.map((item) => `
        <div class="storage-map-card">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.detail)}</p>
          <div class="storage-meta">${escapeHtml(item.meta)}</div>
        </div>
      `).join("")}
    </div>
  `;

  $("setupRequiredInputs").innerHTML = `
    <div class="input-grid">
      ${sourceInputs.slice(0, 8).map((item) => `
        <div class="input-card">
          <div class="input-kind">${escapeHtml(item.kind)}</div>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.detail)}</p>
        </div>
      `).join("")}
      ${sourceSecrets.map((item) => `
        <div class="input-card">
          <div class="input-kind">Secret binding</div>
          <strong>${escapeHtml(item.key)}</strong>
          <p>${escapeHtml(item.note)}</p>
        </div>
      `).join("")}
      ${sourceSecretNotes.slice(0, 2).map((item) => `
        <div class="input-card">
          <div class="input-kind">Secret scope</div>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.note)}</p>
        </div>
      `).join("")}
    </div>
  `;

  $("setupLaunchChecklist").innerHTML = [
    ["Connector status", `${source?.status || "Unknown"} · ${sourceGuide.readiness || source?.detail || "Needs review"}`],
    ["Workload fit", isPrimarySource(source, flow) ? "The selected source is the primary source of record for this workload." : sourceSupportedByFlow(source, flow) ? "The selected source can support this workload, but another source is recommended as primary." : "The selected source is not mapped to this workload yet."],
    ["Sample item", flow?.sampleItem || "Choose one representative work item for the first dry-run."],
    ["Dry-run goal", sourceGuide.testHint || flowGuide.dryRunGoal || "Validate normalization and secret resolution before promotion."],
  ].map(([label, value]) => `
    <div class="guide-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");

  $("setupNextAction").innerHTML = [
    ["Next action", hasEditableConfig ? flowGuide.nextAction || "Finish any missing bindings, then run a sample item in dry-run mode." : "Create a connector config first, then come back here to validate the source against the selected workload."],
    ["Primary source contract", primarySourceLabel(flow)],
    ["Default implementation vendor", defaultImplementationVendor(flow)],
    ["Sample item", flow?.sampleItem || "Pick one representative work item for a safe dry-run."],
    ["Where config lives", hasEditableConfig ? sourceConfig.connectorFile || "Connector file" : "Create connector config to generate files"],
    ["Profile posture", profile?.policySummary || flow?.approvalPosture || "Dry-run first"],
  ].map(([label, value]) => `
    <div class="guide-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");

  $("setupSourceGuide").innerHTML = [
    ["Where to configure it", hasEditableConfig ? "Use Admin to edit this connector config, save mappings, and persist settings to GitHub." : "Use Create connector config to start from the enterprise template, then finish configuration in Admin."],
    ["When to stay on this page", "Stay on New Setup while choosing the right workload and source combination or while checking readiness for a dry-run."],
    ["When to switch to Admin", "Switch to Admin whenever you need to create a config, edit runtime mode, map MCP tools, bind env values, or manage GitHub persistence."],
  ].map(([label, value]) => `
    <div class="guide-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("") + `
    <div class="guide-list">
      ${(sourceGuide.steps || onboardingWorkflow.slice(0, 3).map((step) => step.detail)).map((step) => `<div class="guide-list-item">${escapeHtml(step)}</div>`).join("")}
    </div>
  `;

  $("setupFocus").innerHTML = `
    <div class="selected-row">
      <span>Template</span>
      <strong>${escapeHtml(template?.title || "Direct setup")}</strong>
    </div>
    <div class="selected-row">
      <span>Source</span>
      <strong>${escapeHtml(source?.name || "Not selected")}</strong>
    </div>
    <div class="selected-row">
      <span>Flow</span>
      <strong>${escapeHtml(flow?.name || "Not selected")}</strong>
    </div>
    <div class="selected-row">
      <span>Runtime mode</span>
      <strong>${escapeHtml(currentRuntimeMode(sourceConfig)?.label || "Not configured")}</strong>
    </div>
    <div class="selected-row">
      <span>Safety</span>
      <strong>${escapeHtml(flow?.approvalPosture || "Dry-run first")}</strong>
    </div>
  `;

  const configRows = [
    ...sourceInputs.slice(0, 4).map((item) => ({
      kind: item.kind,
      label: item.label,
      detail: item.value ? `${item.detail} Value set locally.` : item.detail,
    })),
    ...sourceSecrets.slice(0, 2).map((item) => ({
      kind: "Secret binding",
      label: item.key,
      detail: item.value ? `${item.note} Value set locally.` : item.note,
    })),
    ...configSources.slice(0, 2).map((item) => ({
      kind: "Config source",
      label: item.label,
      detail: item.detail,
    })),
  ];

  $("setupConfigList").innerHTML = configRows.map((item) => `
    <div class="compact-row">
      <strong>${escapeHtml(`${item.kind}: ${item.label}`)}</strong>
      <span>${escapeHtml(item.detail)}</span>
    </div>
  `).join("");
}

function renderRunRail() {
  $("historyList").innerHTML = "";
  visibleRuns().forEach((run) => {
    const button = document.createElement("button");
    button.className = `run-link${run.id === activeRunId ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span>${escapeHtml(run.id)}</span>
      <small>${escapeHtml(`${run.stage} · ${run.duration}`)}</small>
    `;
    button.addEventListener("click", () => {
      activeRunId = run.id;
      activeFlowId = run.workTypeId || activeFlowId;
      setView("runs");
      renderAll();
    });
    $("historyList").appendChild(button);
  });

  if (!$("historyList").children.length) {
    $("historyList").innerHTML = '<div class="empty-state">No runs found.</div>';
  }
}

function renderTemplateRail() {
  $("templateList").innerHTML = "";
  templates
    .filter((template) => matches([template.title, template.meta, template.prompt]))
    .forEach((template) => {
      const button = document.createElement("button");
      button.className = `template-link${template.id === activeTemplateId ? " active" : ""}`;
      button.type = "button";
      button.innerHTML = `
        <span>${escapeHtml(template.title)}</span>
        <small>${escapeHtml(template.meta)}</small>
      `;
      button.addEventListener("click", () => applyTemplate(template));
      $("templateList").appendChild(button);
    });
}

function renderRuns() {
  const run = activeRun();
  const thread = activeThread();
  const flow = workTypes.find((item) => item.id === run?.workTypeId);

  $("runTitle").textContent = run ? `${run.id} · ${run.source}` : "No run selected";
  $("runMeta").innerHTML = [
    flow?.name,
    run?.status ? `Status: ${run.status}` : "",
    run?.owner ? `Owner: ${run.owner}` : "",
  ].filter(Boolean).map((item) => `<span>${escapeHtml(item)}</span>`).join("");

  $("runSummaryList").innerHTML = [
    ["Flow", flow?.name || "Unknown"],
    ["Current step", run?.stage || "Idle"],
    ["Risk", run?.risk || "n/a"],
    ["Next", run?.next || "n/a"],
  ].map(([label, value]) => `
    <div class="summary-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");

  $("timelineList").innerHTML = (thread?.timeline || []).map((item) => `
    <div class="timeline-item ${escapeHtml(item.state)}">
      <div class="timeline-marker"></div>
      <div>
        <div class="timeline-stage-row">
          <strong>${escapeHtml(item.stage)}</strong>
          <span>${escapeHtml(item.state)}</span>
        </div>
        <p>${escapeHtml(item.summary)}</p>
      </div>
    </div>
  `).join("");

  $("messageStream").innerHTML = (thread?.messages || []).map((message) => `
    <article class="message ${escapeHtml(message.role)}">
      <div class="message-top">
        <strong>${escapeHtml(message.author)}</strong>
        <span>${escapeHtml(message.timestamp)}</span>
      </div>
      <div class="message-body">${message.body}</div>
    </article>
  `).join("");
}

function renderMonitor() {
  $("runBoard").innerHTML = liveRuns
    .filter((run) => matches([run.id, run.source, run.status, run.stage, run.next]))
    .map((run) => `
      <button class="monitor-row" data-run-id="${escapeHtml(run.id)}" type="button">
        <div>
          <strong>${escapeHtml(run.id)}</strong>
          <span>${escapeHtml(run.source)}</span>
        </div>
        <span class="status-dot ${statusClass(run.status)}">${escapeHtml(run.status)}</span>
      </button>
    `).join("");

  Array.from($("runBoard").querySelectorAll?.("[data-run-id]") || []).forEach((button) => {
    button.addEventListener("click", () => {
      activeRunId = button.dataset.runId;
      setView("runs");
      renderAll();
    });
  });

  $("decisionTrace").innerHTML = decisionTrace.map((trace) => `
    <div class="compact-row">
      <strong>${escapeHtml(trace.title)}</strong>
      <span>${escapeHtml((trace.details || []).join(" "))}</span>
    </div>
  `).join("");

  $("failureHeatmap").innerHTML = failureHeatmap.map((item) => `
    <div class="compact-row">
      <strong>${escapeHtml(item.area)}</strong>
      <span>${escapeHtml(`${item.value}: ${item.note}`)}</span>
    </div>
  `).join("");
}

function renderDetails() {
  const flow = activeFlow();
  const source = activeSource();
  const sourceConfig = connectorProfile(source?.id);
  const runtimeModes = sourceConfig?.runtimeModes || [];

  $("connectorList").innerHTML = connectors.map((connector) => `
    <button class="source-pill${connector.id === activeSourceId ? " active" : ""}" data-source-id="${escapeHtml(connector.id)}" type="button">
      ${escapeHtml(connector.name)}
    </button>
  `).join("");

  Array.from($("connectorList").querySelectorAll?.("[data-source-id]") || []).forEach((button) => {
    button.addEventListener("click", () => {
      activeSourceId = button.dataset.sourceId;
      renderAll();
    });
  });

  $("connectorFocus").innerHTML = source ? `
    <div class="compact-row">
      <strong>${escapeHtml(source.mode)}</strong>
      <span>${escapeHtml(source.detail)}</span>
    </div>
    <div class="compact-row">
      <strong>${escapeHtml(`${source.status} · ${source.health}`)}</strong>
      <span>${escapeHtml(source.setupGuide?.readiness || source.meta)}</span>
    </div>
    <div class="compact-row">
      <strong>Used in ${escapeHtml(flow?.name || "selected flow")}</strong>
      <span>${escapeHtml(sourceSupportedByFlow(source, flow) ? (isPrimarySource(source, flow) ? "Primary intake source" : "Supporting connector") : "Not mapped to the active flow")}</span>
    </div>
    <div class="compact-row">
      <strong>Runtime mode</strong>
      <span>${escapeHtml(currentRuntimeMode(sourceConfig)?.label || "Not configured")}</span>
    </div>
    <div class="compact-row">
      <strong>Configured inputs</strong>
      <span>${escapeHtml(`${configuredBindingCount(sourceConfig)} local values set`)}</span>
    </div>
    <div class="chip-row">
      ${(source.capabilities || []).slice(0, 4).map((capability) => `<span>${escapeHtml(capability)}</span>`).join("")}
    </div>
    ${runtimeModes.length ? `
      <div class="chip-row">
        ${runtimeModes.map((mode) => `<span>${escapeHtml(mode.label)}</span>`).join("")}
      </div>
    ` : ""}
  ` : "";
}

function githubHeaders() {
  const token = githubPersistenceState.token?.trim();
  if (!token) {
    throw new Error("Add a GitHub token before saving. A fine-grained token with contents, variables, and secrets write access is recommended.");
  }
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

function githubApiUrl(path) {
  const base = String(githubPersistenceState.apiBase || "https://api.github.com").replace(/\/+$/, "");
  return `${base}${path}`;
}

async function githubRequest(path, options = {}) {
  const response = await fetch(githubApiUrl(path), {
    ...options,
    headers: {
      ...githubHeaders(),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) return null;

  const text = await response.text();
  const dataValue = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = dataValue?.message || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }
  return dataValue;
}

async function getRepoContent(path) {
  const query = new URLSearchParams({ ref: githubPersistenceState.branch || "main" }).toString();
  return githubRequest(`/repos/${githubPersistenceState.owner}/${githubPersistenceState.repo}/contents/${path}?${query}`);
}

function buildPersistedConnectorConfig(profile, existingConfig) {
  const nextConfig = deepClone(existingConfig);
  nextConfig.displayName = profile.name || nextConfig.displayName;
  nextConfig.operationalState = profile.lifecycleState || nextConfig.operationalState;
  nextConfig.writePolicy = {
    ...(nextConfig.writePolicy || {}),
    ...(profile.writePolicy || {}),
  };

  const hasProxyShape = nextConfig.proxyMcp || (profile.runtimeModes || []).length;
  if (hasProxyShape) {
    nextConfig.proxyMcp = nextConfig.proxyMcp || {};
    nextConfig.proxyMcp.defaultRuntimeMode = profile.activeRuntimeMode || nextConfig.proxyMcp.defaultRuntimeMode;
    nextConfig.proxyMcp.defaultNamespace = profile.mcpFabric?.namespace || nextConfig.proxyMcp.defaultNamespace;
    nextConfig.proxyMcp.defaultServerName = profile.mcpFabric?.serverName || nextConfig.proxyMcp.defaultServerName;
    nextConfig.proxyMcp.namespaceEnvVar = profile.namespaceEnvVar || nextConfig.proxyMcp.namespaceEnvVar;
    nextConfig.proxyMcp.runtimeModeEnvVar = profile.runtimeModeEnvVar || nextConfig.proxyMcp.runtimeModeEnvVar;

    const existingModes = nextConfig.proxyMcp.runtimeModes || [];
    nextConfig.proxyMcp.runtimeModes = (profile.runtimeModes || []).map((mode) => {
      const existingMode = existingModes.find((item) => item.id === mode.id) || {};
      const nextMode = {
        ...existingMode,
        id: mode.id,
        label: mode.label,
        kind: mode.kind,
        description: mode.description,
      };
      if (mode.requiredServerNames?.length) nextMode.requiredServerNames = mode.requiredServerNames;
      if (mode.kind === "replacement") {
        nextMode.toolMappings = (profile.toolMappings || []).reduce((result, mapping) => {
          if (mapping.bindingId && mapping.vendorTool) result[mapping.bindingId] = mapping.vendorTool;
          return result;
        }, {});
      }
      return nextMode;
    });
  }

  return nextConfig;
}

async function saveConnectorConfigToGithub(profile) {
  if (!profile?.connectorFile) {
    throw new Error("This connector profile is missing a connector file path.");
  }

  const existing = await getRepoContent(profile.connectorFile);
  const existingJson = JSON.parse(decodeBase64Utf8(existing.content.replace(/\n/g, "")));
  const nextConfig = buildPersistedConnectorConfig(profile, existingJson);
  const content = encodeBase64Utf8(`${JSON.stringify(nextConfig, null, 2)}\n`);

  await githubRequest(`/repos/${githubPersistenceState.owner}/${githubPersistenceState.repo}/contents/${profile.connectorFile}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `${githubPersistenceState.commitMessagePrefix || "chore(connectors): update"} ${profile.id} connector profile`,
      content,
      sha: existing.sha,
      branch: githubPersistenceState.branch || "main",
    }),
  });
}

async function upsertRepositoryVariable(binding) {
  const value = String(binding.value || "").trim();
  if (!value) return null;
  const environment = String(githubPersistenceState.environment || "").trim();
  const variableBase = environment
    ? `/repos/${githubPersistenceState.owner}/${githubPersistenceState.repo}/environments/${encodeURIComponent(environment)}/variables`
    : `/repos/${githubPersistenceState.owner}/${githubPersistenceState.repo}/actions/variables`;
  const basePath = `${variableBase}/${binding.key}`;
  try {
    await githubRequest(basePath, {
      method: "PATCH",
      body: JSON.stringify({
        name: binding.key,
        value,
      }),
    });
    return `Updated variable ${binding.key}`;
  } catch (error) {
    if (!String(error.message).includes("Not Found")) throw error;
    await githubRequest(variableBase, {
      method: "POST",
      body: JSON.stringify({
        name: binding.key,
        value,
      }),
    });
    return `Created ${environment ? `environment variable ${binding.key}` : `variable ${binding.key}`}`;
  }
}

async function ensureSodium() {
  if (!window.sodium) {
    throw new Error("The libsodium client library did not load. Reload the page and try again.");
  }
  await window.sodium.ready;
  return window.sodium;
}

async function encryptSecretValue(value) {
  const sodium = await ensureSodium();
  const environment = String(githubPersistenceState.environment || "").trim();
  const publicKeyPath = environment
    ? `/repos/${githubPersistenceState.owner}/${githubPersistenceState.repo}/environments/${encodeURIComponent(environment)}/secrets/public-key`
    : `/repos/${githubPersistenceState.owner}/${githubPersistenceState.repo}/actions/secrets/public-key`;
  const publicKey = await githubRequest(publicKeyPath);
  const keyBytes = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL);
  const messageBytes = sodium.from_string(value);
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
  return {
    encrypted_value: sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL),
    key_id: publicKey.key_id,
  };
}

async function upsertRepositorySecret(binding) {
  const value = String(binding.value || "").trim();
  if (!value) return null;
  const environment = String(githubPersistenceState.environment || "").trim();
  const encrypted = await encryptSecretValue(value);
  const secretPath = environment
    ? `/repos/${githubPersistenceState.owner}/${githubPersistenceState.repo}/environments/${encodeURIComponent(environment)}/secrets/${binding.key}`
    : `/repos/${githubPersistenceState.owner}/${githubPersistenceState.repo}/actions/secrets/${binding.key}`;
  await githubRequest(secretPath, {
    method: "PUT",
    body: JSON.stringify(encrypted),
  });
  return `Stored ${environment ? `environment secret ${binding.key}` : `secret ${binding.key}`}`;
}

async function persistConnectorProfileToGithub(options = { config: true, variables: true, secrets: true }) {
  const profile = activeAdminProfile();
  if (!profile) throw new Error("Select a connector profile first.");
  if (!githubPersistenceState.owner || !githubPersistenceState.repo) {
    throw new Error("Add the target GitHub owner and repo before saving.");
  }

  const details = [];
  if (options.config) {
    await saveConnectorConfigToGithub(profile);
    details.push(`Committed ${profile.connectorFile}`);
  }

  if (options.variables) {
    const results = await Promise.all(
      currentEnvBindings(profile).map((binding) => upsertRepositoryVariable(binding))
    );
    details.push(...results.filter(Boolean));
  }

  if (options.secrets) {
    for (const binding of currentSecretBindings(profile)) {
      const result = await upsertRepositorySecret(binding);
      if (result) details.push(result);
    }
  }

  return details;
}

function renderAdmin() {
  const profile = activeAdminProfile();
  const mode = currentRuntimeMode(profile);
  const envBindings = currentEnvBindings(profile);
  const secretBindings = currentSecretBindings(profile);
  const secretNotes = currentSecretNotes(profile);
  const connectorValidation = connectorValidationSummary(profile);
  const workflow = activeAdminWorkflow();
  const workflowReadiness = workflowConnectorReadiness(workflow);
  const isEditMode = adminMode === "edit";
  const isDetailStage = adminStage === "detail";
  const isWorkflowEntity = adminEntity === "workflows";

  $("adminShell").classList.toggle("catalog-only", !isDetailStage);
  $("adminShell").classList.toggle("detail-only", isDetailStage);
  $("adminCatalogPanel").hidden = isDetailStage;
  $("adminDetailStage").hidden = !isDetailStage;
  $("adminCatalogActions").hidden = isDetailStage;
  $("adminDetailActions").hidden = !isDetailStage;
  $("adminModeSwitch").hidden = !isDetailStage;
  $("adminConnectorDetailSections").hidden = isWorkflowEntity || !isDetailStage;
  $("adminWorkflowDetailSections").hidden = !isWorkflowEntity || !isDetailStage;
  $("createConnectorProfileButton").hidden = isWorkflowEntity;
  $("backToConnectorCatalogButton").textContent = isWorkflowEntity ? "Back to workflows" : "Back to connectors";

  $("adminConnectorsScopeButton").classList.toggle("active", !isWorkflowEntity);
  $("adminWorkflowsScopeButton").classList.toggle("active", isWorkflowEntity);
  $("adminViewModeButton").classList.toggle("active", !isEditMode);
  $("adminEditModeButton").classList.toggle("active", isEditMode);
  $("adminEditActions").hidden = !isEditMode || !isDetailStage || isWorkflowEntity;
  $("adminBannerCopy").textContent = isEditMode
    ? isWorkflowEntity
      ? "Edit mode is active. Update workflow activation settings, retry counts, trigger conditions, and concurrency here."
      : "Edit mode is active. Update connector details, bindings, and persistence targets here, then save when you are ready."
    : isDetailStage
      ? isWorkflowEntity
        ? "Read-only mode is active. Review workflow activation readiness and YAML-level settings before switching to Edit mode."
        : "Read-only mode is active. Review the connector contract, runtime posture, bindings, and GitHub target here before switching to Edit mode."
      : isWorkflowEntity
        ? "Choose a workflow from the catalog to review activation gates and workflow-level configuration."
        : "Choose a connector from the catalog or create a new one to open its dedicated detail workspace.";

  $("adminCatalogTitle").textContent = isWorkflowEntity ? "Workflow catalog" : "Connector catalog";
  $("adminCatalogDescription").textContent = isWorkflowEntity
    ? "Browse available workflows here. Selecting one opens workflow activation and YAML-level controls in a dedicated detail workspace."
    : "Browse all available connector profiles here. Selecting one updates the dedicated view or edit workspace on the right.";
  $("adminCatalogSearchLabel").textContent = isWorkflowEntity ? "Search workflows" : "Search connectors";
  $("adminConnectorSearch").placeholder = isWorkflowEntity
    ? "Search by workflow name, trigger condition, file, or summary"
    : "Search by name, runtime, category, tag, or summary";
  $("adminConnectorFilters").hidden = isWorkflowEntity;

  const visibleCatalogProfiles = (isWorkflowEntity ? workflowProfilesState : connectorProfilesState)
    .filter((item) => matchesAdminFilter(item))
    .filter((item) => matchesAdminCatalog(isWorkflowEntity ? [
      item.name,
      item.summary,
      item.workflowFile,
      item.triggerConditions,
      item.activationState,
    ] : [
      item.name,
      item.summary,
      item.category,
      currentRuntimeMode(item)?.label,
      ...(item.tags || []),
    ]));

  $("adminConnectorSearch").value = adminCatalogSearchTerm;
  Array.from($("adminConnectorFilters").querySelectorAll?.("[data-admin-filter]") || []).forEach((button) => {
    button.classList.toggle("active", button.dataset.adminFilter === adminCatalogFilter);
  });
  $("adminConnectorSearchMeta").innerHTML = [
    `${visibleCatalogProfiles.length} shown`,
    `${isWorkflowEntity ? workflowProfilesState.length : connectorProfilesState.length} total`,
  ].map((item) => `<span>${escapeHtml(item)}</span>`).join("");

  $("adminMeta").innerHTML = [
    isWorkflowEntity
      ? workflow?.workflowFile ? `Workflow: ${workflow.workflowFile}` : ""
      : profile?.connectorFile ? `Profile: ${profile.connectorFile}` : "",
    isWorkflowEntity
      ? workflow?.activationState ? `Workflow state: ${workflow.activationState}` : ""
      : profile?.sourceConfig ? `Source config: ${profile.sourceConfig}` : "",
    isWorkflowEntity
      ? workflow?.triggerConditions ? `Triggers: ${workflow.triggerConditions}` : ""
      : mode?.label ? `Mode: ${mode.label}` : "",
    !isWorkflowEntity && profile?.lifecycleState ? `Connector state: ${profile.lifecycleState}` : "",
  ].filter(Boolean).map((item) => `<span>${escapeHtml(item)}</span>`).join("");

  $("adminConnectorCatalog").innerHTML = visibleCatalogProfiles
    .map((item) => `
      <button class="admin-connector-card${
        isWorkflowEntity
          ? item.id === workflow?.id ? " active" : ""
          : item.id === profile?.id ? " active" : ""
      }" ${
        isWorkflowEntity
          ? `data-admin-select-workflow="${escapeHtml(item.id)}"`
          : `data-admin-select-connector="${escapeHtml(item.id)}"`
      } type="button">
        <div class="admin-card-top">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="status-dot ${statusClass(isWorkflowEntity ? item.activationState : item.status)}">${escapeHtml(isWorkflowEntity ? item.activationState : item.status)}</span>
        </div>
        <p>${escapeHtml(item.summary)}</p>
        <div class="meta-tag-row">
          ${isWorkflowEntity ? `
            <span>${escapeHtml(item.workflowFile || "No workflow file")}</span>
            <span>${escapeHtml(`${item.retryCount ?? 0} retries`)}</span>
            <span>${escapeHtml(`Concurrency ${item.maxConcurrency ?? 1}`)}</span>
          ` : `
            <span>${escapeHtml(currentRuntimeMode(item)?.label || "No mode")}</span>
            <span>${escapeHtml(item.lifecycleState || "inactive")}</span>
            <span>${escapeHtml(`${configuredBindingCount(item)} configured`)}</span>
          `}
        </div>
      </button>
    `).join("");

  if (!visibleCatalogProfiles.length) {
    $("adminConnectorCatalog").innerHTML = `
      <div class="admin-empty-state">${
        isWorkflowEntity
          ? "No workflows match this search yet. Try a different workflow name, file, or trigger condition."
          : "No connectors match this search yet. Try a different name, tag, category, or runtime mode."
      }</div>
    `;
  }

  $("adminSummary").innerHTML = isWorkflowEntity ? (workflow ? `
    <div class="summary-row">
      <span>Workflow</span>
      <strong>${escapeHtml(workflow.name)}</strong>
    </div>
    <div class="summary-row">
      <span>Activation state</span>
      <strong>${escapeHtml(workflow.activationState || "inactive")}</strong>
    </div>
    <div class="summary-row">
      <span>Workflow file</span>
      <strong>${escapeHtml(workflow.workflowFile || "Not set")}</strong>
    </div>
    <div class="summary-row">
      <span>Retry count</span>
      <strong>${escapeHtml(String(workflow.retryCount ?? 0))}</strong>
    </div>
    <div class="summary-row">
      <span>Max concurrency</span>
      <strong>${escapeHtml(String(workflow.maxConcurrency ?? 1))}</strong>
    </div>
    <div class="summary-row">
      <span>Activation gate</span>
      <strong>${escapeHtml(workflowReadiness.canActivate ? "Ready to activate" : `Blocked by ${workflowReadiness.missingRequired.length} connector(s)`)}</strong>
    </div>
  ` : "") : (profile ? `
    <div class="summary-row">
      <span>Connector</span>
      <strong>${escapeHtml(profile.name)}</strong>
    </div>
    <div class="summary-row">
      <span>Category</span>
      <strong>${escapeHtml(profile.category || "Connector")}</strong>
    </div>
    <div class="summary-row">
      <span>Runtime mode</span>
      <strong>${escapeHtml(mode?.label || "Not configured")}</strong>
    </div>
    <div class="summary-row">
      <span>Config files</span>
      <strong>${escapeHtml(`${profile.connectorFile || "n/a"} · ${profile.sourceConfig || "n/a"}`)}</strong>
    </div>
    <div class="summary-row">
      <span>Configured values</span>
      <strong>${escapeHtml(`${configuredBindingCount(profile)} local entries`)}</strong>
    </div>
    <div class="summary-row">
      <span>Connector state</span>
      <strong>${escapeHtml(profile.lifecycleState || "inactive")}</strong>
    </div>
    <div class="meta-tag-row">
      ${(profile.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
    </div>
  ` : "");

  $("adminDetailTitle").textContent = isWorkflowEntity ? "Selected workflow" : "Selected connector";
  $("adminSelectedHeader").innerHTML = isDetailStage && (isWorkflowEntity ? workflow : profile) ? `
    <div class="admin-selected-header">
      <div class="admin-selected-title-row">
        <div>
          <div class="workspace-kicker">${escapeHtml(isEditMode ? (isWorkflowEntity ? "Editing workflow" : "Editing connector") : (isWorkflowEntity ? "Viewing workflow" : "Viewing connector"))}</div>
          <h3>${escapeHtml(isWorkflowEntity ? (workflow.name || workflow.id || "Workflow") : (profile.name || profile.id || "Connector profile"))}</h3>
        </div>
        <span class="status-dot ${statusClass(isWorkflowEntity ? workflow.activationState : profile.status)}">${escapeHtml(isWorkflowEntity ? workflow.activationState || "inactive" : profile.status || "STAGED")}</span>
      </div>
      <p>${escapeHtml(isWorkflowEntity ? (workflow.summary || "Workflow selected from the catalog.") : (profile.summary || "Connector profile selected from the catalog."))}</p>
      <div class="meta-tag-row">
        ${isWorkflowEntity ? `
          <span>${escapeHtml(workflow.workflowFile || "No workflow file")}</span>
          <span>${escapeHtml(workflow.activationState || "inactive")}</span>
          <span>${escapeHtml(`Retries ${workflow.retryCount ?? 0}`)}</span>
          <span>${escapeHtml(`Concurrency ${workflow.maxConcurrency ?? 1}`)}</span>
        ` : `
          <span>${escapeHtml(profile.category || "Connector")}</span>
          <span>${escapeHtml(mode?.label || "No runtime mode")}</span>
          <span>${escapeHtml(profile.lifecycleState || "inactive")}</span>
          <span>${escapeHtml(`${configuredBindingCount(profile)} configured values`)}</span>
          <span>${escapeHtml(profile.connectorFile || "No connector file")}</span>
        `}
      </div>
    </div>
  ` : `
    <div class="admin-empty-state">${isWorkflowEntity ? "Select a workflow from the catalog to review or edit its activation settings." : "Select a connector from the catalog to review or edit its configuration."}</div>
  `;

  $("adminConnectorLifecyclePanel").innerHTML = profile ? (isEditMode ? `
    <div class="admin-form-grid">
      <div class="admin-form-field">
        <label>Connector state</label>
        <input type="text" value="${escapeHtml(profile.lifecycleState || "inactive")}" readonly>
      </div>
      <div class="admin-form-field">
        <label>Validation readiness</label>
        <input type="text" value="${escapeHtml(connectorValidation.detail)}" readonly>
      </div>
    </div>
    <div class="persistence-actions">
      <button class="ghost-button" type="button" id="validateConnectorButton">Validate connector</button>
      <button class="ghost-button" type="button" id="activateConnectorButton">Activate connector</button>
      <button class="ghost-button" type="button" id="deactivateConnectorButton">Set inactive</button>
    </div>
    <div class="persistence-callout">
      Validate checks the active runtime mode and required bindings. Activation is allowed only after the connector is validated. Save the connector config to GitHub after state changes if you want to persist them outside this browser.
    </div>
  ` : renderGuideRows([
    ["Connector state", profile.lifecycleState || "inactive"],
    ["Validation readiness", connectorValidation.detail],
    ["Recommended next step", connectorValidation.ready ? "Connector can be validated or activated." : "Finish binding values before validation."],
  ])) : "";

  $("adminBasicsPanel").innerHTML = profile ? (isEditMode ? `
    <div class="admin-form-grid">
      <div class="admin-form-field">
        <label for="adminProfileName">Display name</label>
        <input id="adminProfileName" type="text" value="${escapeHtml(profile.name || "")}" data-admin-basic-field="name">
      </div>
      <div class="admin-form-field">
        <label for="adminProfileStatus">Status</label>
        <select id="adminProfileStatus" data-admin-basic-field="status">
          ${["LIVE", "STAGED", "DRAFT"].map((status) => `
            <option value="${status}"${status === profile.status ? " selected" : ""}>${status}</option>
          `).join("")}
        </select>
      </div>
      <div class="admin-form-field">
        <label>Config id</label>
        <input type="text" value="${escapeHtml(profile.id || "")}" readonly>
      </div>
      <div class="admin-form-field">
        <label for="adminProfileCategory">Category</label>
        <input id="adminProfileCategory" type="text" value="${escapeHtml(profile.category || "")}" data-admin-basic-field="category">
      </div>
      <div class="admin-form-field">
        <label for="adminConnectorFile">Connector file</label>
        <input id="adminConnectorFile" type="text" value="${escapeHtml(profile.connectorFile || "")}" data-admin-basic-field="connectorFile">
      </div>
      <div class="admin-form-field">
        <label for="adminSourceConfig">Source config file</label>
        <input id="adminSourceConfig" type="text" value="${escapeHtml(profile.sourceConfig || "")}" data-admin-basic-field="sourceConfig">
      </div>
      <div class="admin-form-field span-2">
        <label for="adminProfileSummary">Summary</label>
        <textarea id="adminProfileSummary" data-admin-basic-field="summary">${escapeHtml(profile.summary || "")}</textarea>
      </div>
    </div>
    <div class="persistence-callout">
      Use <strong>Create config</strong> to start from the enterprise template, or <strong>Duplicate selected</strong> to fork the current connector into a new editable config.
    </div>
  ` : `
    ${renderGuideRows([
      ["Display name", profile.name || "Unnamed connector"],
      ["Status", profile.status || "Unknown"],
      ["Config id", profile.id || "Not set"],
      ["Category", profile.category || "Connector"],
      ["Connector file", profile.connectorFile || "Not set"],
      ["Source config file", profile.sourceConfig || "Not set"],
      ["Summary", profile.summary || "No summary yet"],
    ])}
  `) : "";

  $("adminRuntimePanel").innerHTML = profile ? (isEditMode ? `
    <div class="admin-form-grid">
      <div class="admin-form-field">
        <label for="adminRuntimeMode">Runtime mode</label>
        <select id="adminRuntimeMode" data-admin-runtime-mode>
          ${(profile.runtimeModes || []).map((runtimeMode) => `
            <option value="${escapeHtml(runtimeMode.id)}"${runtimeMode.id === profile.activeRuntimeMode ? " selected" : ""}>
              ${escapeHtml(runtimeMode.label)}
            </option>
          `).join("")}
        </select>
      </div>
      <div class="admin-form-field">
        <label for="adminRequiredServers">Required MCP servers</label>
        <input
          id="adminRequiredServers"
          data-admin-mode-field="requiredServerNames"
          type="text"
          value="${escapeHtml((mode?.requiredServerNames || []).join(", "))}"
          placeholder="source_proxy, github, vendor_server"
        >
      </div>
      <div class="admin-form-field">
        <label for="adminNamespace">Namespace</label>
        <input id="adminNamespace" data-admin-fabric-field="namespace" type="text" value="${escapeHtml(profile.mcpFabric?.namespace || "")}">
      </div>
      <div class="admin-form-field">
        <label for="adminServerName">Server name</label>
        <input id="adminServerName" data-admin-fabric-field="serverName" type="text" value="${escapeHtml(profile.mcpFabric?.serverName || "")}">
      </div>
      <div class="admin-form-field">
        <label>Source read path</label>
        <input type="text" value="${escapeHtml(profile.mcpFabric?.sourceReadPath || "")}" readonly>
      </div>
      <div class="admin-form-field">
        <label>Source write path</label>
        <input type="text" value="${escapeHtml(profile.mcpFabric?.sourceWritePath || "")}" readonly>
      </div>
      <div class="admin-form-field span-2">
        <label for="adminModeDescription">Selected runtime mode meaning</label>
        <textarea id="adminModeDescription" data-admin-mode-field="description">${escapeHtml(mode?.description || "")}</textarea>
      </div>
    </div>
    <div class="admin-tag-row">
      ${(mode?.notes || []).map((note) => `<span>${escapeHtml(note)}</span>`).join("")}
    </div>
  ` : `
    ${renderGuideRows([
      ["Runtime mode", mode?.label || "Not configured"],
      ["Required MCP servers", formatListValue(mode?.requiredServerNames || [])],
      ["Namespace", profile.mcpFabric?.namespace || "Not set"],
      ["Server name", profile.mcpFabric?.serverName || "Not set"],
      ["Source read path", profile.mcpFabric?.sourceReadPath || "Not set"],
      ["Source write path", profile.mcpFabric?.sourceWritePath || "Not set"],
      ["Mode meaning", mode?.description || "No runtime mode description configured"],
    ])}
    <div class="admin-tag-row">
      ${(mode?.notes || []).map((note) => `<span>${escapeHtml(note)}</span>`).join("")}
    </div>
  `) : "";

  $("adminToolMappings").innerHTML = profile ? `
    <div class="tool-mapping-list">
      ${(profile.toolMappings || []).map((mapping, index) => `
        <div class="tool-mapping-card">
          <div class="binding-editor-top">
            <div>
              <strong>${escapeHtml(mapping.stableTool)}</strong>
              <p>${escapeHtml(mapping.policy || mapping.strategy || "mapping")}</p>
            </div>
            <span class="status-dot ${statusClass(mode?.kind === "replacement" ? "live" : "waiting")}">${escapeHtml(mode?.kind === "replacement" ? "vendor" : "proxy")}</span>
          </div>
          ${isEditMode ? `
            <div class="tool-mapping-grid">
              <div class="admin-form-field">
                <label>Binding id</label>
                <input type="text" value="${escapeHtml(mapping.bindingId || "")}" data-admin-tool-index="${index}" data-admin-tool-field="bindingId">
              </div>
              <div class="admin-form-field">
                <label>Strategy</label>
                <input type="text" value="${escapeHtml(mapping.strategy || "")}" data-admin-tool-index="${index}" data-admin-tool-field="strategy">
              </div>
              <div class="admin-form-field span-2">
                <label>Vendor implementation</label>
                <input type="text" value="${escapeHtml(mapping.vendorTool || "")}" data-admin-tool-index="${index}" data-admin-tool-field="vendorTool" placeholder="mcp__vendor__tool_name">
              </div>
            </div>
          ` : renderGuideRows([
            ["Binding id", mapping.bindingId || "Not set"],
            ["Strategy", mapping.strategy || "Not set"],
            ["Vendor implementation", mapping.vendorTool || "Not set"],
          ])}
          <div class="tool-meta">
            Request: ${escapeHtml(mapping.requestContract || "n/a")}<br>
            Response: ${escapeHtml(mapping.responseContract || "n/a")}
          </div>
        </div>
      `).join("")}
    </div>
  ` : "";

  $("adminBindings").innerHTML = profile ? `
    <div class="binding-editor-list">
      ${envBindings.map((binding, index) => `
        <div class="binding-editor-card">
          <div class="binding-editor-top">
            <div>
              <strong>${escapeHtml(binding.key)}</strong>
              <p>${escapeHtml(binding.scope || "env")} · ${escapeHtml(binding.note || "")}</p>
            </div>
            <span class="status-dot ${String(binding.value || "").trim() ? "live" : "staged"}">${String(binding.value || "").trim() ? "set" : "empty"}</span>
          </div>
          ${isEditMode ? `
            <div class="binding-input-grid">
              <div class="admin-form-field span-2">
                <label>Value</label>
                <input class="binding-input" type="text" value="${escapeHtml(binding.value || "")}" data-admin-binding-collection="envBindings" data-admin-binding-index="${index}">
              </div>
            </div>
          ` : renderGuideRows([
            ["Value state", String(binding.value || "").trim() ? "Set locally" : "Not set"],
            ["Current value", String(binding.value || "").trim() ? binding.value : "Not set"],
          ])}
        </div>
      `).join("")}
      ${secretBindings.map((binding, index) => `
        <div class="binding-editor-card">
          <div class="binding-editor-top">
            <div>
              <strong>${escapeHtml(binding.key)}</strong>
              <p>${escapeHtml(binding.scope || "secret")} · ${escapeHtml(binding.note || "")}</p>
            </div>
            <span class="status-dot ${String(binding.value || "").trim() ? "live" : "staged"}">${String(binding.value || "").trim() ? "set" : "empty"}</span>
          </div>
          ${isEditMode ? `
            <div class="binding-input-grid">
              <div class="admin-form-field span-2">
                <label>Secret reference or value</label>
                <input class="binding-input" type="password" value="${escapeHtml(binding.value || "")}" data-admin-binding-collection="envBindings" data-admin-binding-index="${index}" data-admin-binding-kind="secret">
              </div>
            </div>
          ` : renderGuideRows([
            ["Value state", String(binding.value || "").trim() ? "Stored locally" : "Not set"],
            ["Secret visibility", String(binding.value || "").trim() ? "Masked in read-only mode" : "No local value saved"],
          ])}
        </div>
      `).join("")}
      ${secretNotes.length ? `
        <div class="persistence-callout">
          ${secretNotes.map((binding) => `${escapeHtml(binding.label)}: ${escapeHtml(binding.note)}`).join("<br>")}
        </div>
      ` : ""}
    </div>
  ` : "";

  $("adminPolicy").innerHTML = profile ? (isEditMode ? `
    <div class="policy-list">
      <div class="policy-card">
        <div class="policy-card-top">
          <strong>Writeback toggles</strong>
          <span class="status-dot ${statusClass(profile.status)}">${escapeHtml(profile.status)}</span>
        </div>
        <div class="switch-row">
          <label for="allowComments">Allow comments</label>
          <input id="allowComments" type="checkbox" data-admin-policy-boolean="allowComments"${profile.writePolicy?.allowComments ? " checked" : ""}>
        </div>
        <div class="switch-row">
          <label for="allowLabels">Allow labels</label>
          <input id="allowLabels" type="checkbox" data-admin-policy-boolean="allowLabels"${profile.writePolicy?.allowLabels ? " checked" : ""}>
        </div>
        <div class="switch-row">
          <label for="allowAttachments">Allow attachments</label>
          <input id="allowAttachments" type="checkbox" data-admin-policy-boolean="allowAttachments"${profile.writePolicy?.allowAttachments ? " checked" : ""}>
        </div>
      </div>
      <div class="policy-card">
        <div class="admin-form-field">
          <label>Allowed field updates</label>
          <textarea class="policy-input" data-admin-policy-list="allowFieldUpdates">${escapeHtml((profile.writePolicy?.allowFieldUpdates || []).join(", "))}</textarea>
        </div>
        <div class="admin-form-field">
          <label>Denied field updates</label>
          <textarea class="policy-input" data-admin-policy-list="denyFieldUpdates">${escapeHtml((profile.writePolicy?.denyFieldUpdates || []).join(", "))}</textarea>
        </div>
        <div class="admin-form-field">
          <label>Approval posture</label>
          <textarea class="policy-input" data-admin-policy-text="approvalPosture">${escapeHtml(profile.writePolicy?.approvalPosture || "")}</textarea>
        </div>
      </div>
    </div>
  ` : `
    ${renderGuideRows([
      ["Allow comments", profile.writePolicy?.allowComments ? "Allowed" : "Blocked"],
      ["Allow labels", profile.writePolicy?.allowLabels ? "Allowed" : "Blocked"],
      ["Allow attachments", profile.writePolicy?.allowAttachments ? "Allowed" : "Blocked"],
      ["Allowed field updates", formatListValue(profile.writePolicy?.allowFieldUpdates || [])],
      ["Denied field updates", formatListValue(profile.writePolicy?.denyFieldUpdates || [])],
      ["Approval posture", profile.writePolicy?.approvalPosture || "Not set"],
    ])}
  `) : "";

  $("adminWorkflowPanel").innerHTML = workflow ? (isEditMode ? `
    <div class="admin-form-grid">
      <div class="admin-form-field">
        <label for="adminWorkflowSelect">Workflow</label>
        <select id="adminWorkflowSelect" data-admin-workflow-select>
          ${workflowProfilesState.map((item) => `
            <option value="${escapeHtml(item.id)}"${item.id === workflow.id ? " selected" : ""}>${escapeHtml(item.name)}</option>
          `).join("")}
        </select>
      </div>
      <div class="admin-form-field">
        <label>Activation state</label>
        <input type="text" value="${escapeHtml(workflow.activationState || "inactive")}" readonly>
      </div>
      <div class="admin-form-field">
        <label for="adminWorkflowFile">Workflow file</label>
        <input id="adminWorkflowFile" type="text" value="${escapeHtml(workflow.workflowFile || "")}" data-admin-workflow-field="workflowFile">
      </div>
      <div class="admin-form-field">
        <label for="adminWorkflowRetryCount">Retry count</label>
        <input id="adminWorkflowRetryCount" type="number" min="0" value="${escapeHtml(workflow.retryCount ?? 0)}" data-admin-workflow-field="retryCount">
      </div>
      <div class="admin-form-field">
        <label for="adminWorkflowConcurrency">Max concurrency</label>
        <input id="adminWorkflowConcurrency" type="number" min="1" value="${escapeHtml(workflow.maxConcurrency ?? 1)}" data-admin-workflow-field="maxConcurrency">
      </div>
      <div class="admin-form-field span-2">
        <label for="adminWorkflowTriggers">Trigger conditions</label>
        <textarea id="adminWorkflowTriggers" data-admin-workflow-field="triggerConditions">${escapeHtml(workflow.triggerConditions || "")}</textarea>
      </div>
    </div>
    <div class="guide-panel">
      <h3>Connector readiness for activation</h3>
      ${renderGuideRows([
        ["Required connectors", formatListValue(workflowReadiness.required.map((item) => `${item.name} (${item.state})`))],
        ["Optional connectors", formatListValue(workflowReadiness.optional.map((item) => `${item.name} (${item.state})`))],
        ["Activation gate", workflowReadiness.canActivate ? "All required connectors are validated or active." : `Blocked until validated: ${workflowReadiness.missingRequired.map((item) => item.name).join(", ")}`],
      ])}
    </div>
    <div class="persistence-actions">
      <button class="ghost-button" type="button" id="activateWorkflowButton">Activate workflow</button>
      <button class="ghost-button" type="button" id="deactivateWorkflowButton">Deactivate workflow</button>
    </div>
    <div class="persistence-callout">
      Workflow activation requires every required connector to be in a validated or active state. The values above model workflow-level YAML concerns such as retry count, trigger conditions, and concurrency.
    </div>
  ` : `
    ${renderGuideRows([
      ["Workflow", workflow.name || workflow.id],
      ["Activation state", workflow.activationState || "inactive"],
      ["Workflow file", workflow.workflowFile || "Not set"],
      ["Retry count", String(workflow.retryCount ?? 0)],
      ["Max concurrency", String(workflow.maxConcurrency ?? 1)],
      ["Trigger conditions", workflow.triggerConditions || "Not set"],
      ["Required connectors", formatListValue(workflowReadiness.required.map((item) => `${item.name} (${item.state})`))],
      ["Optional connectors", formatListValue(workflowReadiness.optional.map((item) => `${item.name} (${item.state})`))],
      ["Activation gate", workflowReadiness.canActivate ? "Ready to activate." : `Blocked until validated: ${workflowReadiness.missingRequired.map((item) => item.name).join(", ")}`],
    ])}
  `) : "";

  $("adminWorkflowPreview").textContent = workflow ? JSON.stringify({
    id: workflow.id,
    name: workflow.name,
    workflowFile: workflow.workflowFile,
    activationState: workflow.activationState,
    retryCount: workflow.retryCount,
    maxConcurrency: workflow.maxConcurrency,
    triggerConditions: workflow.triggerConditions,
    requiredConnectorIds: workflow.requiredConnectorIds,
    optionalConnectorIds: workflow.optionalConnectorIds,
  }, null, 2) : "";

  $("adminConfigPreview").textContent = profile ? JSON.stringify({
    id: profile.id,
    activeRuntimeMode: profile.activeRuntimeMode,
    lifecycleState: profile.lifecycleState,
    runtimeMode: mode,
    mcpFabric: profile.mcpFabric,
    toolMappings: profile.toolMappings,
    envBindings: envBindings,
    secretBindings: secretBindings.map((binding) => ({
      ...binding,
      value: binding.value ? "********" : "",
    })),
    writePolicy: profile.writePolicy,
    workflow: workflow ? {
      id: workflow.id,
      workflowFile: workflow.workflowFile,
      activationState: workflow.activationState,
      retryCount: workflow.retryCount,
      maxConcurrency: workflow.maxConcurrency,
      triggerConditions: workflow.triggerConditions,
      requiredConnectorIds: workflow.requiredConnectorIds,
      optionalConnectorIds: workflow.optionalConnectorIds,
    } : null,
  }, null, 2) : "";

  $("adminPersistencePanel").innerHTML = profile ? (isEditMode ? `
    <div class="admin-form-grid">
      <div class="admin-form-field">
        <label for="persistApiBase">GitHub API</label>
        <input id="persistApiBase" type="text" value="${escapeHtml(githubPersistenceState.apiBase || "")}" data-persist-setting="apiBase">
      </div>
      <div class="admin-form-field">
        <label for="persistToken">GitHub token</label>
        <input id="persistToken" type="password" value="${escapeHtml(githubPersistenceState.token || "")}" data-persist-setting="token" placeholder="Fine-grained PAT or app token">
      </div>
      <div class="admin-form-field">
        <label for="persistOwner">Owner</label>
        <input id="persistOwner" type="text" value="${escapeHtml(githubPersistenceState.owner || "")}" data-persist-setting="owner">
      </div>
      <div class="admin-form-field">
        <label for="persistRepo">Repo</label>
        <input id="persistRepo" type="text" value="${escapeHtml(githubPersistenceState.repo || "")}" data-persist-setting="repo">
      </div>
      <div class="admin-form-field">
        <label for="persistBranch">Branch</label>
        <input id="persistBranch" type="text" value="${escapeHtml(githubPersistenceState.branch || "")}" data-persist-setting="branch">
      </div>
      <div class="admin-form-field">
        <label for="persistEnvironment">Environment</label>
        <input id="persistEnvironment" type="text" value="${escapeHtml(githubPersistenceState.environment || "")}" data-persist-setting="environment" placeholder="Optional, repo-level by default">
      </div>
      <div class="admin-form-field span-2">
        <label for="persistCommitMessagePrefix">Commit message prefix</label>
        <input id="persistCommitMessagePrefix" type="text" value="${escapeHtml(githubPersistenceState.commitMessagePrefix || "")}" data-persist-setting="commitMessagePrefix">
      </div>
    </div>
    <div class="persistence-actions">
      <button class="accent-button" type="button" id="saveAllGithubButton">Save all to GitHub</button>
      <button class="ghost-button" type="button" id="saveConfigGithubButton">Save connector config</button>
      <button class="ghost-button" type="button" id="saveVariablesGithubButton">Save variables</button>
      <button class="ghost-button" type="button" id="saveSecretsGithubButton">Save secrets</button>
    </div>
    <div class="persistence-callout">
      Connector config writes to <strong>${escapeHtml(profile.connectorFile || "the selected connector file")}</strong> in
      <strong>${escapeHtml(`${githubPersistenceState.owner || "owner"}/${githubPersistenceState.repo || "repo"}`)}</strong>.
      Variables and secrets are written as GitHub Actions ${escapeHtml(githubPersistenceState.environment ? `environment settings for ${githubPersistenceState.environment}` : "repository settings")} for the same repo.
    </div>
    <div class="persist-status ${escapeHtml(persistenceStatus.tone)}">
      <strong>${escapeHtml(persistenceStatus.message)}</strong>
      ${persistenceStatus.details?.length ? `<div class="persistence-status-list">${persistenceStatus.details.map((detail) => `<div>${escapeHtml(detail)}</div>`).join("")}</div>` : ""}
    </div>
  ` : `
    ${renderGuideRows([
      ["GitHub API", githubPersistenceState.apiBase || "https://api.github.com"],
      ["Owner", githubPersistenceState.owner || "Not set"],
      ["Repo", githubPersistenceState.repo || "Not set"],
      ["Branch", githubPersistenceState.branch || "main"],
      ["Environment", githubPersistenceState.environment || "Repository-level settings"],
      ["Commit message prefix", githubPersistenceState.commitMessagePrefix || "Not set"],
      ["Token state", githubPersistenceState.token ? "Token saved locally for this browser session" : "No token entered"],
    ])}
    <div class="persistence-callout">
      Switch to <strong>Edit mode</strong> to change GitHub persistence settings or save connector config, variables, and secrets.
    </div>
    <div class="persist-status ${escapeHtml(persistenceStatus.tone)}">
      <strong>${escapeHtml(persistenceStatus.message)}</strong>
      ${persistenceStatus.details?.length ? `<div class="persistence-status-list">${persistenceStatus.details.map((detail) => `<div>${escapeHtml(detail)}</div>`).join("")}</div>` : ""}
    </div>
  `) : "";

  bindAdminPanelEvents();
}

function bindAdminPanelEvents() {
  $("adminConnectorSearch")?.addEventListener("input", (event) => {
    adminCatalogSearchTerm = event.target.value.trim().toLowerCase();
    renderAll();
  });

  Array.from($("adminConnectorFilters").querySelectorAll?.("[data-admin-filter]") || []).forEach((button) => {
    button.addEventListener("click", () => {
      adminCatalogFilter = button.dataset.adminFilter || "all";
      renderAll();
    });
  });

  $("adminConnectorsScopeButton")?.addEventListener("click", () => {
    setAdminEntity("connectors");
    openAdminCatalog();
    renderAll();
  });

  $("adminWorkflowsScopeButton")?.addEventListener("click", () => {
    setAdminEntity("workflows");
    openAdminCatalog();
    renderAll();
  });

  $("adminViewModeButton")?.addEventListener("click", () => {
    setAdminMode("view");
    renderAll();
  });

  $("adminEditModeButton")?.addEventListener("click", () => {
    setAdminMode("edit");
    renderAll();
  });

  Array.from($("adminConnectorCatalog").querySelectorAll?.("[data-admin-select-connector]") || []).forEach((button) => {
    button.addEventListener("click", () => {
      activeSourceId = button.dataset.adminSelectConnector;
      openAdminDetail({ entity: "connectors", mode: "view" });
      renderAll();
    });
  });

  Array.from($("adminConnectorCatalog").querySelectorAll?.("[data-admin-select-workflow]") || []).forEach((button) => {
    button.addEventListener("click", () => {
      activeAdminWorkflowId = button.dataset.adminSelectWorkflow;
      openAdminDetail({ entity: "workflows", mode: "view" });
      renderAll();
    });
  });

  const runtimeMode = $("adminRuntimeMode");
  if (runtimeMode) {
    runtimeMode.addEventListener("change", (event) => {
      updateConnectorProfile(activeSourceId, (profile) => {
        profile.activeRuntimeMode = event.target.value;
        return profile;
      });
      renderAll();
    });
  }

  Array.from($("adminBasicsPanel").querySelectorAll?.("[data-admin-basic-field]") || []).forEach((input) => {
    input.addEventListener("change", () => {
      updateConnectorProfile(activeSourceId, (profile) => {
        const field = input.dataset.adminBasicField;
        profile[field] = input.value;
        return profile;
      });
      const updated = connectorProfile(activeSourceId);
      if (updated) upsertConnectorDescriptorFromProfile(updated);
      setPersistenceStatus("pending", "Connector basics updated locally. Save to GitHub when ready.");
      renderAll();
    });
  });

  const validateConnectorButton = $("validateConnectorButton");
  if (validateConnectorButton) {
    validateConnectorButton.addEventListener("click", () => {
      const summary = connectorValidationSummary(activeAdminProfile());
      if (!summary.ready) {
        setPersistenceStatus("error", `Connector validation failed: ${summary.detail}`);
        renderAll();
        return;
      }
      updateConnectorProfile(activeSourceId, (currentProfile) => {
        currentProfile.lifecycleState = "validated";
        return currentProfile;
      });
      const updated = connectorProfile(activeSourceId);
      if (updated) upsertConnectorDescriptorFromProfile(updated);
      setPersistenceStatus("success", "Connector validated locally. Save the connector config to GitHub to persist the state.");
      renderAll();
    });
  }

  const activateConnectorButton = $("activateConnectorButton");
  if (activateConnectorButton) {
    activateConnectorButton.addEventListener("click", () => {
      const currentProfile = connectorProfile(activeSourceId);
      if (!currentProfile || !["validated", "active"].includes(connectorLifecycleState(currentProfile))) {
        setPersistenceStatus("error", "Validate the connector before activating it.");
        renderAll();
        return;
      }
      updateConnectorProfile(activeSourceId, (profileValue) => {
        profileValue.lifecycleState = "active";
        return profileValue;
      });
      const updated = connectorProfile(activeSourceId);
      if (updated) upsertConnectorDescriptorFromProfile(updated);
      setPersistenceStatus("success", "Connector activated locally. Save the connector config to GitHub to persist the state.");
      renderAll();
    });
  }

  const deactivateConnectorButton = $("deactivateConnectorButton");
  if (deactivateConnectorButton) {
    deactivateConnectorButton.addEventListener("click", () => {
      updateConnectorProfile(activeSourceId, (currentProfile) => {
        currentProfile.lifecycleState = "inactive";
        return currentProfile;
      });
      const updated = connectorProfile(activeSourceId);
      if (updated) upsertConnectorDescriptorFromProfile(updated);
      setPersistenceStatus("pending", "Connector set to inactive locally.");
      renderAll();
    });
  }

  Array.from($("adminRuntimePanel").querySelectorAll?.("[data-admin-mode-field]") || []).forEach((input) => {
    const handler = () => {
      updateConnectorProfile(activeSourceId, (profile) => {
        const mode = currentRuntimeMode(profile);
        if (!mode) return profile;
        const field = input.dataset.adminModeField;
        mode[field] = field === "requiredServerNames" ? parseCommaList(input.value) : input.value;
        return profile;
      });
      renderAll();
    };
    input.addEventListener("change", handler);
  });

  Array.from($("adminRuntimePanel").querySelectorAll?.("[data-admin-fabric-field]") || []).forEach((input) => {
    input.addEventListener("change", () => {
      updateConnectorProfile(activeSourceId, (profile) => {
        const field = input.dataset.adminFabricField;
        profile.mcpFabric = profile.mcpFabric || {};
        profile.mcpFabric[field] = input.value;
        return profile;
      });
      renderAll();
    });
  });

  Array.from($("adminToolMappings").querySelectorAll?.("[data-admin-tool-index]") || []).forEach((input) => {
    input.addEventListener("change", () => {
      updateConnectorProfile(activeSourceId, (profile) => {
        const index = Number(input.dataset.adminToolIndex);
        const field = input.dataset.adminToolField;
        if (!profile.toolMappings?.[index]) return profile;
        profile.toolMappings[index][field] = input.value;
        return profile;
      });
      renderAll();
    });
  });

  Array.from($("adminBindings").querySelectorAll?.("[data-admin-binding-collection]") || []).forEach((input) => {
    input.addEventListener("change", () => {
      const collection = input.dataset.adminBindingCollection;
      const visibleIndex = Number(input.dataset.adminBindingIndex);
      const bindingKind = input.dataset.adminBindingKind || "env";
      updateConnectorProfile(activeSourceId, (profile) => {
        const bindings = bindingKind === "secret" ? currentSecretBindings(profile) : currentEnvBindings(profile);
        const target = bindings[visibleIndex];
        if (!target) return profile;
        const sourceBindings = profile[collection] || [];
        const realIndex = sourceBindings.findIndex((item) => item === target);
        if (realIndex === -1) return profile;
        sourceBindings[realIndex].value = input.value;
        profile[collection] = sourceBindings;
        return profile;
      });
      renderAll();
    });
  });

  Array.from($("adminPolicy").querySelectorAll?.("[data-admin-policy-boolean]") || []).forEach((input) => {
    input.addEventListener("change", () => {
      updateConnectorProfile(activeSourceId, (profile) => {
        const field = input.dataset.adminPolicyBoolean;
        profile.writePolicy = profile.writePolicy || {};
        profile.writePolicy[field] = input.checked;
        return profile;
      });
      renderAll();
    });
  });

  Array.from($("adminPolicy").querySelectorAll?.("[data-admin-policy-list]") || []).forEach((input) => {
    input.addEventListener("change", () => {
      updateConnectorProfile(activeSourceId, (profile) => {
        const field = input.dataset.adminPolicyList;
        profile.writePolicy = profile.writePolicy || {};
        profile.writePolicy[field] = parseCommaList(input.value);
        return profile;
      });
      renderAll();
    });
  });

  Array.from($("adminPolicy").querySelectorAll?.("[data-admin-policy-text]") || []).forEach((input) => {
    input.addEventListener("change", () => {
      updateConnectorProfile(activeSourceId, (profile) => {
        const field = input.dataset.adminPolicyText;
        profile.writePolicy = profile.writePolicy || {};
        profile.writePolicy[field] = input.value;
        return profile;
      });
      renderAll();
    });
  });

  const workflowSelect = $("adminWorkflowSelect");
  if (workflowSelect) {
    workflowSelect.addEventListener("change", (event) => {
      activeAdminWorkflowId = event.target.value;
      renderAll();
    });
  }

  Array.from($("adminWorkflowPanel").querySelectorAll?.("[data-admin-workflow-field]") || []).forEach((input) => {
    input.addEventListener("change", () => {
      const field = input.dataset.adminWorkflowField;
      updateWorkflowProfile(activeAdminWorkflowId, (currentWorkflow) => {
        if (field === "retryCount" || field === "maxConcurrency") {
          currentWorkflow[field] = Number(input.value || 0);
        } else {
          currentWorkflow[field] = input.value;
        }
        return currentWorkflow;
      });
      setPersistenceStatus("pending", "Workflow settings updated locally. Use Activate workflow when the required connectors are ready.");
      renderAll();
    });
  });

  const activateWorkflowButton = $("activateWorkflowButton");
  if (activateWorkflowButton) {
    activateWorkflowButton.addEventListener("click", () => {
      const readiness = workflowConnectorReadiness(activeAdminWorkflow());
      if (!readiness.canActivate) {
        setPersistenceStatus("error", `Workflow activation blocked until these connectors are validated: ${readiness.missingRequired.map((item) => item.name).join(", ")}`);
        renderAll();
        return;
      }
      updateWorkflowProfile(activeAdminWorkflowId, (currentWorkflow) => {
        currentWorkflow.activationState = "active";
        return currentWorkflow;
      });
      setPersistenceStatus("success", "Workflow activated locally. Save the related workflow file changes through your control-plane persistence path when ready.");
      renderAll();
    });
  }

  const deactivateWorkflowButton = $("deactivateWorkflowButton");
  if (deactivateWorkflowButton) {
    deactivateWorkflowButton.addEventListener("click", () => {
      updateWorkflowProfile(activeAdminWorkflowId, (currentWorkflow) => {
        currentWorkflow.activationState = "inactive";
        return currentWorkflow;
      });
      setPersistenceStatus("pending", "Workflow deactivated locally.");
      renderAll();
    });
  }

  Array.from($("adminPersistencePanel").querySelectorAll?.("[data-persist-setting]") || []).forEach((input) => {
    input.addEventListener("change", () => {
      updateGithubPersistence({
        [input.dataset.persistSetting]: input.value,
      });
      setPersistenceStatus("pending", "GitHub connection settings updated locally. Save when you are ready.");
      renderAll();
    });
  });

  const saveAllButton = $("saveAllGithubButton");
  if (saveAllButton) {
    saveAllButton.addEventListener("click", async () => {
      try {
        setPersistenceStatus("pending", "Saving connector config, variables, and secrets to GitHub...");
        renderAll();
        const details = await persistConnectorProfileToGithub({ config: true, variables: true, secrets: true });
        setPersistenceStatus("success", "Saved connector config, variables, and secrets to GitHub.", details);
      } catch (error) {
        setPersistenceStatus("error", `GitHub persistence failed: ${error.message}`);
      }
      renderAll();
    });
  }

  const saveConfigButton = $("saveConfigGithubButton");
  if (saveConfigButton) {
    saveConfigButton.addEventListener("click", async () => {
      try {
        setPersistenceStatus("pending", "Saving connector config file to GitHub...");
        renderAll();
        const details = await persistConnectorProfileToGithub({ config: true, variables: false, secrets: false });
        setPersistenceStatus("success", "Saved connector config file to GitHub.", details);
      } catch (error) {
        setPersistenceStatus("error", `Config save failed: ${error.message}`);
      }
      renderAll();
    });
  }

  const saveVariablesButton = $("saveVariablesGithubButton");
  if (saveVariablesButton) {
    saveVariablesButton.addEventListener("click", async () => {
      try {
        setPersistenceStatus("pending", "Saving repository variables to GitHub...");
        renderAll();
        const details = await persistConnectorProfileToGithub({ config: false, variables: true, secrets: false });
        setPersistenceStatus("success", "Saved repository variables to GitHub.", details);
      } catch (error) {
        setPersistenceStatus("error", `Variable save failed: ${error.message}`);
      }
      renderAll();
    });
  }

  const saveSecretsButton = $("saveSecretsGithubButton");
  if (saveSecretsButton) {
    saveSecretsButton.addEventListener("click", async () => {
      try {
        setPersistenceStatus("pending", "Encrypting and saving repository secrets to GitHub...");
        renderAll();
        const details = await persistConnectorProfileToGithub({ config: false, variables: false, secrets: true });
        setPersistenceStatus("success", "Saved repository secrets to GitHub.", details);
      } catch (error) {
        setPersistenceStatus("error", `Secret save failed: ${error.message}`);
      }
      renderAll();
    });
  }
}

function createConfiguredRun(template = activeTemplate()) {
  const flow = activeFlow();
  const source = activeSource();
  const runNumber = liveRuns.length + 1;
  const runId = `kd-run-${170 + runNumber}`;
  const threadId = `thread-${runNumber}`;
  const nextStep = sourceSupportedByFlow(source, flow)
    ? "Start the dry-run"
    : `Switch to ${recommendedSourceForFlow(flow)?.name || "a supported source"} before the dry-run`;

  chats.unshift({
    id: threadId,
    timeline: [
      { stage: "Setup review", state: "completed", summary: `${flow?.name || "Flow"} selected with ${source?.name || "source"} as the current connector.` },
      { stage: "Intake", state: "active", summary: "Dry-run will validate source mapping, routing, and secret resolution." },
      { stage: "Writeback", state: "pending", summary: "Guarded writes stay paused until the dry-run passes." },
    ],
    messages: [
      {
        role: "system",
        author: "Run Bootstrap",
        timestamp: "now",
        body: `<p>${template?.prompt || flow?.summary || "Create a safe dry-run for the selected workload."}</p><p><strong>Selected source:</strong> ${escapeHtml(source?.name || "Unknown")}<br><strong>Selected flow:</strong> ${escapeHtml(flow?.name || "Unknown")}</p>`,
      },
    ],
  });

  liveRuns.unshift({
    id: runId,
    workTypeId: flow?.id || "",
    threadId,
    status: "WAITING",
    stage: "setup-review",
    source: source?.name || `Direct / ${template?.title || "Template"}`,
    duration: "0m",
    risk: sourceSupportedByFlow(source, flow) ? "Medium" : "High",
    next: nextStep,
    owner: "Developer",
  });

  activeRunId = runId;
  setView("runs");
  renderAll();
}

function addRunNote() {
  const thread = activeThread();
  const text = $("composerInput").value.trim();
  if (!thread || !text) return;

  thread.messages.push({
    role: "user",
    author: "Developer",
    timestamp: "now",
    body: `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`,
  });
  renderRuns();
}

function attachRunContext() {
  const run = activeRun();
  if (!run) return;
  $("composerInput").value = `${$("composerInput").value.trim()}\n\nRun context:\n- ${run.id}\n- ${run.source}\n- ${run.stage}\n- ${run.next}`;
}

function renderAll() {
  renderHeader();
  renderSelects();
  renderSetup();
  renderRunRail();
  renderTemplateRail();
  renderRuns();
  renderMonitor();
  renderDetails();
  renderAdmin();
}

if (activeTemplate()) {
  applyTemplate(activeTemplate());
} else {
  ensureSourceForFlow(activeFlow(), true);
}

$("sourceSelect").addEventListener("change", (event) => {
  activeSourceId = event.target.value;
  renderAll();
});

$("flowSelect").addEventListener("change", (event) => {
  setFlow(event.target.value);
  renderAll();
});

$("newRunButton").addEventListener("click", () => createConfiguredRun(activeTemplate()));
$("launchRunButton").addEventListener("click", () => createConfiguredRun(activeTemplate()));
$("sendButton").addEventListener("click", addRunNote);
$("attachContextButton").addEventListener("click", attachRunContext);
$("exportBriefButton").addEventListener("click", attachRunContext);
$("pauseRunButton").addEventListener("click", () => {
  const run = activeRun();
  if (run) {
    run.status = "WAITING";
    run.next = "Resume when ready";
    renderAll();
  }
});

$("resetConnectorButton").addEventListener("click", () => {
  resetConnectorProfile(activeSourceId);
  renderAll();
});

$("createConnectorProfileButton").addEventListener("click", () => {
  setAdminEntity("connectors");
  openAdminDetail({ entity: "connectors", mode: "edit" });
  createConnectorProfileFromTemplate("enterprise-template");
  setView("admin");
  renderAll();
});

$("duplicateConnectorProfileButton").addEventListener("click", () => {
  setAdminEntity("connectors");
  openAdminDetail({ entity: "connectors", mode: "edit" });
  createConnectorProfileFromTemplate(activeSourceId, {
    name: `Copy of ${activeAdminProfile()?.name || "Connector"}`,
  });
  setView("admin");
  renderAll();
});

$("resetAllAdminButton").addEventListener("click", () => {
  resetAllConnectorProfiles();
  resetAllWorkflowProfiles();
  adminCreatedProfileIds = new Set();
  renderAll();
});

$("openSetupAdminButton").addEventListener("click", () => {
  if (!connectorProfile(activeSourceId)) {
    createConnectorProfileForSource(activeSource());
  }
  setAdminEntity("connectors");
  openAdminDetail({ entity: "connectors", mode: "edit" });
  setView("admin");
  renderAll();
});

$("createSetupConfigButton").addEventListener("click", () => {
  setAdminEntity("connectors");
  openAdminDetail({ entity: "connectors", mode: "edit" });
  createConnectorProfileForSource(activeSource());
  setView("admin");
  renderAll();
});

$("backToConnectorCatalogButton").addEventListener("click", () => {
  openAdminCatalog();
  renderAll();
});

$("cancelConnectorChangesButton").addEventListener("click", () => {
  if (adminEntity === "workflows") {
    cancelWorkflowChanges(activeAdminWorkflowId);
  } else {
    cancelConnectorChanges(activeSourceId);
  }
  openAdminCatalog();
  renderAll();
});

$("setupShortcut").addEventListener("click", () => setView("setup"));
$("runsShortcut").addEventListener("click", () => setView("runs"));
$("monitorShortcut").addEventListener("click", () => setView("monitor"));
$("adminShortcut").addEventListener("click", () => {
  openAdminCatalog();
  setView("admin");
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.view === "admin") openAdminCatalog();
    setView(button.dataset.view);
  });
});

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeFilter = chip.dataset.filter || "all";
    filterChips.forEach((button) => button.classList.toggle("active", button === chip));
    renderRunRail();
  });
});

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderAll();
});

$("historyToggle").addEventListener("click", () => $("historyPanel").classList.toggle("open"));
$("connectorToggle").addEventListener("click", () => $("connectorPanel").classList.toggle("open"));

renderAll();
setView(activeView);
