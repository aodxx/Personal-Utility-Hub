---
name: privacy-first-utility-expansion
description: Add, review, test, document, and safely release browser-based utility tools in a privacy-first/local-only PWA. Use for extending Personal Utility Hub or a similar static TypeScript app with new text, data, file, image, security, developer, or accessibility tools that must avoid backend uploads, follow lazy-loading contracts, support desktop/mobile, and pass release quality gates.
---

# Privacy-First Utility Expansion

## Overview

Use this skill to turn a utility idea into a production-ready client-side tool without weakening the host application’s privacy, lifecycle, bundle, accessibility, or release contracts. Follow the workflow in order, keep user data in browser memory only, and leave an auditable trail in tests and release documentation.

## Workflow decision tree

1. **Is the target repository already specified?** Open the existing project and inspect its actual architecture before planning implementation. Do not scaffold a new project when the user has supplied an existing repository.
2. **Does the tool process large files, PDFs, images, audio, or CPU-heavy data?** Use a dedicated Worker plus a tested main-thread fallback, progress reporting, cancellation, and cleanup. Do not claim Worker support if the implementation is main-thread-only.
3. **Is the tool text, JSON, color, JWT decoding, or another small synchronous utility?** Keep the core logic pure and testable; use the main thread unless profiling proves that a Worker is necessary.
4. **Does the tool need a browser API or permission?** Define the permission boundary explicitly, request it only after a user action, and release resources on success, error, cancel, route change, and unmount.
5. **Will a new tool change counts, search results, cache versions, or asset registries?** Update affected regression assertions and release metadata in the same change.

## Required implementation workflow

### 1. Inspect before editing

Read the repository README, package scripts, tool contract, registry, representative modules, shared UI helpers, styles, guides, localization, taxonomy, PWA/offline code, and relevant tests. Record the current branch, upstream, working-tree state, package version, tool counts, and existing quality commands. Do not overwrite unrelated user changes.

Use the host project’s existing patterns. A normal active tool should have:

| Contract | Requirement |
|---|---|
| Module | `metadata.ts` and `index.ts`, exporting `mount`, `unmount`, and `metadata` |
| Metadata | Valid kebab-case ID, route, category, tags, processing mode, offline/file flags, active status, semantic version |
| Registry | Static metadata import plus dynamic lazy `load()` entry |
| UI | Shared panel/actions/status helpers, visible labels, keyboard reachability, mobile-safe layout |
| Guide | Typed bilingual guide covering overview, inputs, outputs, steps, limitations, privacy, FAQ, and tips |
| Privacy | No file/content upload, no user-file persistence in LocalStorage/IndexedDB, and honest limitations |
| Cleanup | Remove listeners and abort/terminate active work in `unmount()` |

### 2. Define the privacy and processing contract

Write down what the tool reads, where it processes data, what it stores, and what it exports. Treat `local-only` as a behavior that must be verified in source and tests, not as a marketing phrase. Never add analytics, telemetry, remote JWK fetching, cloud conversion, or runtime upload for user content unless the user explicitly changes the privacy requirement.

For security-sensitive tools, expose the boundary in the UI. For example, a JWT decoder must say that decoding is not signature verification; a hash tool must say that a hash is not encryption; a color checker must say that a contrast pass is not a full accessibility audit.

### 3. Design the user flow

Use the host design system and a consistent workbench structure:

`Tool header → privacy badge → input/editor → options → primary action → result card → status/guide`

Use a two-column input/result layout on desktop and a single-column `input → options → action → result` layout on mobile. Preserve visible focus rings, minimum 44 px touch targets, `aria-live="polite"` for result/status updates, explicit labels, and non-color-only status cues. Respect `prefers-reduced-motion` and avoid horizontal overflow.

Prefer safe, reversible actions. Keep original text/files unchanged, show previews before export, separate `MATCH`/`MISMATCH` or `PASS`/`FAIL` from raw values, and provide reset/cancel actions when the operation can take time.

### 4. Implement pure core logic first

Put parsing, validation, transformation, and formatting in `src/core/` when the logic can be tested independently of the DOM. Make limits explicit and deterministic. Reject malformed input with actionable bilingual or source-language errors. Guard loops, recursion, input length, file bytes, pixel counts, and output sizes before expensive work.

