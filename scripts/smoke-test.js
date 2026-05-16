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
    if (value === "") {
      this.children = [];
    }
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

const ids = [
  "historyList",
  "templateList",
  "overviewStrip",
  "workspaceKicker",
  "chatTitle",
  "chatMeta",
  "profileValue",
  "sourceValue",
  "stageValue",
  "nextActionValue",
  "runSummaryList",
  "runDependencyList",
  "insightGrid",
  "timelineList",
  "runDecisionTrace",
  "messageStream",
  "runOutputList",
  "runApprovalList",
  "runConnectorBindings",
  "runArtifactList",
  "workTypeRegistry",
  "workTypeFocus",
  "workTypeRouting",
  "workTypePlaybooks",
  "onboardingList",
  "configSourceList",
  "publishChecklist",
  "adminConnectorCatalog",
  "adminConnectorSummary",
  "runtimeModeSelector",
  "mcpFabricList",
  "toolMappingList",
  "adminEnvBindings",
  "writebackPolicyList",
  "adminSpecList",
  "playbookRegistry",
  "routingMatrix",
  "workflowBindings",
  "chainGraph",
  "secretCatalog",
  "configSourceMatrix",
  "runBoard",
  "decisionTrace",
  "failureHeatmap",
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
  "openBuildConnectorsButton",
  "operateShortcut",
  "buildShortcut",
  "observabilityShortcut",
  "historyToggle",
  "connectorToggle",
  "historyPanel",
  "connectorPanel",
  "operatePanel",
  "buildPanel",
  "observabilityPanel",
  "operateOverviewPanel",
  "operateTimelinePanel",
  "operateThreadPanel",
  "operateArtifactsPanel",
  "buildWorkTypesPanel",
  "buildOnboardingPanel",
  "buildConnectorsPanel",
  "buildPlaybooksPanel",
  "buildSecretsPanel",
  "operateTab",
  "buildTab",
  "observabilityTab",
].map((id) => ({
  id,
  tagName: (
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
    id === "openBuildConnectorsButton" ||
    id === "historyToggle" ||
    id === "connectorToggle"
  ) ? "button" : "div",
}));

ids.forEach(({ id, tagName }) => createById(id, tagName));

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

elements.get("operateTab").dataset.view = "operate";
elements.get("operateTab").classList.add("workspace-tab", "active");
elements.get("buildTab").dataset.view = "build";
elements.get("buildTab").classList.add("workspace-tab");
elements.get("observabilityTab").dataset.view = "observability";
elements.get("observabilityTab").classList.add("workspace-tab");
const workspaceTabs = [
  elements.get("operateTab"),
  elements.get("buildTab"),
  elements.get("observabilityTab"),
];

const operateSubviewNames = ["overview", "timeline", "thread", "artifacts"];
const operateSubviewTabs = operateSubviewNames.map((name, index) => {
  const element = createElement(`operateSubview-${name}`, "button");
  element.dataset.operateView = name;
  element.classList.add("subview-tab");
  if (index === 0) element.classList.add("active");
  return element;
});

const buildSubviewNames = ["workTypes", "onboarding", "connectors", "playbooks", "secrets"];
const buildSubviewTabs = buildSubviewNames.map((name, index) => {
  const element = createElement(`buildSubview-${name}`, "button");
  element.dataset.buildView = name;
  element.classList.add("subview-tab");
  if (index === 0) element.classList.add("active");
  return element;
});

const documentStub = {
  getElementById(id) {
    return elements.get(id) || null;
  },
  querySelector(selector) {
    if (selector === ".global-search input") {
      return globalSearchInput;
    }
    return null;
  },
  querySelectorAll(selector) {
    if (selector === ".filter-chip") return filterChips;
    if (selector === ".workspace-tab") return workspaceTabs;
    if (selector === ".subview-tab[data-operate-view]") return operateSubviewTabs;
    if (selector === ".subview-tab[data-build-view]") return buildSubviewTabs;
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

const appDataPath = path.join(__dirname, "..", "app-data.js");
const appPath = path.join(__dirname, "..", "app.js");
vm.runInContext(fs.readFileSync(appDataPath, "utf8"), context, { filename: "app-data.js" });
vm.runInContext(fs.readFileSync(appPath, "utf8"), context, { filename: "app.js" });

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(elements.get("operatePanel").hidden === false, "Operate panel should be visible on load");
assert(elements.get("chatTitle").textContent.includes("kd-run-184"), "Initial header should point at the active run");
assert(elements.get("workTypeRegistry").children.length >= 1, "Work types should render");

elements.get("buildShortcut").click();
assert(elements.get("buildPanel").hidden === false, "Build panel should open from shortcut");
assert(elements.get("workTypeFocus").innerHTML.includes("Defect Delivery"), "Initial work type focus should render");

const secondWorkType = elements.get("workTypeRegistry").children[1];
assert(secondWorkType, "Expected a second work type card");
secondWorkType.click();
assert(elements.get("workTypeFocus").innerHTML.includes("Story Delivery"), "Selecting a work type should update focus");

buildSubviewTabs[2].click();
assert(elements.get("buildConnectorsPanel").hidden === false, "Connector subview should open");
assert(elements.get("adminConnectorCatalog").children.length >= 1, "Connector catalog should render");
assert(elements.get("runtimeModeSelector").children.length >= 1, "Runtime modes should render");

elements.get("operateShortcut").click();
assert(elements.get("operatePanel").hidden === false, "Operate panel should reopen");
operateSubviewTabs[2].click();
assert(elements.get("operateThreadPanel").hidden === false, "Thread subview should open");

elements.get("attachContextButton").click();
assert(elements.get("composerInput").value.includes("Run context:"), "Attach context should enrich the composer");

const previousMessages = elements.get("messageStream").children.length;
elements.get("sendButton").click();
assert(elements.get("messageStream").children.length >= previousMessages, "Thread send should keep message rendering healthy");

elements.get("connectSourceAdapterButton").click();
assert(elements.get("buildPanel").hidden === false, "Connector onboarding CTA should route to Build");
assert(elements.get("buildConnectorsPanel").hidden === false, "Connector onboarding CTA should open connector subview");

elements.get("observabilityShortcut").click();
assert(elements.get("observabilityPanel").hidden === false, "Observability panel should open");
assert(elements.get("runBoard").children.length >= 1, "Run board should render");

globalSearchInput.value = "Architect approval";
globalSearchInput.dispatchEvent({ type: "input", target: globalSearchInput });
assert(elements.get("runBoard").children.length >= 1 || elements.get("playbookRegistry").children.length >= 1, "Search should preserve matching content");

globalSearchInput.value = "";
globalSearchInput.dispatchEvent({ type: "input", target: globalSearchInput });
filterRunning.click();
assert(elements.get("historyList").children.length >= 1, "Run filter should preserve matching runs");

const beforeNewRunCount = elements.get("historyList").children.length;
elements.get("newRunButton").click();
assert(elements.get("historyList").children.length >= beforeNewRunCount, "Creating a run should keep the run rail populated");
assert(elements.get("chatTitle").textContent.includes("kd-run-"), "New run should update the selected run header");

elements.get("contextDiagnosticsButton").click();
assert(elements.get("connectorPanel").classList.contains("open"), "Diagnostics CTA should open the inspector");

console.log("frontend smoke test passed");
