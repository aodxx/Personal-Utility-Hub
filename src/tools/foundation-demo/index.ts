import type { ToolModule } from '../../core/tool-contract';
import { foundationDemoMetadata as metadata } from './metadata';

let actionButton: HTMLButtonElement | undefined;
let output: HTMLOutputElement | undefined;
let count = 0;

const handleAction = (): void => {
  count += 1;
  if (output) output.textContent = `Event listener ทำงาน ${count} ครั้งใน session นี้`;
};

const tool: ToolModule = {
  metadata,
  mount(container) {
    count = 0;
    const section = document.createElement('section');
    section.className = 'demo-panel';

    const title = document.createElement('h2');
    title.textContent = 'Lifecycle พร้อมใช้งาน';

    const description = document.createElement('p');
    description.textContent = 'Module นี้ถูกโหลดเมื่อเปิด route เท่านั้น และจะคืน event listener เมื่อออกจากหน้า';

    actionButton = document.createElement('button');
    actionButton.className = 'button button--primary';
    actionButton.type = 'button';
    actionButton.textContent = 'ทดสอบ Event Listener';
    actionButton.addEventListener('click', handleAction);

    output = document.createElement('output');
    output.className = 'demo-output';
    output.setAttribute('aria-live', 'polite');
    output.textContent = 'พร้อมทดสอบ';

    section.append(title, description, actionButton, output);
    container.append(section);
  },
  unmount() {
    actionButton?.removeEventListener('click', handleAction);
    actionButton = undefined;
    output = undefined;
    count = 0;
  },
};

export const { mount, unmount } = tool;
export { metadata };