For Web Crypto or browser-only APIs, keep a small pure wrapper and test known vectors. For file work, prefer the existing processing client/protocol rather than inventing a second worker mechanism. If the worker protocol changes, update the payload/result maps, fallback dispatch, worker dispatch, and public client helper together.

### 5. Build the module and lifecycle

Create the module with delegated actions where practical. Use `textContent` for user-derived output; never interpolate untrusted input into HTML. Keep module state local to the module, invalidate stale async requests with an operation ID, abort active jobs on reset/unmount, revoke object URLs, close ImageBitmaps/AudioContexts, stop MediaStreams, and remove every listener added during mount.

Add a static sample only when it is safe and representative. Never use a real credential, private token, personal file, or production secret as sample data.

### 6. Integrate all catalogs and assets

Update the lazy registry, file taxonomy when appropriate, bilingual guide catalog, English localization map, icon ID registry, self-hosted SVG sprite, and PWA/offline cache namespace. Add `prepareOffline` only when the tool actually needs additional same-origin assets, such as a processing worker. Do not add unnecessary worker preparation to lightweight main-thread tools.

If the static catalog or guides increase the entry bundle, measure it and adjust the budget only with a documented reason. Prefer reducing unnecessary static payload before raising a gate.

### 7. Add tests before declaring completion

Add unit tests for pure logic and integration tests for the registry/module contract. Add functional Playwright tests for every new tool covering route load, local notice, primary action, successful result, error path where meaningful, download/copy/preview behavior, and no-overflow checks. Run the workflow on Desktop Chromium and the configured Android profiles. Update existing exact-count/search/PWA assertions instead of weakening them.

For security/privacy review, search new code for network calls, storage writes, remote asset URLs, token fetches, and unsafe `innerHTML`. Verify that UI warnings match the implementation. Test unmount or route transitions for tools with async work or permissions.

### 8. Update release documentation

Update the package version, README catalog, progress/milestone record, test report, and a concise code-review report. Record the actual command results, tool/module counts, bundle numbers, intentional skips, known limitations, and any changed budget. Do not claim production deployment, GitHub Actions success, or a remote push unless it was actually verified.

## Quality gate

Run the project’s exact scripts. For Personal Utility Hub, the standard sequence is:

```bash
npm run typecheck
npm test -- --run
npm run build
npm run check:bundle
npm run check:registry
npm run check:svg-library
npm run test:e2e
npm audit --audit-level=high
node --check public/sw.js
git diff --check
```

Treat failures as findings. Fix the implementation or the affected contract; do not silently skip a failing test. If a test harness uses a stale `dist`, rebuild before rerunning preview-based E2E. Save the final counts and measurements in the test report.

## Safe Git release workflow

Use a repository-local identity when the user does not want a personal name:

```bash
git config user.name "Personal Utility Hub Bot"
git config user.email "personal-utility-hub-bot@localhost"
```

Before committing, inspect staged and unstaged changes:

```bash
git status -sb
git diff --check
git diff --stat
git diff --cached --check
```

Stage only after review, then create an explicit release commit. Before pushing, fetch the remote and compare histories:

```bash
git add -A
git commit -m "feat: add <release scope>"
git fetch origin
git status -sb
git rev-list --left-right --count HEAD...origin/main
```

If the remote has advanced, do not overwrite it and do not use force push. Rebase the local release onto the current `origin/main`, resolve conflicts deliberately, rerun the relevant tests, and verify the resulting commit. If histories are already aligned for a fast-forward, push normally:

```bash
git push origin HEAD:main
```

After pushing, verify both local and remote state:

```bash
git status -sb
git log -1 --oneline --decorate
git ls-remote origin refs/heads/main
```

Report the final commit SHA, branch, remote result, whether the working tree is clean, and any archive/checksum paths. Never use `git push --force` for this workflow.

## Completion report format

Deliver a concise summary followed by a table containing:

| Field | Value |
|---|---|
| Release | Version and scope |
| Tools | IDs and routes |
| Privacy | Local processing/storage boundary |
| Validation | Typecheck, unit, E2E, build, bundle, registry, audit |
| Git | Commit SHA, branch, push status |
| Limitations | Honest known constraints |

Attach the final test report and code-review report when they exist. If the user requested a reusable skill, deliver this `SKILL.md` path so the skill package can be added or downloaded.
