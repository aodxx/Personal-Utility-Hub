# LINE Sticker Requirements Research Notes

**Verified date:** 17 August 2026

## Official sources

1. [LINE Creators Market — Creation Guidelines for Stickers](https://creator.line.me/en/guideline/sticker/)
2. [LINE Creators Market — Creation Guidelines for Animated Stickers](https://creator.line.me/en/guideline/animationsticker/)
3. [LINE Creators Market — Review Guidelines](https://creator.line.me/en/review_guideline/)

## Static stickers

The official static sticker page states that the main image is 1 image at 240 × 240 px; sticker images are 8, 16, 24, 32, or 40 images, each up to 370 × 320 px; and the chat thumbnail icon is 1 image at 96 × 74 px. All submitted images must be PNG, should use even-numbered width and height, at least 72 dpi, RGB color mode, and a maximum of 1 MB per image. A single ZIP submission must be 60 MB or smaller. Image backgrounds must be transparent.

The page also recommends around 10 px margin between the trimmed image and surrounding content. Technical validation cannot determine whether content passes human review, including suitability, variety, advertising, personal-data requests, or prohibited content.

## Animated stickers

The official animated sticker page states that the main image is 240 × 240 PNG, animated sticker images are 8, 16, or 24 images up to 320 × 270 PNG/APNG, and the chat thumbnail icon is 96 × 74 PNG. Animated sticker dimensions must be within 320 × 270 px, with either width or height at least 270 px; when height is the longer side it should be exactly 270 px.

Each sticker may use 1–4 loops with combined length no more than 4 seconds, playback time up to 4 seconds, and 5–20 PNG frames per APNG. Animated files must use RGB color space, be no more than 1 MB each, and have transparent backgrounds. The first APNG frame is shown as the static preview in LINE Store and Sticker Shop. The chat thumbnail play symbol is added by LINE and must not be drawn into the source thumbnail.

## Implementation policy

Presets will be centralized in `src/data/line-sticker-presets.ts`. The application will label these as **verified technical presets**, not as a guarantee of approval. It will explicitly distinguish static PNG export from animated frame preparation. APNG export will remain partial unless the chosen client-side encoder and round-trip verification pass the project bundle and output-integrity gates.
