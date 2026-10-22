import { configure } from "@testing-library/react";
import { afterAll } from "vitest";

/*
 * findBy* waits run on testing-library's own clock (default 1000ms), NOT
 * vitest's testTimeout — on a loaded CI runner the first ready-state render
 * regularly misses 1s while the whole monorepo's test processes compete for
 * the CPU (same rationale as the 20s testTimeout below in vitest.config).
 */
configure({ asyncUtilTimeout: 5000 });

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
 * wallet-ui (pulled in via @solana/connector) keeps wallet state in
 * @nanostores/persistent atoms, which bind `storage` listeners on `window`
 * while mounted. When the last subscriber leaves, nanostores delays the
 * destroy by STORE_UNMOUNT_DELAY (1000ms); if vitest disposes the jsdom
 * environment first, the delayed `window.removeEventListener` throws
 * `ReferenceError: window is not defined` as an unhandled error and fails
 * the run with every test green. before disposing, wait for that delayed
 * destroy to run while `window` still exists — but only in files that
 * actually attached a persistent-store listener.
 */
let storageListeners = 0;
const realAddEventListener = window.addEventListener.bind(window);
const realRemoveEventListener = window.removeEventListener.bind(window);
window.addEventListener = (
  type: string,
  listener: EventListenerOrEventListenerObject | null,
  options?: AddEventListenerOptions | boolean,
) => {
  if (type === "storage") storageListeners++;
  if (listener === null) return;
  return realAddEventListener(type, listener, options);
};
window.removeEventListener = (
  type: string,
  listener: EventListenerOrEventListenerObject | null,
  options?: EventListenerOptions | boolean,
) => {
  if (type === "storage") storageListeners--;
  if (listener === null) return;
  return realRemoveEventListener(type, listener, options);
};

afterAll(async () => {
  if (storageListeners === 0) return;
  const deadline = Date.now() + 2000;
  while (storageListeners > 0 && Date.now() < deadline) {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 100);
    await promise;
  }
});

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
