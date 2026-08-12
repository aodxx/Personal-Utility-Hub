interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export class PwaController {
  private deferredPrompt: InstallPromptEvent | undefined;
  private installButton: HTMLButtonElement | undefined;

  private readonly handleBeforeInstall = (event: Event): void => {
    event.preventDefault();
    this.deferredPrompt = event as InstallPromptEvent;
    if (this.installButton) this.installButton.hidden = false;
  };

  private readonly handleInstalled = (): void => {
    this.deferredPrompt = undefined;
    if (this.installButton) this.installButton.hidden = true;
  };

  private readonly handleInstallClick = async (): Promise<void> => {
    if (!this.deferredPrompt) return;
    await this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.handleInstalled();
  };

  start(button: HTMLButtonElement): void {
    this.installButton = button;
    button.hidden = true;
    button.addEventListener('click', this.handleInstallClick);
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstall);
    window.addEventListener('appinstalled', this.handleInstalled);
  }

  stop(): void {
    this.installButton?.removeEventListener('click', this.handleInstallClick);
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstall);
    window.removeEventListener('appinstalled', this.handleInstalled);
    this.installButton = undefined;
    this.deferredPrompt = undefined;
  }
}

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    });
  } catch (error) {
    console.warn('ไม่สามารถลงทะเบียน Service Worker ได้', error);
  }
}
