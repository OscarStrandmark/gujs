export type Attrs = Record<string, string | number | boolean | null | undefined> & {
  class?: string;
  text?: string;
};

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Attrs,
  children?: readonly Node[],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") el.className = String(value);
    else if (key === "text") el.textContent = String(value);
    else el.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of children ?? []) el.appendChild(child);
  return el;
}

export function deepQuery<E extends Element = Element>(
  selector: string,
  root: ParentNode = document,
  maxDepth = 12,
): E | null {
  if (maxDepth < 0) return null;
  const direct = root.querySelector<E>(selector);
  if (direct) return direct;
  for (const node of root.querySelectorAll("*")) {
    const shadow = (node as HTMLElement).shadowRoot;
    if (!shadow) continue;
    const found = deepQuery<E>(selector, shadow, maxDepth - 1);
    if (found) return found;
  }
  return null;
}

export function onPointerDrag(
  handle: HTMLElement,
  onStart: (event: PointerEvent) => ((event: PointerEvent) => void) | null,
  onEnd?: () => void,
): () => void {
  const down = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const move = onStart(event);
    if (!move) return;
    const previousUserSelect = document.body.style.userSelect;
    const up = (): void => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.body.style.userSelect = previousUserSelect;
      onEnd?.();
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    event.preventDefault();
  };
  handle.addEventListener("pointerdown", down);
  return () => handle.removeEventListener("pointerdown", down);
}
