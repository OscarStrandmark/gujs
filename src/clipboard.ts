declare const GM: { setClipboard?: (text: string) => void | Promise<void> } | undefined;
declare const GM_setClipboard: ((text: string) => void) | undefined;

export async function copyText(text: string): Promise<boolean> {
  if (typeof GM !== "undefined" && typeof GM?.setClipboard === "function") {
    try {
      await GM.setClipboard(text);
      return true;
    } catch {
      /* fall through */
    }
  }
  if (typeof GM_setClipboard === "function") {
    try {
      GM_setClipboard(text);
      return true;
    } catch {
      /* fall through */
    }
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through */
    }
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  return copied;
}
