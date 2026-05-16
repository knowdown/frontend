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

[
  "historyList",
  "templateList",
  "messageStream",
  "connectorList",
  "connectorFocus",
  "providerGrid",
  "policyList",
  "overviewStrip",
  "insightGrid",
  "timelineList",
  "chatTitle",
  "chatMeta",
  "profileValue",
  "sourceValue",
  "stageValue",
  "nextActionValue",
  "composerInput",
  "newChatButton",
  "sendButton",
  "attachContextButton",
  "historyToggle",
  "connectorToggle",
  "historyPanel",
  "connectorPanel",
  "secretBindings",
  "playbookRegistry",
  "routingMatrix",
  "workflowBindings",
  "chainGraph",
  "runBoard",
  "decisionTrace",
  "failureHeatmap",
  "threadsPanel",
  "profilesPanel",
  "adminPanel",
  "playbooksPanel",
  "observabilityPanel",
  "playbooksShortcut",
  "observabilityShortcut",
  "profilesShortcut",
  "adminShortcut",
  "launchRunButton",
  "exportBriefButton",
  "pauseRunButton",
  "profileRegistry",
  "profileFocus",
  "profileValidationGrid",
  "profileOutputList",
  "adminConnectorCatalog",
  "adminConnectorSummary",
  "runtimeModeSelector",
  "mcpFabricList",
  "toolMappingList",
  "adminEnvBindings",
  "writebackPolicyList",
  "adminSpecList",
  "connectSourceAdapterButton",
  "switchProfileButton",
  "contextDiagnosticsButton",
  "threadsTab",
  "profilesTab",
  "adminTab",
  "playbooksTab",
  "observabilityTab",
].forEach((id) => createById(id, id.endsWith("Button") || id.endsWith("Shortcut") || id.endsWith("Tab") || id === "newChatButton" || id === "sendButton" || id === "attachContextButton" || id === "historyToggle" || id === "connectorToggle" ? "button" : "div"));

const globalSearch = createElement("globalSearch", "div");
const globalSearchInput = createElement("globalSearchInput", "input");
globalSearch.appendChild(globalSearchInput);

const filterAll = createElement("filterAll", "button");
filterAll.dataset.filter = "all";
filterAll.classList.add("filter-chip", "active");
const filterAssigned = createElement("filterAssigned", "button");
filterAssigned.dataset.filter = "assigned";
filterAssigned.classList.add("filter-chip");
const filterWatching = createElement("filterWatching", "button");
filterWatching.dataset.filter = "watching";
filterWatching.classList.add("filter-chip");
const filterChips = [filterAll, filterAssigned, filterWatching];

elements.get("threadsTab").dataset.view = "threads";
elements.get("threadsTab").classList.add("workspace-tab", "active");
elements.get("profilesTab").dataset.view = "profiles";
elements.get("profilesTab").classList.add("workspace-tab");
elements.get("adminTab").dataset.view = "admin";
elements.get("adminTab").classList.add("workspace-tab");
elements.get("playbooksTab").dataset.view = "playbooks";
elements.get("playbooksTab").classList.add("workspace-tab");
elements.get("observabilityTab").dataset.view = "observability";
elements.get("observabilityTab").classList.add("workspace-tab");

const workspaceTabs = [
  elements.get("threadsTab"),
  elements.get("profilesTab"),
  elements.get("adminTab"),
  elements.get("playbooksTab"),
  elements.get("observabilityTab"),
];

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
    if (selector === ".filter-chip") {
      return filterChips;
    }
    if (selector === ".workspace-tab") {
      return workspaceTabs;
    }
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

assert(elements.get("chatTitle").textContent.includes("Deliver"), "Expected default active thread to render");

elements.get("profilesShortcut").click();
assert(elements.get("profilesPanel").hidden === false, "Profiles panel should open from shortcut");

const profileCards = elements.get("profileRegistry").children;
assert(profileCards.length >= 3, "Expected rendered profile cards");
profileCards[1].click();
assert(elements.get("profileFocus").innerHTML.includes("Story"), "Story profile should become active");

elements.get("newChatButton").click();
assert(elements.get("chatTitle").textContent.toLowerCase().includes("story"), "New chat should inherit active profile");

elements.get("switchProfileButton").click();
assert(elements.get("profilesPanel").hidden === false, "Switch profile CTA should show profiles panel");

elements.get("playbooksShortcut").click();
assert(elements.get("playbooksPanel").hidden === false, "Playbooks panel should open from shortcut");

elements.get("adminShortcut").click();
assert(elements.get("adminPanel").hidden === false, "Admin panel should open from shortcut");
assert(elements.get("adminConnectorCatalog").children.length >= 1, "Expected rendered admin connector profiles");
assert(elements.get("runtimeModeSelector").children.length >= 1, "Expected rendered runtime modes");

elements.get("connectSourceAdapterButton").click();
assert(elements.get("adminPanel").hidden === false, "Connect source CTA should route to the admin workspace");
assert(elements.get("toolMappingList").children.length >= 1, "Admin workspace should render tool mappings");

elements.get("observabilityShortcut").click();
assert(elements.get("observabilityPanel").hidden === false, "Observability panel should open from shortcut");

globalSearchInput.value = "architect review";
globalSearchInput.dispatchEvent({ type: "input", target: globalSearchInput });
assert(elements.get("playbookRegistry").innerHTML.includes("Story Delivery") || elements.get("playbookRegistry").children.length > 0, "Search should preserve matching playbooks");

filterAssigned.click();
assert(elements.get("historyList").children.length >= 1, "Assigned filter should still render matching chats");

elements.get("threadsTab").click();
assert(elements.get("threadsPanel").hidden === false, "Threads tab should return to threads view");

const firstTemplate = elements.get("templateList").children[0];
assert(firstTemplate, "Expected at least one visible template");
firstTemplate.click();
assert(elements.get("chatTitle").textContent.length > 0, "Template click should activate a thread");

elements.get("exportBriefButton").click();
assert(elements.get("composerInput").value.includes("Thread:"), "Export brief should insert a summary into the composer");

elements.get("pauseRunButton").click();
assert(elements.get("messageStream").children.length >= 1, "Pause run should append a system note");

elements.get("launchRunButton").click();
assert(elements.get("messageStream").children.length >= 1, "Launch run should keep thread interaction healthy");

elements.get("contextDiagnosticsButton").click();
assert(elements.get("connectorPanel").classList.contains("open"), "Context diagnostics CTA should open the connector panel");

console.log("frontend smoke test passed");
