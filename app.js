const consoleData = window.KNOCKDOWN_CONSOLE_DATA || {};

const chats = consoleData.chats || [];
const connectors = consoleData.connectors || [];
const providers = consoleData.providers || [];
const policies = consoleData.policies || [];
const queueHealth = consoleData.queueHealth || [];
const templates = consoleData.templates || [];

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

let activeChatId = chats[0]?.id || "";
let activeConnectorId = connectors[0]?.id || "";
let activeFilter = "all";
let searchTerm = "";

function connectorStatusClass(status) {
  return status === "LIVE" ? "live" : "staged";
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

function matchesChatFilter(chat) {
  if (activeFilter === "assigned") {
    return chat.meta.some((item) => item.toLowerCase().includes("owner:"));
  }
  if (activeFilter === "watching") {
    return chat.meta.some((item) => item.toLowerCase().includes("human gate") || item.toLowerCase().includes("awaiting"));
  }
  return true;
}

function matchesSearch(chat) {
  if (!searchTerm) return true;
  const haystack = [
    chat.title,
    chat.source,
    chat.profile,
    chat.workflowStage,
    ...(chat.meta || []),
    ...((chat.messages || []).map((message) => `${message.author} ${message.body}`)),
  ].join(" ").toLowerCase();

  return haystack.includes(searchTerm);
}

function filteredChats() {
  return chats.filter((chat) => matchesChatFilter(chat) && matchesSearch(chat));
}

function renderHistory() {
  historyList.innerHTML = "";

  const visibleChats = filteredChats();

  if (!visibleChats.some((chat) => chat.id === activeChatId) && visibleChats[0]) {
    activeChatId = visibleChats[0].id;
  }

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
      renderHistory();
      renderChat();
      closePanelsOnMobile();
    });

    historyList.appendChild(button);
  });

  if (!visibleChats.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = "No threads match the current search or filter.";
    historyList.appendChild(empty);
  }
}

function renderTemplates() {
  templateList.innerHTML = "";

  templates.forEach((template) => {
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

function renderChat() {
  const chat = chats.find((item) => item.id === activeChatId);
  if (!chat) return;

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

  const visibleConnectors = connectors.filter((connector) => {
    if (!searchTerm) return true;
    const haystack = [
      connector.name,
      connector.detail,
      connector.meta,
      ...(connector.capabilities || []),
      ...(connector.operations || []),
      ...(connector.env || []),
    ].join(" ").toLowerCase();

    return haystack.includes(searchTerm);
  });

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

function createNewChat() {
  const threadNumber = chats.length + 1;
  const draft = {
    id: `draft-${threadNumber}`,
    title: `New work delivery thread ${threadNumber}`,
    source: "Direct input / Unclassified",
    time: "just now",
    stage: "Intake",
    profile: "Task",
    sourceGraph: "Awaiting adapter selection",
    workflowStage: "Intake",
    meta: ["No source adapter selected", "Awaiting normalization", "No write-back policy loaded"],
    messages: [
      {
        role: "system",
        author: "Work Delivery Agent",
        timestamp: "now",
        chips: ["Intake", "Unclassified"],
        body: `
          <p>Start with a requirement, issue URL, defect number, case reference, or direct task description. The generic pipeline will resolve the source adapter, normalize the work item, and select the right lifecycle profile.</p>
        `,
      },
    ],
  };

  chats.unshift(draft);
  activeChatId = draft.id;
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
    meta: ["Template seeded", "Awaiting source adapter selection", "Writeback policy not loaded yet"],
    insights: [
      {
        label: "Confidence",
        value: "Pending",
        tone: "neutral"
      },
      {
        label: "Risk",
        value: "Unknown",
        tone: "warn"
      },
      {
        label: "Validation",
        value: "Not planned",
        tone: "neutral"
      },
      {
        label: "Writeback",
        value: "Not armed",
        tone: "neutral"
      }
    ],
    timeline: [
      {
        stage: "Intake",
        state: "active",
        summary: "Template thread created and waiting for a requirement or source identifier."
      },
      {
        stage: "Context Assembly",
        state: "pending",
        summary: "Will start after source normalization."
      },
      {
        stage: "Execution",
        state: "pending",
        summary: "Execution path will depend on the selected lifecycle profile."
      }
    ],
    messages: [
      {
        role: "system",
        author: "Work Delivery Agent",
        timestamp: "now",
        chips: [template.profile, "Template"],
        body: `
          <p>${template.prompt}</p>
        `,
      },
    ],
  };

  chats.unshift(draft);
  activeChatId = draft.id;
  renderHistory();
  renderChat();
  composerInput.value = template.prompt;
}

function appendComposerMessage() {
  const text = composerInput.value.trim();
  const chat = chats.find((item) => item.id === activeChatId);
  if (!text || !chat) return;

  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  chat.messages.push({
    role: "user",
    author: "Delivery Operator",
    timestamp,
    chips: ["Manual instruction"],
    body: `<p>${text.replace(/\n/g, "<br>")}</p>`,
  });

  chat.messages.push({
    role: "agent",
    author: "Work Delivery Agent",
    timestamp,
    chips: ["Queued update", "Interactive shell"],
    body: `
      <p>The request has been staged in the operator console. In a live runtime this would trigger source resolution, context refresh, and the next lifecycle action for the active thread.</p>
    `,
  });

  chat.time = "just now";
  renderHistory();
  renderChat();
}

function attachContextToComposer() {
  const chat = chats.find((item) => item.id === activeChatId);
  if (!chat) return;

  composerInput.value = `${composerInput.value.trim()}\n\nContext to include:\n- Source graph: ${chat.sourceGraph}\n- Active stage: ${chat.workflowStage}\n- Current gate: ${chat.meta.join(" | ")}`;
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

globalSearchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderHistory();
  renderChat();
  renderConnectors();
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
