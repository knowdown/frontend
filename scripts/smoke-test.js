#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

class FakeClassList {
  constructor(element) {
    this.element = element;
    this.set = new Set();
  }

  sync() {
    this.element.className = Array.from(this.set).join(" ");
  }

  add(...classes) {
    classes.filter(Boolean).forEach((name) => this.set.add(name));
    this.sync();
  }

  remove(...classes) {
    classes.forEach((name) => this.set.delete(name));
    this.sync();
  }

  toggle(name, force) {
    if (typeof force === "boolean") {
      if (force) this.set.add(name);
      else this.set.delete(name);
    } else if (this.set.has(name)) {
      this.set.delete(name);
    } else {
      this.set.add(name);
    }
    this.sync();
    return this.set.has(name);
  }

  contains(name) {
    return this.set.has(name);
  }
}

class FakeElement {
  constructor(tagName = "div", id = "") {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.dataset = {};
    this.children = [];
    this.listeners = {};
    this.className = "";
    this.classList = new FakeClassList(this);
    this.hidden = false;
    this.value = "";
    this.textContent = "";
    this._innerHTML = "";
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(type, handler) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(handler);
  }

  dispatchEvent(event) {
    const handlers = this.listeners[event.type] || [];
    handlers.forEach((handler) => handler(event));
  }

  click() {
    this.dispatchEvent({ type: "click", target: this });
  }
}

function createElement(id, tagName = "div") {
  return new FakeElement(tagName, id);
}

const elements = new Map();
const createById = (id, tagName = "div") => {
  const element = createElement(id, tagName);
  elements.set(id, element);
  return element;
};

[
  "workspaceKicker",
  "chatTitle",
  "chatMeta",
  "overviewStrip",
  "historyList",
  "templateList",
  "sourceSelect",
  "flowSelect",
  "setupSelectionHint",
  "setupStateBanner",
  "setupStageStrip",
  "setupFocus",
  "workTypeRegistry",
  "setupSourceCatalog",
  "setupSourceRole",
  "setupConfigStatus",
  "setupConfigArtifacts",
  "setupConfigSnapshot",
  "setupStorageMap",
  "setupRequiredInputs",
  "setupLaunchChecklist",
  "setupNextAction",
  "setupSourceGuide",
  "setupConfigList",
  "runTitle",
  "runMeta",
  "profileValue",
  "sourceValue",
  "stageValue",
  "nextActionValue",
  "insightGrid",
  "runSummaryList",
  "runDependencyList",
  "timelineList",
  "messageStream",
  "runBoard",
  "decisionTrace",
  "failureHeatmap",
  "helpGlossary",
  "connectorList",
  "connectorFocus",
  "providerGrid",
  "policyList",
  "secretBindings",
  "adminMeta",
  "adminModeSwitch",
  "adminViewModeButton",
  "adminEditModeButton",
  "adminCatalogActions",
  "adminDetailActions",
  "adminEditActions",
  "adminBannerCopy",
  "adminShell",
  "adminCatalogPanel",
  "adminDetailStage",
  "backToConnectorCatalogButton",
  "cancelConnectorChangesButton",
  "adminSelectedHeader",
  "adminConnectorCatalog",
  "adminSummary",
  "adminBasicsPanel",
  "adminRuntimePanel",
  "adminToolMappings",
  "adminBindings",
  "adminPolicy",
  "adminPersistencePanel",
  "adminConfigPreview",
  "composerInput",
  "attachContextButton",
  "sendButton",
  "exportBriefButton",
  "pauseRunButton",
  "launchRunButton",
  "newRunButton",
  "connectSourceAdapterButton",
  "switchWorkTypeButton",
  "contextDiagnosticsButton",
  "setupShortcut",
  "runsShortcut",
  "monitorShortcut",
  "adminShortcut",
  "historyToggle",
  "connectorToggle",
  "openSetupAdminButton",
  "createSetupConfigButton",
  "createConnectorProfileButton",
  "duplicateConnectorProfileButton",
  "resetConnectorButton",
  "resetAllAdminButton",
  "historyPanel",
  "connectorPanel",
  "setupPanel",
  "runsPanel",
  "monitorPanel",
  "adminPanel",
  "setupTab",
  "runsTab",
  "monitorTab",
  "adminTab",
].forEach((id) => createById(
  id,
  id === "sourceSelect" ||
  id === "flowSelect"
    ? "select" :
  id.endsWith("Button") ||
  id.endsWith("Shortcut") ||
  id.endsWith("Tab") ||
  id === "attachContextButton" ||
  id === "sendButton" ||
  id === "exportBriefButton" ||
  id === "pauseRunButton" ||
  id === "launchRunButton" ||
  id === "newRunButton" ||
  id === "openSetupAdminButton" ||
  id === "createSetupConfigButton" ||
  id === "createConnectorProfileButton" ||
  id === "duplicateConnectorProfileButton" ||
  id === "resetConnectorButton" ||
  id === "resetAllAdminButton" ||
  id === "connectSourceAdapterButton" ||
  id === "switchWorkTypeButton" ||
  id === "contextDiagnosticsButton" ||
  id === "historyToggle" ||
  id === "connectorToggle"
    ? "button"
    : "div"
));

