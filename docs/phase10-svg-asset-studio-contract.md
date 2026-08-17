# SVG Asset Studio — Product Contract

**สถานะก่อน implementation:** Active tool candidate; final statusจะตัดสินหลัง integrity, security, full regression และ production smoke gates

## User job

ผู้ใช้ต้องการค้นหา SVG ที่มี source/license evidence, preview หลายพื้นหลังและขนาด, ตรวจ technical/accessibility/security properties, แก้ไขอย่างปลอดภัย, optimize, copy code หลายรูปแบบ, export SVG/PNG และสร้าง icon pack ที่มี sprite, CSS, manifest และ license report ภายใน browser โดยไม่อัปโหลดไฟล์

## Inputs and limits

| Input | Supported behavior | Guard |
|---|---|---|
| Curated library | Lightweight metadata manifest; SVG source fetched from local deployment assets only | No remote runtime fetch; asset integrity check |
| Uploaded SVG | One SVG at a time for inspect/edit/sanitize/export | Maximum 2 MB, maximum 4,000 elements, maximum 1,000 paths |
| Batch/pack | Selected curated or sanitized uploaded assets | Maximum 40 assets and 8 MB combined sanitized SVG bytes |
| PNG export | 16–512 px or custom size with 1×/2×/3× scale | Maximum 2048 output pixels per side and 16 MP total pixels |

## Workflow

`Library → Preview → Inspect → Edit → Fix/Optimize → Copy/Export → Pack Builder`

The UI provides search by title, keywords and category, non-empty category filters, style/property/license filters, local favorites/recent state, an editor panel, review status, and pack selection. Mobile uses a readable two-column grid and step-based editor navigation; desktop presents library, preview and inspector/editor in a three-column layout when space allows.

## Security contract

All uploaded SVG is parsed as text and sanitized before preview or export. The sanitizer removes or rejects `script`, `iframe`, unsafe `foreignObject`, event handler attributes, `javascript:` URLs, external references, unsafe CSS URLs and executable-looking embedded content. Raw untrusted SVG is never inserted into the DOM before sanitization. Malformed XML, excessive nodes/path data, and over-limit bytes fail with actionable status.

## Inspector contract

The inspector reports viewBox, width, height, path/group counts, fills, strokes, stroke width, currentColor usage, title/description, file size, embedded style, scripts, external references, accessibility hints, complexity guards and a transparent technical status of `PASS`, `WARNING`, or `FAIL`. The derived metric is called **SVG Technical Score** and is explicitly not a complete or objective quality certification.

## Editor and optimizer contract

The editor supports preserve colors, single color, currentColor conversion when the SVG is monochrome, width/height, rotation, horizontal/vertical flip, padding, background and opacity. The Fix SVG action can sanitize, remove fixed dimensions, normalize a valid viewBox, remove comments/metadata and minify whitespace. Optimizer presets are Safe, Balanced and Aggressive; Safe is default and Aggressive has a warning. Before/after bytes and a change summary are shown before export.

## Output contract

The tool exports sanitized/edited SVG, PNG at explicit dimensions, raw SVG, HTML `<svg>`, Data URI, CSS background-image, CSS mask, optional JSX snippet, and selected icon packs. A pack contains `svg/`, optional `png/`, `sprite.svg`, `icons.css`, `manifest.json`, and `LICENSES.txt`. The tool verifies output signatures, dimensions, unique names, symbol IDs, manifest metadata and license records before download.

## Privacy and persistence

Parsing, sanitizing, editing, optimization, hashing, PNG rendering and ZIP assembly occur locally. Uploaded SVG bytes are not stored in localStorage. Favorites, recent IDs and selected pack IDs plus edit parameters may be stored locally; no telemetry, account, analytics, or upload is introduced. Curated library assets use local static files and may be cached on demand by the existing PWA strategy.

## Failure behavior

Unsupported or malformed SVG, unsafe markup, excessive complexity, invalid editor values, failed PNG rendering, duplicate pack names, missing license metadata and ZIP verification failures must show actionable messages. Copy actions provide visible feedback. Drag is never the only interaction; buttons, keyboard controls and explicit focusable controls are required.

## Acceptance

Phase 10 is accepted only when the curated library has at least 100 real self-created assets with complete metadata, the library integrity command passes, malicious SVG fixtures are removed or blocked, unit tests verify parser/sanitizer/editor/optimizer/export/pack behavior, Playwright verifies the end-to-end workflow with real outputs, mobile 360×740 and 412×915 have no horizontal overflow, desktop 1280×900 remains usable, full Phase 6–9 regression passes, bundle and repository footprint are documented, CI and Pages deploy pass on the implementation HEAD, and production smoke verifies search, preview, inspector, edit, optimize, copy, export, favorite, pack, upload and security behavior.
