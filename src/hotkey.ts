export interface Hotkey {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export function parseHotkey(spec: string | Hotkey): Hotkey {
  if (typeof spec !== "string") return spec;
  const parts = spec.toLowerCase().split("+").map((part) => part.trim());
  let key = parts.pop() ?? "";
  if (key === "" && parts[parts.length - 1] === "") {
    parts.pop();
    key = "+";
  }
  return {
    key,
    ctrl: parts.includes("ctrl") || parts.includes("control"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
    meta: parts.includes("meta") || parts.includes("cmd"),
  };
}

export function matchesHotkey(event: KeyboardEvent, hotkey: Hotkey): boolean {
  return (
    matchesKey(event, hotkey.key.toLowerCase()) &&
    event.ctrlKey === Boolean(hotkey.ctrl) &&
    event.altKey === Boolean(hotkey.alt) &&
    event.shiftKey === Boolean(hotkey.shift) &&
    event.metaKey === Boolean(hotkey.meta)
  );
}

function matchesKey(event: KeyboardEvent, key: string): boolean {
  if (typeof event.key === "string" && event.key.toLowerCase() === key) return true;
  if (/^[a-z]$/.test(key)) return event.code === `Key${key.toUpperCase()}`;
  if (/^[0-9]$/.test(key)) return event.code === `Digit${key}`;
  return false;
}
