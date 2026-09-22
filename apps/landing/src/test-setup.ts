/*
 * Node ≥ 26 ships a native webstorage global that is inert without
 * --localstorage-file and shadows jsdom's storage under vitest (window is
 * globalThis there, so rebinding recurses). A memory-backed Storage stands
 * in — the file-claim draft is the only consumer under test.
 */
class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}
// localStorage only: sessionStorage stays as-is — the covered overlay's
// once-per-session gate depends on storage being ABSENT under test.
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: new MemoryStorage(),
});
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
