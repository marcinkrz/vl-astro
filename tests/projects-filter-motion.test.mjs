import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../src/components/ProjectsTagFilter.astro", import.meta.url), "utf8");
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import\s+[^;]+;/, "");
const code = stripTypeScriptTypes(script);

function element(properties = {}) {
  const classes = new Set();
  const attributes = new Map();
  return {
    hidden: false,
    dataset: {},
    ...properties,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
    getAttribute(name) { return attributes.get(name) ?? null; },
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
    getBoundingClientRect() { return { top: 0, left: 0, bottom: 200, right: 200 }; },
    addEventListener(type, callback) {
      if (type === "click") this.onClick = callback;
    },
  };
}

function setup() {
  const one = element({ dataset: { filterTag: "one", clearLabel: "Clear one" } });
  const two = element({ dataset: { filterTag: "two", clearLabel: "Clear two" } });
  const firstCard = element({ dataset: { projectTags: '["one"]' } });
  const secondCard = element({ dataset: { projectTags: '["two"]' } });
  firstCard.classList.add("is-revealed");
  secondCard.classList.add("is-revealed");
  const buttons = [one, two];
  const cards = [firstCard, secondCard];
  const group = element();
  const listeners = new Map();
  const animations = [];
  const document = {
    documentElement: { classList: { contains: (name) => name === "reveal-on-scroll" } },
    querySelector: (selector) => (selector === "[data-filter-group]" ? group : null),
    addEventListener: (name, callback) => listeners.set(name, callback),
    querySelectorAll(selector) {
      if (selector === "[data-filter-tag]") return buttons;
      if (selector === "[data-project-card]") return cards;
      return [];
    },
  };
  const context = {
    document,
    window: {},
    innerHeight: 800,
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: (callback) => callback(),
    history: { state: null, replaceState() {} },
    location: { href: "http://localhost/projects", search: "" },
    URL,
    URLSearchParams,
    animate: (target, keyframes, options) => animations.push({ target, keyframes, options }),
    inView: () => () => {},
  };
  runInNewContext(code, context);
  listeners.get("astro:page-load")();
  return { one, two, firstCard, secondCard, animations };
}

test("removes Tailwind motion classes and the fixed filter height", () => {
  assert.doesNotMatch(source, /motion-opacity|motion-translate|motion-delay/);
  assert.doesNotMatch(source, /grid-template-rows/);
});

test("animates each visible filter top-down in 300ms", () => {
  const app = setup();
  const intro = app.animations.filter(({ target }) => target === app.one || target === app.two);
  assert.equal(intro.length, 2);
  assert.equal(intro[0].keyframes.y[0], "1rem");
  assert.equal(intro[0].options.duration, 0.3);
  assert.equal(intro[0].options.delay, 0.1);
  assert.equal(intro[1].options.delay, 0.14);
});

test("animates a card again when clearing a filter reveals it", () => {
  const app = setup();
  app.one.onClick();
  assert.equal(app.secondCard.hidden, true);
  assert.equal(app.secondCard.classList.contains("is-revealed"), false);

  const beforeReset = app.animations.length;
  app.one.onClick();
  assert.equal(app.secondCard.hidden, false);
  assert.equal(app.secondCard.classList.contains("is-revealed"), true);
  assert.ok(
    app.animations.slice(beforeReset).some(
      ({ target, keyframes }) => target === app.secondCard && keyframes.y?.[0] === "1rem" && keyframes.opacity?.[0] === 0,
    ),
    "the newly visible card should animate in",
  );
});
