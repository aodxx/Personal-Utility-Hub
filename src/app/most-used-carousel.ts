const AUTOPLAY_MS = 4200;
const RESUME_AFTER_INTERACTION_MS = 6500;

interface CarouselRuntime {
  stop: () => void;
}

function cardElements(carousel: HTMLElement): HTMLElement[] {
  return [...carousel.querySelectorAll<HTMLElement>('.quick-tool-card')];
}

function activeCardIndex(carousel: HTMLElement, cards: HTMLElement[]): number {
  if (!cards.length) return 0;
  const center = carousel.scrollLeft + carousel.clientWidth / 2;
  let activeIndex = 0;
  let closest = Number.POSITIVE_INFINITY;
  cards.forEach((card, index) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const distance = Math.abs(cardCenter - center);
    if (distance < closest) {
      closest = distance;
      activeIndex = index;
    }
  });
  return activeIndex;
}

function scrollToCard(carousel: HTMLElement, card: HTMLElement, smooth: boolean): void {
  const targetLeft = Math.max(0, card.offsetLeft - Math.max(0, (carousel.clientWidth - card.offsetWidth) / 2));
  carousel.scrollTo({ left: targetLeft, behavior: smooth ? 'smooth' : 'auto' });
}

function attachCarousel(carousel: HTMLElement): CarouselRuntime {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let interval = 0;
  let resumeTimer = 0;
  let isPointerOver = false;
  let hasFocus = false;
  let isDocumentHidden = document.hidden;

  const clearIntervalTimer = (): void => {
    if (!interval) return;
    window.clearInterval(interval);
    interval = 0;
  };

  const canAutoplay = (): boolean => {
    return !reduceMotion.matches && !isPointerOver && !hasFocus && !isDocumentHidden && cardElements(carousel).length > 1;
  };

  const advance = (): void => {
    const cards = cardElements(carousel);
    if (cards.length < 2) return;
    const current = activeCardIndex(carousel, cards);
    const next = cards[(current + 1) % cards.length];
    if (next) scrollToCard(carousel, next, true);
  };

  const start = (): void => {
    clearIntervalTimer();
    if (!canAutoplay()) return;
    interval = window.setInterval(advance, AUTOPLAY_MS);
  };

  const pauseForInteraction = (): void => {
    clearIntervalTimer();
    if (resumeTimer) window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => {
      resumeTimer = 0;
      start();
    }, RESUME_AFTER_INTERACTION_MS);
  };

  const onPointerEnter = (): void => { isPointerOver = true; clearIntervalTimer(); };
  const onPointerLeave = (): void => { isPointerOver = false; start(); };
  const onFocusIn = (): void => { hasFocus = true; clearIntervalTimer(); };
  const onFocusOut = (): void => {
    window.setTimeout(() => {
      hasFocus = carousel.contains(document.activeElement);
      if (!hasFocus) start();
    }, 0);
  };
  const onInteraction = (): void => pauseForInteraction();
  const onVisibilityChange = (): void => {
    isDocumentHidden = document.hidden;
    if (isDocumentHidden) clearIntervalTimer(); else start();
  };
  const onMotionChange = (): void => start();

  carousel.addEventListener('pointerenter', onPointerEnter);
  carousel.addEventListener('pointerleave', onPointerLeave);
  carousel.addEventListener('pointerdown', onInteraction, { passive: true });
  carousel.addEventListener('wheel', onInteraction, { passive: true });
  carousel.addEventListener('touchstart', onInteraction, { passive: true });
  carousel.addEventListener('focusin', onFocusIn);
  carousel.addEventListener('focusout', onFocusOut);
  document.addEventListener('visibilitychange', onVisibilityChange);
  reduceMotion.addEventListener('change', onMotionChange);

  window.requestAnimationFrame(start);

  return {
    stop: () => {
      clearIntervalTimer();
      if (resumeTimer) window.clearTimeout(resumeTimer);
      carousel.removeEventListener('pointerenter', onPointerEnter);
      carousel.removeEventListener('pointerleave', onPointerLeave);
      carousel.removeEventListener('pointerdown', onInteraction);
      carousel.removeEventListener('wheel', onInteraction);
      carousel.removeEventListener('touchstart', onInteraction);
      carousel.removeEventListener('focusin', onFocusIn);
      carousel.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reduceMotion.removeEventListener('change', onMotionChange);
    },
  };
}

export function startMostUsedCarouselEnhancements(root: HTMLElement): () => void {
  const runtimes = new Map<HTMLElement, CarouselRuntime>();

  const sync = (): void => {
    const current = new Set(root.querySelectorAll<HTMLElement>('#most-used-carousel'));
    current.forEach((carousel) => {
      if (runtimes.has(carousel)) return;
      carousel.dataset.autoplay = 'enabled';
      runtimes.set(carousel, attachCarousel(carousel));
    });
    [...runtimes.entries()].forEach(([carousel, runtime]) => {
      if (current.has(carousel) && carousel.isConnected) return;
      runtime.stop();
      runtimes.delete(carousel);
    });
  };

  const observer = new MutationObserver(sync);
  observer.observe(root, { childList: true, subtree: true });
  sync();

  return () => {
    observer.disconnect();
    runtimes.forEach((runtime) => runtime.stop());
    runtimes.clear();
  };
}
