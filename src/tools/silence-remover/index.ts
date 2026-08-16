import { createAudioWorkbench } from '../audio-workbench';
import { metadata } from './metadata';
const tool = createAudioWorkbench(metadata, { kind: 'silence', eyebrow: 'Speech cleanup', heading: 'Silence Remover', intro: 'ตัดช่วงเงียบระหว่างคำพูดโดยกำหนด threshold, minimum silence และ padding ได้เอง', outputSuffix: '-no-silence' });
export const { mount, unmount } = tool;
export { metadata };
