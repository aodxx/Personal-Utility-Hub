import { createAudioWorkbench } from '../audio-workbench';
import { metadata } from './metadata';
const tool = createAudioWorkbench(metadata, { kind: 'merge', eyebrow: 'Playlist assembly', heading: 'Audio Merger Studio', intro: 'รวมเสียงหลายไฟล์แบบจัดลำดับได้ พร้อม Gap, Crossfade และรูปแบบ output ที่เลือกเอง', multiple: true, outputSuffix: '-merged' });
export const { mount, unmount } = tool;
export { metadata };