const globalSearchInput = createElement("globalSearchInput", "input");

const filterAll = createElement("filterAll", "button");
filterAll.dataset.filter = "all";
filterAll.classList.add("filter-chip", "active");
const filterRunning = createElement("filterRunning", "button");
filterRunning.dataset.filter = "running";
filterRunning.classList.add("filter-chip");
const filterWaiting = createElement("filterWaiting", "button");
filterWaiting.dataset.filter = "waiting";
filterWaiting.classList.add("filter-chip");
const filterChips = [filterAll, filterRunning, filterWaiting];

elements.get("setupTab").dataset.view = "setup";
elements.get("setupTab").classList.add("primary-nav", "active");
elements.get("runsTab").dataset.view = "runs";
elements.get("runsTab").classList.add("primary-nav");
elements.get("monitorTab").dataset.view = "monitor";
elements.get("monitorTab").classList.add("primary-nav");
elements.get("adminTab").dataset.view = "admin";
elements.get("adminTab").classList.add("primary-nav");
const workspaceTabs = [
  elements.get("setupTab"),
  elements.get("runsTab"),
  elements.get("monitorTab"),
  elements.get("adminTab"),
];

const documentStub = {
  getElementById(id) {
    return elements.get(id) || null;
  },
  querySelector(selector) {
    if (selector === ".global-search input") return globalSearchInput;
    return null;
  },
  querySelectorAll(selector) {
    if (selector === ".filter-chip") return filterChips;
    if (selector === ".primary-nav") return workspaceTabs;
    return [];
  },
  createElement(tagName) {
    return new FakeElement(tagName);
  },
};

const windowStub = {
  innerWidth: 1440,
  addEventListener() {},
};

const context = {
  console,
  window: windowStub,
  document: documentStub,
  setTimeout,
  clearTimeout,
  Date,
};
context.global = context;
vm.createContext(context);

vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "app-data.js"), "utf8"), context, { filename: "app-data.js" });
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8"), context, { filename: "app.js" });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(elements.get("setupPanel").hidden === false, "Setup should be the default view");
assert(elements.get("chatTitle").textContent.includes("What do you want Knockdown to handle"), "Header should explain the setup-first experience");
assert(elements.get("sourceSelect").innerHTML.includes("ServiceNow"), "Source selector should render");
assert(elements.get("flowSelect").innerHTML.includes("Defect Delivery"), "Flow selector should render");
assert(elements.get("workTypeRegistry").children.length >= 1, "Flow templates should render");
assert(elements.get("setupStateBanner").innerHTML.includes("connector config"), "Setup state banner should explain config status");
assert(elements.get("setupConfigSnapshot").innerHTML.length > 0, "Setup should expose a config snapshot");
assert(elements.get("setupStorageMap").innerHTML.includes("Admin"), "Setup should explain where settings are configured");

elements.get("sourceSelect").value = "github-issues";
elements.get("sourceSelect").dispatchEvent({ type: "change", target: elements.get("sourceSelect") });
assert(elements.get("setupFocus").innerHTML.includes("GitHub"), "Selecting a source should update setup summary");

