const data = window.KNOCKDOWN_CONSOLE_DATA || {};

const templates = data.templates || [];
const workTypes = data.workTypes || [];
const connectors = data.connectors || [];
const configSources = data.configSources || [];
const secretBindings = data.secretBindings || [];
const chats = data.chats || [];
const liveRuns = data.liveRuns || [];
const decisionTrace = data.decisionTrace || [];
const failureHeatmap = data.failureHeatmap || [];

const $ = (id) => document.getElementById(id);

const panels = {
  setup: $("setupPanel"),
  runs: $("runsPanel"),
  monitor: $("monitorPanel"),
};

const navButtons = Array.from(document.querySelectorAll(".primary-nav"));
const searchInput = document.querySelector(".global-search input");
const filterChips = Array.from(document.querySelectorAll(".filter-chip"));

let activeView = "setup";
let activeRunId = liveRuns[0]?.id || "";
let activeFlowId = workTypes[0]?.id || "";
let activeSourceId = connectors[0]?.id || "";
let activeFilter = "all";
let searchTerm = "";

function matches(values) {
  if (!searchTerm) return true;
  return values.filter(Boolean).join(" ").toLowerCase().includes(searchTerm);
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (["live", "active", "running", "online"].includes(value)) return "live";
  if (["waiting", "chained", "shared"].includes(value)) return "pending";
  return "staged";
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
  if (activeView === "setup") {
    $("workspaceKicker").textContent = "New setup";
    $("chatTitle").textContent = "What do you want Knockdown to handle?";
    $("chatMeta").innerHTML = [
      `Source: ${activeSource()?.name || "Choose one"}`,
      `Flow: ${activeFlow()?.name || "Choose one"}`,
    ].map((item) => `<span>${item}</span>`).join("");
    return;
  }

  if (activeView === "monitor") {
    $("workspaceKicker").textContent = "Monitor";
    $("chatTitle").textContent = "Automation health";
    $("chatMeta").innerHTML = "<span>Active runs and items that need attention.</span>";
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
  ].filter(Boolean).map((item) => `<span>${item}</span>`).join("");
}

function renderSelects() {
  const sourceSelect = $("sourceSelect");
  const flowSelect = $("flowSelect");

  sourceSelect.innerHTML = connectors.map((source) => (
    `<option value="${source.id}"${source.id === activeSourceId ? " selected" : ""}>${source.name}</option>`
  )).join("");

  flowSelect.innerHTML = workTypes.map((flow) => (
    `<option value="${flow.id}"${flow.id === activeFlowId ? " selected" : ""}>${flow.name}</option>`
  )).join("");
}

