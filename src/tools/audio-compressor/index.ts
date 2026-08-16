import { createAudioWorkbench } from '../audio-workbench';
import { metadata } from './metadata';
const tool = createAudioWorkbench(metadata, { kind: 'compress', eyebrow: 'Target-size audio', heading: 'Audio Compressor Pro', intro: 'ลดขนาดไฟล์พร้อม target-size และรายงาน metrics ก่อน/หลังอย่างตรงไปตรงมา', outputSuffix: '-compressed' });
export const { mount, unmount } = tool;
export { metadata };
