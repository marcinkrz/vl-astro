# Git and Branching Instructions

**When modifying code or documentation in this repository, follow these rules:**

- Target `dev` branch when creating Pull Requests. Do not push directly to production branches eg. `main`.
- Always pull the latest changes from `dev` before starting work.
- Create a new branch using the format `feature/agent-<description>` or `fix/agent-<description>`.
- Use clear, imperative commit messages (e.g., "Update agent instructions for clarity").

# Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

# Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

# Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

# Environment Guide

- The codebase is primarily TypeScript.
- Use `node -e` for scripting tasks, not `python` or `python3`.

# Astro Quick Reference

- Use `pnpm run dev` to start the local dev server with HMR. Do not use other web servers (`python -m http.server`, etc.).
- Use `pnpm run build` to create a production build in `dist/`, by default.
- Use `pnpm run preview` to serve the production build locally. Do not use other web servers (`python -m http.server`, etc.).
- Use `pnpm astro check` to run type checking and diagnostics.
- Use `pnpm astro sync` to generate and update TypeScript types.
- Use `pnpm astro add` to install and configure an official integration.
- Fetch **Full docs** at https://docs.astro.build/ (primary source for the latest reference).
