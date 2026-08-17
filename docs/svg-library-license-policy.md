# SVG Library License Policy

**Phase 10 policy:** the bundled SVG library uses assets authored for Personal Utility Hub and distributed under the project’s **Original — Utility Hub Asset License**. The library does not scrape, mirror, or redistribute third-party SVG files without a recorded permission and source record.

## Allowed sources

The library may include an asset only when it belongs to one of the following source classes:

| Source class | Allowed | Required evidence |
|---|---:|---|
| Original Utility Hub asset | Yes | `source`, `sourceUrl`, author, license policy reference |
| Public Domain / CC0 | Yes | Original source URL and license URL |
| MIT / Apache-2.0 / BSD or equivalent permissive license | Yes | Source URL, license URL, author when available, attribution decision |
| Unclear, scraped, or restricted asset | No | Asset must not enter the library |

Phase 10 starts with original assets so the repository can provide a useful curated collection without making an unsupported third-party licensing claim. A future third-party asset must pass the same metadata and integrity checks before inclusion.

## Required metadata

Every library manifest entry must include `id`, `title`, `keywords`, `category`, `source`, `author`, `license`, `licenseUrl`, `sourceUrl`, `attributionRequired`, `commercialUseAllowed`, and `modifiedAllowed`. The integrity check fails when any field is missing, when an ID or filename is duplicated, or when an asset contains unsafe markup.

## Original Utility Hub Asset License

For assets marked `Original — Utility Hub`, Personal Utility Hub grants permission to use, modify, copy, and redistribute the asset as part of an application, website, document, icon pack, or generated output. Attribution is not required for this asset class, although the generated `LICENSES.txt` records the source and policy for traceability. This policy applies to the SVG assets listed by the library manifest and does not grant rights to unrelated third-party content.

The source record for original assets is the repository path under `src/data/svg-assets/` or the generated manifest source field. The canonical policy URL used in metadata is the deployed project documentation path and the repository path to this file.

## Pack and attribution behavior

Every icon pack includes `manifest.json` and `LICENSES.txt`. The license file lists each asset, author, source, license, source URL, license URL, and whether attribution is required. The UI exposes an attribution badge and a copy-attribution action whenever an asset has `attributionRequired: true`; it never removes attribution metadata to make the library appear cleaner.

## Claims policy

The library is described as **curated** and **local**, not as a multi-million-icon catalog. Technical inspection and license metadata are not legal advice, do not certify a third-party license beyond the recorded source evidence, and do not guarantee that an icon is suitable for every downstream product. The UI must not claim that the library is AI-generated, lossless, or approved by an external marketplace.

## References

The policy is implemented and enforced by the manifest integrity test and `npm run check:svg-library`. The project’s own generated assets are intentionally used for the initial collection so the repository does not depend on remote SVG fetching or unverified scraping.