const secondFlow = elements.get("workTypeRegistry").children[1];
assert(secondFlow, "Expected a second flow template");
secondFlow.click();
assert(elements.get("setupFocus").innerHTML.includes("Story Delivery"), "Selecting a flow should update setup summary");

elements.get("runsShortcut").click();
assert(elements.get("runsPanel").hidden === false, "Runs view should open from shortcut");
assert(elements.get("runSummaryList").innerHTML.includes("Current step"), "Run summary should render");
assert(elements.get("messageStream").innerHTML.includes("Run"), "Run thread should render");

elements.get("attachContextButton").click();
assert(elements.get("composerInput").value.includes("Run context:"), "Attach context should enrich notes");

const previousMessages = elements.get("messageStream").children.length;
elements.get("sendButton").click();
assert(elements.get("messageStream").children.length >= previousMessages, "Adding a note should keep thread healthy");

elements.get("monitorShortcut").click();
assert(elements.get("monitorPanel").hidden === false, "Monitor view should open");
assert(elements.get("runBoard").innerHTML.includes("kd-run"), "Monitor runs should render");

elements.get("adminShortcut").click();
assert(elements.get("adminPanel").hidden === false, "Admin view should open from shortcut");
assert(elements.get("adminCatalogPanel").hidden === false, "Admin should open on the connector catalog");
assert(elements.get("adminDetailStage").hidden === true, "Connector detail workspace should stay hidden until a connector is selected");

globalSearchInput.value = "Architect approval";
globalSearchInput.dispatchEvent({ type: "input", target: globalSearchInput });
assert(elements.get("runBoard").innerHTML.includes("kd-run") || elements.get("historyList").children.length >= 1, "Search should preserve matching content");

globalSearchInput.value = "";
globalSearchInput.dispatchEvent({ type: "input", target: globalSearchInput });
filterRunning.click();
assert(elements.get("historyList").children.length >= 1, "Run filter should keep matching runs");

const beforeNewRunCount = elements.get("historyList").children.length;
elements.get("newRunButton").click();
assert(elements.get("historyList").children.length >= beforeNewRunCount, "Starting from an example should keep runs populated");
assert(elements.get("runsPanel").hidden === false, "New example run should open the runs view");

elements.get("setupShortcut").click();
elements.get("sourceSelect").value = "playwright";
elements.get("sourceSelect").dispatchEvent({ type: "change", target: elements.get("sourceSelect") });
elements.get("createSetupConfigButton").click();
assert(elements.get("adminPanel").hidden === false, "Creating a setup config should open Admin");
assert(elements.get("adminCatalogPanel").hidden === true, "Catalog should hide while a selected connector is open");
assert(elements.get("adminDetailStage").hidden === false, "Detail workspace should open for the selected connector");
assert(elements.get("adminSelectedHeader").innerHTML.includes("Playwright"), "Selected connector workspace should show the active connector");
assert(elements.get("adminBasicsPanel").innerHTML.includes("Playwright"), "Admin should open on the newly created source config");
assert(elements.get("adminEditModeButton").className.includes("active"), "Setup-driven admin opening should land in edit mode");
assert(elements.get("adminEditActions").hidden === false, "Edit actions should be visible in edit mode");
assert(elements.get("setupConfigStatus").innerHTML.includes("Connector config"), "Setup config status should stay renderable after creating a config");

elements.get("adminViewModeButton").click();
assert(elements.get("adminViewModeButton").className.includes("active"), "Admin should switch back to read-only mode");
assert(elements.get("adminEditActions").hidden === true, "Edit actions should hide in read-only mode");
assert(elements.get("adminPersistencePanel").innerHTML.includes("Switch to"), "Read-only mode should explain how to edit persistence settings");

elements.get("backToConnectorCatalogButton").click();
assert(elements.get("adminCatalogPanel").hidden === false, "Back should return to the connector catalog");
assert(elements.get("adminDetailStage").hidden === true, "Back should hide the selected connector workspace");

console.log("frontend smoke test passed");
