# Phase 6 tool-specific guide inventory

Active registry entries:
foundationDemoMetadata
jsonFormatterMetadata
base64Metadata
textFormatterMetadata
qrGeneratorMetadata
imageResizerMetadata
imageConverterMetadata
qrReaderMetadata
imageCompressorMetadata
imagesToPdfMetadata
pdfMergeMetadata
pdfSplitMetadata
pdfToImageMetadata
fileMetadata
audioTrimmerMetadata
audioCompressorMetadata
audioMergerMetadata
silenceRemoverMetadata
audioFinisherMetadata
audioSpeedPitchMetadata
privacyRedactorMetadata
fileDiffMetadata
imageContactSheetMetadata
csvProfilerMetadata
audioChapterMarkerMetadata

Current guide architecture:
7:const audioLimitations: LocalizedText[] = [
12:const audioFaq = [
17:function makeGuide(tool: ToolMetadata): ToolGuide {
19:  const sampleAvailable = ['json-formatter', 'base64', 'text-formatter', 'file-diff', 'privacy-redactor', 'csv-profiler'].includes(tool.id);
31:  const limitations = isAudio ? audioLimitations : [
46:    faq: isAudio ? audioFaq : [
53:    sampleAvailable,
57:export const toolGuides: readonly ToolGuide[] = toolCatalog.map(makeGuide);
60:  return toolGuides.find((guide) => guide.toolId === toolId);

Current sample implementations:
src/tools/base64/index.ts:76:        <button class="button button--secondary" type="button" data-base64-action="sample">ลองข้อมูลตัวอย่าง / Try sample</button>
src/tools/json-formatter/index.ts:82:        <button class="button button--secondary" type="button" data-json-action="sample">ลองข้อมูลตัวอย่าง / Try sample</button>
src/tools/text-formatter/index.ts:69:        <button class="button button--secondary" type="button" data-text-action="sample">ลองข้อมูลตัวอย่าง / Try sample</button>
