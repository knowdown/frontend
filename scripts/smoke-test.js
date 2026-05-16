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
  "setupSourceValue",
  "setupFlowValue",
  "setupPublishValue",
  "setupIntroList",
  "setupFocus",
  "setupSourceCatalog",
  "workTypeRegistry",
  "setupChecklistList",
  "setupConfigList",
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
  "historyToggle",
  "connectorToggle",
  "historyPanel",
  "connectorPanel",
  "setupPanel",
  "runsPanel",
  "monitorPanel",
  "setupTab",
  "runsTab",
  "monitorTab",
].forEach((id) => createById(
  id,
  id.endsWith("Button") ||
  id.endsWith("Shortcut") ||
  id.endsWith("Tab") ||
  id === "attachContextButton" ||
  id === "sendButton" ||
  id === "exportBriefButton" ||
  id === "pauseRunButton" ||
  id === "launchRunButton" ||
  id === "newRunButton" ||
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
elements.get("setupTab").classList.add("workspace-tab", "active");
elements.get("runsTab").dataset.view = "runs";
elements.get("runsTab").classList.add("workspace-tab");
elements.get("monitorTab").dataset.view = "monitor";
elements.get("monitorTab").classList.add("workspace-tab");
const workspaceTabs = [
  elements.get("setupTab"),
  elements.get("runsTab"),
  elements.get("monitorTab"),
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
    if (selector === ".workspace-tab") return workspaceTabs;
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
assert(elements.get("chatTitle").textContent.includes("Set up"), "Header should explain the setup-first experience");
assert(elements.get("setupIntroList").children.length >= 1, "Setup glossary should render");
assert(elements.get("setupSourceCatalog").children.length >= 1, "Source systems should render");
assert(elements.get("workTypeRegistry").children.length >= 1, "Flow templates should render");

const secondSource = elements.get("setupSourceCatalog").children[1];
assert(secondSource, "Expected a second source system");
secondSource.click();
assert(elements.get("setupSourceValue").textContent.length > 0, "Selecting a source should update setup banner");

const secondFlow = elements.get("workTypeRegistry").children[1];
assert(secondFlow, "Expected a second flow template");
secondFlow.click();
assert(elements.get("setupFlowValue").textContent.length > 0, "Selecting a flow should update setup banner");

elements.get("runsShortcut").click();
assert(elements.get("runsPanel").hidden === false, "Runs view should open from shortcut");
assert(elements.get("runSummaryList").children.length >= 1, "Run summary should render");
assert(elements.get("messageStream").children.length >= 1, "Run thread should render");

elements.get("attachContextButton").click();
assert(elements.get("composerInput").value.includes("Run context:"), "Attach context should enrich notes");

const previousMessages = elements.get("messageStream").children.length;
elements.get("sendButton").click();
assert(elements.get("messageStream").children.length >= previousMessages, "Adding a note should keep thread healthy");

elements.get("monitorShortcut").click();
assert(elements.get("monitorPanel").hidden === false, "Monitor view should open");
assert(elements.get("runBoard").children.length >= 1, "Monitor runs should render");

globalSearchInput.value = "Architect approval";
globalSearchInput.dispatchEvent({ type: "input", target: globalSearchInput });
assert(elements.get("runBoard").children.length >= 1 || elements.get("historyList").children.length >= 1, "Search should preserve matching content");

globalSearchInput.value = "";
globalSearchInput.dispatchEvent({ type: "input", target: globalSearchInput });
filterRunning.click();
assert(elements.get("historyList").children.length >= 1, "Run filter should keep matching runs");

const beforeNewRunCount = elements.get("historyList").children.length;
elements.get("newRunButton").click();
assert(elements.get("historyList").children.length >= beforeNewRunCount, "Starting from an example should keep runs populated");
assert(elements.get("runsPanel").hidden === false, "New example run should open the runs view");

elements.get("contextDiagnosticsButton").click();
assert(elements.get("connectorPanel").classList.contains("open"), "Help panel should open from the runs view");

console.log("frontend smoke test passed");
