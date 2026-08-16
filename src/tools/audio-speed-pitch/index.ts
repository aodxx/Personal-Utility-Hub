import { createAudioWorkbench } from '../audio-workbench';
import { metadata } from './metadata';
const tool = createAudioWorkbench(metadata, { kind: 'speed-pitch', eyebrow: 'Tempo & pitch', heading: 'Audio Speed & Pitch', intro: 'ทดลองความเร็วและโทนเสียงก่อน export ด้วยการประมวลผล offline ที่คาดเดาได้', outputSuffix: '-speed-pitch' });
export const { mount, unmount } = tool;
export { metadata };
