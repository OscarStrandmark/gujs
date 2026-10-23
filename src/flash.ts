const pending = new WeakMap<HTMLButtonElement, { original: string; timer: ReturnType<typeof setTimeout> }>();

export function flash(button: HTMLButtonElement, label: string, durationMs = 1200): void {
  const previous = pending.get(button);
  if (previous) clearTimeout(previous.timer);
  const original = previous?.original ?? button.textContent ?? "";
  button.textContent = label;
  const timer = setTimeout(() => {
    button.textContent = original;
    pending.delete(button);
  }, durationMs);
  pending.set(button, { original, timer });
}
