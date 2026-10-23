import { h } from "./dom.js";
import { launcherCss } from "./styles.js";
import type { OverlayTheme } from "./theme.js";

const ANCHORED_STYLE = "position: absolute; top: 6px; right: 6px; z-index: 120;";
const FLOATING_STYLE = "position: fixed; top: 8px; right: 8px; z-index: 2147483000;";

export interface LauncherOptions {
  label: string;
  id?: string;
  anchor?: () => Element | null;
  floatingStyle?: string;
  anchoredStyle?: string;
  theme?: Partial<OverlayTheme>;
  onClick: () => void;
}

export class Launcher {
  readonly host: HTMLDivElement;
  readonly button: HTMLButtonElement;
  private anchorEl: Element | null = null;
  private visible = true;
  private fallbackParent: Node | null = null;

  constructor(private readonly options: LauncherOptions) {
    this.host = h("div", options.id ? { id: options.id } : {});
    const shadow = this.host.attachShadow({ mode: "open" });
    shadow.appendChild(h("style", { text: launcherCss(options.theme ?? {}) }));
    this.button = h("button", { class: "launch", type: "button", text: options.label });
    this.button.addEventListener("click", () => options.onClick());
    shadow.appendChild(this.button);
  }

  setLabel(label: string): void {
    this.button.textContent = label;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.place();
  }

  attach(fallbackParent: Node): void {
    this.fallbackParent = fallbackParent;
    this.reanchor();
  }

  reanchor(): void {
    const target = this.options.anchor?.() ?? null;
    this.anchorEl = target && target.isConnected ? target : null;
    const parent = this.anchorEl ?? this.fallbackParent;
    if (!parent) return;
    if (this.host.parentNode !== parent) {
      if (this.anchorEl instanceof HTMLElement && getComputedStyle(this.anchorEl).position === "static") {
        this.anchorEl.style.position = "relative";
      }
      parent.insertBefore(this.host, parent.firstChild);
    }
    this.place();
  }

  private place(): void {
    const base = this.anchorEl
      ? (this.options.anchoredStyle ?? ANCHORED_STYLE)
      : (this.options.floatingStyle ?? FLOATING_STYLE);
    this.host.style.cssText = `${base} display: ${this.visible ? "block" : "none"};`;
  }

  destroy(): void {
    this.host.remove();
  }
}
