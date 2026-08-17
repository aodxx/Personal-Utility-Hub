import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/most-used-carousel.css';
import { AppShell } from './app/app-shell';
import { startMostUsedCarouselEnhancements } from './app/most-used-carousel';
import { registerServiceWorker } from './core/pwa';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('ไม่พบพื้นที่เริ่มต้นของแอป');
}

const app = new AppShell(root);
app.start();
startMostUsedCarouselEnhancements(root);

if (import.meta.env.PROD) void registerServiceWorker();
