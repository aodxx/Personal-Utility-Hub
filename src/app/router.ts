import { parseHash, type AppRoute } from './routes';

export type RouteListener = (route: AppRoute) => void;

export class HashRouter {
  private listener: RouteListener | undefined;
  private readonly handleHashChange = (): void => this.emit();

  start(listener: RouteListener): void {
    this.stop();
    this.listener = listener;
    window.addEventListener('hashchange', this.handleHashChange);
    this.emit();
  }

  stop(): void {
    window.removeEventListener('hashchange', this.handleHashChange);
    this.listener = undefined;
  }

  navigate(path: string): void {
    window.location.hash = path.startsWith('/') ? path : `/${path}`;
  }

  private emit(): void {
    this.listener?.(parseHash(window.location.hash));
  }
}
