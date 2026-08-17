# Phase 6 Production Evidence

**Commit under test:** `7ad9194f570d77e207b9a67f5cf2a21049b8847d`  
**CI:** [31993843182](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31993843182) — success  
**Pages deploy:** [31993843034](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31993843034) — success  
**Production URL:** https://aodxx.github.io/Personal-Utility-Hub/

## Initial checks

The production Hub loaded successfully and displayed the 25-tool catalog, category navigation, search, favorites, on-device badges, and offline preparation controls.

The production `#/privacy` route loaded successfully. It displayed the browser-processing flow, the local storage boundaries, the no-account/no-cloud/no-analytics wording, and the explicit statement that the product does not promise 100% safety or zero risk. The route included working navigation back to the Hub and a source-policy link.

Further category, guide, mobile, keyboard, history, sample, offline, and audio checks are recorded below as they are completed.

## Category 1 — Developer Tools

Production route `#/tools/json-formatter` loaded successfully. The route exposed a real `Try sample` button and the first-use `How to use` entry. Opening the dialog rendered explicit JSON-specific content: format/minify/validate behavior, JSON text and Unicode inputs, indented/minified output, parser-error limitations, and browser-local privacy wording. The dialog received focus on its close control and the screenshot showed a visible dialog focus outline.

## Category 2 — QR & Barcodes

Production route `#/tools/qr-reader` loaded successfully with the first-use panel, image input, and camera control. Opening `Read the guide` rendered QR-specific steps, supported image/camera inputs, decoded-text output, camera permission behavior, and limitations for small, blurry, tilted, reflective, or occluded codes. The guide explicitly stated that camera frames are decoded in-page and that the tool stops MediaStream tracks when leaving.

## Category 3 — Images

Production route `#/tools/image-compressor` loaded with file input, output-format selector, dimension selector, quality control, and process action. Its guide described before/after size metrics, supported image inputs, quality/dimension steps, browser processing, and the factual limitation that compression is lossy or format-dependent and is not promised lossless.

## Category 4 — PDF & Documents

Production route `#/tools/pdf-merge` loaded with multi-file input and merge action. The guide rendered PDF-specific behavior: selected-order page concatenation, file-count/byte limits, output PDF, malformed/encrypted/memory-heavy limitations, and the fact that source files are not modified. The page and guide both stated that processing occurs in the browser/Worker.

## Category 5 — Audio & Video

Production route `#/tools/audio-trimmer` loaded with audio input and the real trim/export action. Its guide matched the implementation: browser-decodable audio input, waveform start/end selection, optional fades, result preview, downloadable WAV, Worker/fallback processing, and memory/codec limitations. The FAQ distinguished in-page Preview from Export/Download WAV. The page also exposed the first-use guide panel and on-device processing notice.

## Accessibility and navigation observations

Across the inspected production routes, the skip link, focusable guide controls, close button, visible dialog focus outline, keyboard-oriented close affordance, and footer Privacy/Source links were present. The hash routes loaded directly, which supports refresh/deep-link behavior. Full back/forward and 360-pixel overflow checks remain recorded as local Playwright coverage and should be repeated if the deployed URL changes after this evidence commit.

## Reproducible mobile smoke result

The saved script `scripts/phase6-production-smoke.mjs` was run against the deployed Pages URL with a `360 × 740` viewport. All **9/9** checks passed: Privacy route, five tool-specific guide routes (Developer, QR, Images, PDF, Audio), no horizontal overflow, JSON Try Sample, and hash back/forward/refresh navigation. Guide dialogs were opened and closed with keyboard `Escape` in each category check.

## Audio production workflow

Using `/home/ubuntu/audio-test.wav` as a real browser-upload fixture, the production smoke script passed Audio Trimmer upload, editor mount, process, WAV result metadata, and WAV download. The downloaded filename matched the implemented `*-trimmed.wav` contract. This closes the previously unconfirmed Audio Trimmer production process/export gap for the deployed application.

The final reproducible run passed **10/10 checks** at `360 × 740`, including Privacy, five category guides, Audio Trimmer upload/process/export/download, no horizontal overflow, JSON sample, Escape close, and hash back/forward/refresh.
