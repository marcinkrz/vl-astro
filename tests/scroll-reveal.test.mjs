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
    getAnimations: () => [],
  };
}

function setup({ reduced = false, supported = true, top = 0 } = {}) {
  const listeners = new Map();
  const element = root();
  element.getBoundingClientRect = () => ({ top, bottom: top + 200, left: 0, right: 200 });
  const observations = [];
  const animations = [];
  let stopped = 0;
  const document = {
    documentElement: root(),
    querySelectorAll: (selector) =>
      selector.includes(":not(.is-revealed)") && element.classList.contains("is-revealed") ? [] : [element],
    addEventListener: (name, callback) => listeners.set(name, callback),
  };
  const context = {
    document,
    window: supported ? { IntersectionObserver: class {} } : {},
    innerHeight: 800,
    matchMedia: () => ({ matches: reduced }),
    getComputedStyle: () => ({
      getPropertyValue: (name) => (name === "--reveal-y" ? "1rem" : name === "--reveal-delay" ? "50ms" : ""),
    }),
    inView(elements, callback) {
      observations.push({ elements, callback });
      return () => { stopped++; };
    },
    animate(target, keyframes, options) {
      animations.push({ target, keyframes, options });
    },
  };
  runInNewContext(inline, context);
  runInNewContext(code, context);
  return {
    document, element, observations, animations,
    emit: (name, event = {}) => listeners.get(name)?.(event),
    stopped: () => stopped,
  };
}

test("prepare the incoming root before an Astro page swap", () => {
  const app = setup({ top: 900 });
  app.emit("astro:page-load");
  const nextRoot = root();
  app.emit("astro:before-swap", { newDocument: { documentElement: nextRoot } });
  assert.equal(nextRoot.classList.contains("reveal-on-scroll"), true);
  assert.equal(app.stopped(), 1);
});

test("animate an above-fold element once on page load", () => {
  const app = setup();
  app.emit("astro:page-load");
  assert.equal(app.element.classList.contains("is-revealed"), true);
  assert.equal(app.observations.length, 0);
  assert.equal(app.animations.length, 1);
  const [{ keyframes, options }] = app.animations;
  assert.equal(keyframes.opacity[0], 0);
  assert.equal(keyframes.opacity[1], 1);
  assert.equal(keyframes.y[0], "1rem");
  assert.equal(keyframes.y[1], 0);
  assert.equal(options.delay, 0);

  app.emit("astro:page-load");
  assert.equal(app.animations.length, 1, "a repeated page-load must not restart the animation");
});

test("reveal a below-fold element only when it enters the viewport", () => {
  const app = setup({ top: 900 });
  app.emit("astro:page-load");
  assert.equal(app.element.classList.contains("is-revealed"), false);
  assert.equal(app.animations.length, 0);
  assert.equal(app.observations.length, 1);
  app.observations[0].callback(app.element);
  assert.equal(app.element.classList.contains("is-revealed"), true);
  assert.equal(app.animations.length, 1);
});

test("replace the observer after navigation without duplicate subscriptions", () => {
  const app = setup({ top: 900 });
  app.emit("astro:page-load");
  app.emit("astro:before-swap", { newDocument: { documentElement: root() } });
  app.emit("astro:page-load");
  assert.equal(app.stopped(), 1);
  assert.equal(app.observations.length, 2);
});

test("wait for the page transition before starting navigation reveals", async () => {
  const app = setup();
  let finish;
  const finished = new Promise((resolve) => { finish = resolve; });
  app.emit("astro:before-swap", {
    newDocument: { documentElement: root() },
    viewTransition: { finished },
  });
  app.emit("astro:page-load");
  assert.equal(app.animations.length, 0, "must not animate under the transition snapshot");
  finish();
  await finished;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(app.animations.length, 1);
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
