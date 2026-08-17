import { createAudioWorkbench } from '../audio-workbench';
import { metadata } from './metadata';
const tool = createAudioWorkbench(metadata, { kind: 'compress', eyebrow: 'WAV sample-rate control', heading: 'Audio Resampler (WAV)', intro: 'ลด sample rate เพื่อประมาณการลดขนาดไฟล์ และส่งออก WAV พร้อม metrics ก่อน/หลังอย่างตรงไปตรงมา', outputSuffix: '-resampled' });
export const { mount, unmount } = tool;
export { metadata };
