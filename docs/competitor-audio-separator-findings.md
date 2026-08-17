# Competitor research notes: ITKB Audio Separator

## Primary source
- URL: https://itkb.app/th/audio-separator
- Product positioning: Thai-language free vocal remover / karaoke tool.
- Core promise: remove vocals or emphasize speech, entirely in browser, without upload or account.
- Input formats stated: MP3, WAV, M4A and other common formats.
- Flow: upload file → choose one of two modes → start processing → download MP3.
- Modes: karaoke (remove vocals) and speech-focused (drop music).
- UX elements observed: dark navy page, purple/pink accent, prominent drag/upload panel, select control, single primary action, privacy badge, language selector, share button, related audio tools below.
- Monetization/discovery: extensive related-tool links and generic navigation, but no visible account or quota requirement on the main flow.
- Technical claim: OOPS / phase-inversion technique through FFmpeg, client-side processing.
- Explicit limitation: works best when vocals are center-panned; stereo vocal reverb or panned vocals may remain.

## Independent technical references
- https://www.soundonsound.com/sound-advice/q-can-remove-vocals-track-using-phase
  - Polarity inversion plus mono summing cancels signals identical in left/right channels.
  - Center-panned bass and kick can also be cancelled.
  - Stereo vocal reverb and panned vocals generally remain.
  - The technique cannot reliably isolate vocals from all backing.
- https://ffmpegwasm.netlify.app/docs/overview/
  - ffmpeg.wasm runs FFmpeg in browser via WebAssembly and JavaScript.
  - Heavy multimedia work is offloaded to a Web Worker by default.
  - Client-side processing improves privacy and avoids server-side upload, but browser compute remains resource-intensive.
  - The core can be single-threaded or multi-threaded and is a swappable WebAssembly component.
- FFmpeg AudioChannelManipulation source was inaccessible through extraction; do not rely on it as a citation unless validated later.

## Initial strategic interpretation
- The competitor wins through a very clear single-job value proposition, low friction, Thai localization, privacy messaging, and a 3-step flow.
- The apparent "audio separator" capability is a lightweight karaoke/voice reduction operation, not necessarily AI stem separation.
- Main weaknesses/opportunities to verify: output quality on modern stereo mixes, lack of waveform/preview/quality controls, unclear limits on large files or mobile memory, and potentially overbroad "speech mode" wording relative to the underlying OOPS method.
- Personal Utility Hub opportunity: add a clearly scoped audio tool with honest quality labeling, client-side Worker processing, preview/A-B comparison, input/output format disclosure, cancellation/progress, mobile safeguards, and privacy-first local behavior consistent with existing image/PDF tools.
