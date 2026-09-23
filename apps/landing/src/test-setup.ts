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

/*
 * Node ≥26 ships a native `localStorage` accessor on globalThis that returns
 * undefined without --localstorage-file and shadows jsdom's implementation —
 * every suite touching localStorage (claim drafts, recovery) would crash on
 * `localStorage.clear()`. It's configurable, so swap in a memory-backed stub.
 */
if (globalThis.localStorage === undefined) {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => void store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}
