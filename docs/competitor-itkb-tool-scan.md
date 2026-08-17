# ITKB competitor tool scan notes

## Directory observed on Audio Separator page
The related tools shown by ITKB include audio compressor, audio trimmer, audio fade, audio merger, audio volume, silence remover, noise reduction, audio enhancer, video to GIF, CVD risk, Gobblet/Gobblers, Excel unlock, video reverse, and blur image.

The audio tool cluster is the strongest opportunity set because it is adjacent to the requested competitor page and maps naturally to the existing `เสียงและวิดีโอ` category in Personal Utility Hub.

## Audio Compressor page observations
URL: https://itkb.app/th/audio-compressor

The page claims browser/offline processing and no upload. The input surface accepts MP3, WAV, M4A, WEBM, OGG and other formats. The visible main flow is upload → choose bitrate → compress → download MP3. The copy explicitly suggests 64 kbps for speech and 128 kbps for music and says the system calculates the output size immediately.

Potential weaknesses to verify:
- The visible initial UI does not expose a bitrate selector until a file is chosen, so the first-run experience hides an important decision.
- Output is described as MP3, but the page does not make output bitrate, sample rate, channel layout, encoder mode, or metadata handling visible in the primary flow.
- The product copy says “quality is almost indistinguishable at 128 kbps” in a broad way; this is context-dependent and should be presented more cautiously.
- There is no visible target-size mode, batch compression, before/after file-size comparison in the initial viewport, waveform/audio preview, or clear cancel/progress contract.
- “รองรับ ... ฯลฯ” leaves exact supported formats and limits ambiguous.
- For mobile use, no visible maximum duration/file size or memory guidance is shown before processing.

The competitor’s strongest point is use-case copy: reducing a file for LINE/email sharing. This is a better job-to-be-done framing than the generic “compress audio” label.

## Audio Trimmer route observation
URL attempted: https://itkb.app/th/audio-trimmer, which redirected to https://itkb.app/en/ instead of loading a dedicated tool page in the current session. The English directory exposed an Audio category and an Audio Compressor mention, but the direct Thai trimmer route did not render the expected trimmer UI.

This is a potentially significant competitor weakness: related-tool links may not reliably preserve locale or may point to routes that are not available/working at the time of inspection. It should be reported as an observed redirect, not as proof of a permanent broken link, because locale/session routing and site updates can change.

## English directory observation
The English homepage has a broad catalog spanning health, QR, image, video, PDF, audio, games and other categories. The category breadth is useful for discovery but also creates a diluted product identity. Personal Utility Hub can differentiate through a smaller, more coherent privacy-first utility set and stronger per-tool consistency.

## Additional route/content verification
The extracted pages for `/th/audio-trimmer`, `/th/audio-noise-reduction`, `/th/audio-enhancer`, and `/th/audio-merger` returned only generic ITKB client-side/about copy rather than tool-specific instructions or controls. A direct HTML check showed the same generic title `ITKB.app - Online Tools` for all four and no obvious tool-specific `drop-zone`, `start-btn`, audio, or tool controls in the server response.

This indicates a substantial product gap in the inspected state: these tools are discoverable from the Audio Separator page but do not expose a complete dedicated workflow in the fetched HTML. Browser navigation also redirected these paths to `/en/` in the current session. Because the HTTP response was 200 and the site may hydrate routes client-side or vary by locale/cookie, the finding should be stated as “not reliably accessible/rendered in the inspected state,” not as a permanent 404.

High-confidence opportunity candidates are therefore: audio trimmer, noise reduction, audio enhancer, and audio merger. They have strong user intent, are technically bounded, and can be implemented with the Hub’s existing file-tool, Worker, progress, cancel, privacy, and offline patterns.
