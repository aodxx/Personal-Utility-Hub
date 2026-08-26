# External tool candidates for a possible v0.10.0

การประเมินนี้ใช้คะแนนเชิงผู้เชี่ยวชาญ 1–5 ในห้ามิติ ได้แก่ คุณค่าต่อผู้ใช้ ความแตกต่างจาก v0.9.0 ความเหมาะสมกับ local-only ความเป็นไปได้ในการทำงานบนเบราว์เซอร์ และต้นทุนการพัฒนา โดยคะแนนสูงหมายถึงเหมาะสมกว่า ยกเว้นมิติสุดท้ายที่ให้คะแนนสูงเมื่อทำได้ง่ายกว่า

| Candidate | Main sources | Value | Differentiation | Local-only fit | Browser feasibility | Low implementation cost | Priority |
|---|---|---:|---:|---:|---:|---:|---|
| JWT Inspector | jwt.io, DevToys, CyberChef | 5 | 5 | 5 | 5 | 4 | P0 |
| Hash & Checksum Verifier | IT Tools, DevToys, CyberChef, MDN Web Crypto | 5 | 5 | 5 | 4 | 4 | P0 |
| Regex Playground | DevToys, CyberChef | 5 | 5 | 5 | 5 | 4 | P0 |
| Color Contrast Checker | W3C WCAG, IT Tools | 4 | 5 | 5 | 5 | 5 | P0 |
| Data Format Converter (YAML/TOML/XML) | IT Tools, JSON Crack | 4 | 4 | 5 | 4 | 4 | P1 |
| JSON Visualizer / Graph Viewer | JSON Crack | 4 | 4 | 5 | 3 | 3 | P1 |
| Image/Media Metadata Cleaner | ExifTool | 5 | 4 | 5 | 3 | 2 | P1 |
| SVG Optimizer / Minifier | SVGOMG / SVGO | 4 | 3 | 5 | 4 | 3 | P1 |
| PDF Signature Checker | IT Tools | 3 | 5 | 5 | 3 | 2 | P2 |
| Developer Generators Pack (UUID/ULID, password, token, base/date/cron) | DevToys, IT Tools | 4 | 3 | 5 | 5 | 5 | P2 |
| Markdown Preview & HTML Export | DevToys, IT Tools | 3 | 4 | 5 | 5 | 4 | P2 |
| Freeform Local Whiteboard | Excalidraw | 3 | 3 | 4 | 2 | 1 | P3 |

## Recommendation

P0 should be implemented first as four small, high-value tools: JWT Inspector; Hash & Checksum Verifier; Regex Playground; and Color Contrast Checker. P1 should follow with a scoped Data Format Converter, JSON Visualizer, Image/Media Metadata Cleaner, and SVG Optimizer. P2 and P3 are useful but either overlap with existing tools, need more security review, or have higher UI/algorithmic complexity.

## Constraints

JWT Inspector must clearly distinguish decoding from signature verification and should never fetch JWK endpoints or transmit tokens by default. Hashing should use a worker and impose a size/memory limit because Web Crypto digest() requires the full input in memory. Color contrast should follow WCAG thresholds but explain that a ratio check is not a complete accessibility audit. Metadata cleaning should export a new sanitized file, document supported formats/tags, and never claim ExifTool-level coverage unless the implementation actually provides it. SVG optimization must warn before removing title, desc, metadata, scripts, or other semantics. JSON visualization needs an input-size bound and deterministic layout to avoid mobile performance problems.
