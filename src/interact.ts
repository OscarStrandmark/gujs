import { onPointerDrag } from "./dom.js";

export interface Bounds {
  x: number | null;
  y: number | null;
  w: number;
  h: number;
}

export interface DragOptions {
  ignoreSelector?: string;
  onMove?: (x: number, y: number) => void;
  onEnd?: () => void;
}

export function makeDraggable(handle: HTMLElement, win: HTMLElement, options: DragOptions = {}): () => void {
  return onPointerDrag(
    handle,
    (event) => {
      const target = event.target as Element | null;
      if (options.ignoreSelector && target?.closest(options.ignoreSelector)) return null;
      const rect = win.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      win.style.left = `${rect.left}px`;
      win.style.top = `${rect.top}px`;
      win.style.right = "auto";
      return (move) => {
        const x = clamp(rect.left + move.clientX - startX, 0, window.innerWidth - 60);
        const y = clamp(rect.top + move.clientY - startY, 0, window.innerHeight - 30);
        win.style.left = `${x}px`;
        win.style.top = `${y}px`;
        options.onMove?.(x, y);
      };
    },
    options.onEnd,
  );
}

export interface ResizeOptions {
  minWidth?: number;
  minHeight?: number;
  onResize?: (w: number, h: number) => void;
  onEnd?: () => void;
}

export function makeResizable(grip: HTMLElement, win: HTMLElement, options: ResizeOptions = {}): () => void {
  const minWidth = options.minWidth ?? 320;
  const minHeight = options.minHeight ?? 160;
  return onPointerDrag(
    grip,
    (event) => {
      const rect = win.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      return (move) => {
        const w = Math.max(minWidth, rect.width + move.clientX - startX);
        const h = Math.max(minHeight, rect.height + move.clientY - startY);
        win.style.width = `${w}px`;
        win.style.height = `${h}px`;
        options.onResize?.(w, h);
      };
    },
    options.onEnd,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(Math.min(value, max), min);
}
