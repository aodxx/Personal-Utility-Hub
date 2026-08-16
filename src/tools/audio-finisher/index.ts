import { createAudioWorkbench } from '../audio-workbench';
import { metadata } from './metadata';
const tool = createAudioWorkbench(metadata, { kind: 'finish', eyebrow: 'Final polish', heading: 'Audio Finisher', intro: 'ปรับ loudness ขั้นสุดท้ายและตรวจ peak/clipping ก่อนส่งออกไฟล์', outputSuffix: '-finished' });
export const { mount, unmount } = tool;
export { metadata };
