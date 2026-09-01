/*
 * jsdom ships no IntersectionObserver; motion's useInView needs one at
 * effect time. Minimal stub: every observed element reports as entering
 * the viewport once — scroll-arrival components render their settled
 * state under test.
 */
class IntersectionObserverStub implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [0];
  readonly scrollMargin: string = "";
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }

  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (typeof IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver;
}

/*
 * jsdom ships no ResizeObserver; Radix's slider measures its root via
 * @radix-ui/react-use-size at effect time. Minimal stub: reports the
 * initial size once, then never fires — the slider is controlled here,
 * so layout-driven updates are never needed under test.
 */
class ResizeObserverStub implements ResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element): void {
    this.callback([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
