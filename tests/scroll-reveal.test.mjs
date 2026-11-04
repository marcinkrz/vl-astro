import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const layout = readFileSync(new URL("../src/layouts/BaseLayout.astro", import.meta.url), "utf8");
const inline = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
const script = layout.match(/<script>([\s\S]*?)<\/script>/)[1];
const code = stripTypeScriptTypes(script.replace(/import\s+[^;]+;/g, ""));

function root() {
  const classes = new Set();
  return {
    classList: {
      add: (name) => classes.add(name),
      contains: (name) => classes.has(name),
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
    },
  };
}

function setup({ reduced = false, supported = true } = {}) {
  const listeners = new Map();
  const element = root();
  const observations = [];
  let stopped = 0;
  const document = {
    documentElement: root(),
    querySelectorAll: () => [element],
    addEventListener: (name, callback) => listeners.set(name, callback),
  };
  const context = {
    document,
    window: supported ? { IntersectionObserver: class {} } : {},
    matchMedia: () => ({ matches: reduced }),
    inView(elements, callback) {
      observations.push({ elements, callback });
      return () => { stopped++; };
    },
  };
  runInNewContext(inline, context);
  runInNewContext(code, context);
  return {
    document, element, observations,
    emit: (name, event = {}) => listeners.get(name)?.(event),
    stopped: () => stopped,
  };
}

test("prepare the incoming root before an Astro page swap", () => {
  const app = setup();
  app.emit("astro:page-load");
  const nextRoot = root();
  app.emit("astro:before-swap", { newDocument: { documentElement: nextRoot } });
  assert.equal(nextRoot.classList.contains("reveal-on-scroll"), true);
  assert.equal(app.stopped(), 1);
});

test("reveal only the element reported by the viewport observer", () => {
  const app = setup();
  app.emit("astro:page-load");
  assert.equal(app.document.documentElement.classList.contains("reveal-on-scroll"), true);
  assert.equal(app.element.classList.contains("is-in-view"), false);
  app.observations[0].callback(app.element);
  assert.equal(app.element.classList.contains("is-in-view"), true);
});

test("replace the observer after navigation without duplicate subscriptions", () => {
  const app = setup();
  app.emit("astro:page-load");
  app.emit("astro:before-swap", { newDocument: { documentElement: root() } });
  app.emit("astro:page-load");
  assert.equal(app.stopped(), 1);
  assert.equal(app.observations.length, 2);
});

for (const options of [{ reduced: true }, { supported: false }]) {
  test(`keep content unpaused without scroll reveals: ${JSON.stringify(options)}`, () => {
    const app = setup(options);
    app.emit("astro:page-load");
    assert.equal(app.document.documentElement.classList.contains("reveal-on-scroll"), false);
    assert.equal(app.observations.length, 0);
    const nextRoot = root();
    app.emit("astro:before-swap", { newDocument: { documentElement: nextRoot } });
    assert.equal(nextRoot.classList.contains("reveal-on-scroll"), false);
  });
}