function renderSetup() {
  const source = activeSource();
  const flow = activeFlow();

  renderSelects();

  $("workTypeRegistry").innerHTML = "";
  workTypes
    .filter((flowItem) => matches([flowItem.name, flowItem.summary, flowItem.approvalPosture]))
    .forEach((flowItem) => {
      const button = document.createElement("button");
      button.className = `template-tile${flowItem.id === activeFlowId ? " active" : ""}`;
      button.type = "button";
      button.innerHTML = `
        <div class="tile-top">
          <span>${flowItem.name}</span>
          <span class="status-dot ${statusClass(flowItem.status)}">${flowItem.status}</span>
        </div>
        <p>${flowItem.summary}</p>
      `;
      button.addEventListener("click", () => {
        activeFlowId = flowItem.id;
        renderAll();
      });
      $("workTypeRegistry").appendChild(button);
    });

  $("setupChecklistList").innerHTML = [
    ["Connect source", source?.name || "Choose a source"],
    ["Choose flow", flow?.name || "Choose a flow"],
    ["Add secrets", "Repo, runner, or runtime-injected"],
    ["Test first", flow?.publishState || "Dry-run before real updates"],
  ].map(([title, detail]) => `
    <div class="check-item">
      <span class="check-icon">✓</span>
      <div>
        <strong>${title}</strong>
        <p>${detail}</p>
      </div>
    </div>
  `).join("");

  $("setupFocus").innerHTML = `
    <div class="selected-row">
      <span>Source</span>
      <strong>${source?.name || "Not selected"}</strong>
    </div>
    <div class="selected-row">
      <span>Flow</span>
      <strong>${flow?.name || "Not selected"}</strong>
    </div>
    <div class="selected-row">
      <span>Safety</span>
      <strong>${flow?.approvalPosture || "Dry-run first"}</strong>
    </div>
  `;

  $("setupConfigList").innerHTML = [...configSources.slice(0, 3), ...secretBindings.slice(0, 2).map((item) => ({
    label: item.label,
    detail: item.detail,
  }))].map((item) => `
    <div class="compact-row">
      <strong>${item.label}</strong>
      <span>${item.detail}</span>
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
      <span>${run.id}</span>
      <small>${run.stage} · ${run.duration}</small>
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
  templates.filter((template) => matches([template.title, template.meta, template.prompt])).forEach((template) => {
    const button = document.createElement("button");
    button.className = "template-link";
    button.type = "button";
    button.innerHTML = `
      <span>${template.title}</span>
      <small>${template.meta}</small>
    `;
    button.addEventListener("click", () => createTemplateRun(template));
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
  ].filter(Boolean).map((item) => `<span>${item}</span>`).join("");

  $("runSummaryList").innerHTML = [
    ["Flow", flow?.name || "Unknown"],
    ["Current step", run?.stage || "Idle"],
    ["Risk", run?.risk || "n/a"],
    ["Next", run?.next || "n/a"],
  ].map(([label, value]) => `
    <div class="summary-row">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");

  $("timelineList").innerHTML = (thread?.timeline || []).map((item) => `
    <div class="timeline-item ${item.state}">
      <div class="timeline-marker"></div>
      <div>
        <div class="timeline-stage-row">
          <strong>${item.stage}</strong>
          <span>${item.state}</span>
        </div>
        <p>${item.summary}</p>
      </div>
    </div>
  `).join("");

  $("messageStream").innerHTML = (thread?.messages || []).map((message) => `
    <article class="message ${message.role}">
      <div class="message-top">
        <strong>${message.author}</strong>
        <span>${message.timestamp}</span>
      </div>
      <div class="message-body">${message.body}</div>
    </article>
  `).join("");
}

function renderMonitor() {
  $("runBoard").innerHTML = liveRuns
    .filter((run) => matches([run.id, run.source, run.status, run.stage, run.next]))
    .map((run) => `
      <button class="monitor-row" data-run-id="${run.id}" type="button">
        <div>
          <strong>${run.id}</strong>
          <span>${run.source}</span>
        </div>
        <span class="status-dot ${statusClass(run.status)}">${run.status}</span>
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
      <strong>${trace.title}</strong>
      <span>${(trace.details || []).join(" ")}</span>
    </div>
  `).join("");

  $("failureHeatmap").innerHTML = failureHeatmap.map((item) => `
    <div class="compact-row">
      <strong>${item.area}</strong>
      <span>${item.value}: ${item.note}</span>
    </div>
  `).join("");
}

function renderDetails() {
  const source = activeSource();

  $("connectorList").innerHTML = connectors.map((connector) => `
    <button class="source-pill${connector.id === activeSourceId ? " active" : ""}" data-source-id="${connector.id}" type="button">
      ${connector.name}
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
      <strong>${source.mode}</strong>
      <span>${source.detail}</span>
    </div>
    <div class="chip-row">
      ${(source.capabilities || []).slice(0, 4).map((capability) => `<span>${capability}</span>`).join("")}
    </div>
  ` : "";
}

function createTemplateRun(template) {
  const flow = workTypes.find((item) => item.profileId.toLowerCase() === template.profile.toLowerCase()) || activeFlow();
  const runNumber = liveRuns.length + 1;
  const runId = `kd-run-${170 + runNumber}`;
  const threadId = `thread-${runNumber}`;

  chats.unshift({
    id: threadId,
    timeline: [
      { stage: "Intake", state: "active", summary: "Run created from a starter template." },
      { stage: "Test", state: "pending", summary: "Dry-run will validate routing and secrets." },
    ],
    messages: [
      {
        role: "system",
        author: "Run Bootstrap",
        timestamp: "now",
        body: `<p>${template.prompt}</p>`,
      },
    ],
  });

  liveRuns.unshift({
    id: runId,
    workTypeId: flow.id,
    threadId,
    status: "WAITING",
    stage: "intake",
    source: `Direct / ${template.title}`,
    duration: "0m",
    risk: "Medium",
    next: "Start the dry-run",
    owner: "Developer",
  });

  activeRunId = runId;
  activeFlowId = flow.id;
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
    body: `<p>${text.replace(/\n/g, "<br>")}</p>`,
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
}

function renderSelects() {
  $("sourceSelect").innerHTML = connectors.map((source) => (
    `<option value="${source.id}"${source.id === activeSourceId ? " selected" : ""}>${source.name}</option>`
  )).join("");
  $("flowSelect").innerHTML = workTypes.map((flow) => (
    `<option value="${flow.id}"${flow.id === activeFlowId ? " selected" : ""}>${flow.name}</option>`
  )).join("");
}

$("sourceSelect").addEventListener("change", (event) => {
  activeSourceId = event.target.value;
  renderAll();
});

$("flowSelect").addEventListener("change", (event) => {
  activeFlowId = event.target.value;
  renderAll();
});

$("newRunButton").addEventListener("click", () => createTemplateRun(templates[0]));
$("launchRunButton").addEventListener("click", () => createTemplateRun(templates[0]));
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

$("setupShortcut").addEventListener("click", () => setView("setup"));
$("runsShortcut").addEventListener("click", () => setView("runs"));
$("monitorShortcut").addEventListener("click", () => setView("monitor"));

navButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
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
