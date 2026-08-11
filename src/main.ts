import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import { AppShell } from './app/app-shell';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('ไม่พบพื้นที่เริ่มต้นของแอป');
}

const app = new AppShell(root);
app.start();
