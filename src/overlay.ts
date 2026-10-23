import type { BooleanKey, ButtonOptions } from "./controls.js";
import { Section } from "./controls.js";
import { h } from "./dom.js";
import type { Hotkey } from "./hotkey.js";
import { matchesHotkey, parseHotkey } from "./hotkey.js";
import { Launcher } from "./launcher.js";
import type { PreviewOptions } from "./preview.js";
import { PreviewPane } from "./preview.js";
import { makeDraggable, makeResizable } from "./interact.js";
import type { StateStore } from "./store.js";
import { createStateStore } from "./store.js";
import { windowCss } from "./styles.js";
import type { OverlayTheme } from "./theme.js";

export interface OverlayState {
  x: number | null;
  y: number | null;
  w: number;
  h: number;
  collapsed: boolean;
  open: boolean;
}

export const overlayStateDefaults: OverlayState = {
  x: null,
  y: null,
  w: 560,
  h: 620,
  collapsed: false,
  open: false,
};

export function withOverlayState<T extends object>(
  defaults: T,
  overrides: Partial<OverlayState> = {},
): T & OverlayState {
  return { ...overlayStateDefaults, ...overrides, ...defaults };
}

export interface OverlayOptions<S extends OverlayState> {
  id: string;
  title: string;
  defaults: S;
  storageKey?: string;
  storage?: Storage | null;
  badge?: string;
  theme?: Partial<OverlayTheme>;
  hotkey?: string | Hotkey;
  minWidth?: number;
  minHeight?: number;
  reopenOnLoad?: boolean;
  launcher?: {
    label: string;
    anchor?: () => Element | null;
  };
  onOpen?: () => void;
  onClose?: () => void;
  onSync?: (state: S) => void;
}

export class Overlay<S extends OverlayState> {
  readonly store: StateStore<S>;
  readonly root: HTMLDivElement;
  readonly shadow: ShadowRoot;
  readonly element: HTMLDivElement;
  readonly launcher: Launcher | null;

  private readonly body: HTMLDivElement;
  private readonly arrow: HTMLSpanElement;
  private readonly badgeEl: HTMLSpanElement;
  private readonly statusLeft: HTMLSpanElement;
  private readonly statusRight: HTMLSpanElement;
  private readonly sections: Section<S>[] = [];
  private readonly teardown: (() => void)[] = [];

  constructor(private readonly options: OverlayOptions<S>) {
    this.store = createStateStore<S>({
      key: options.storageKey ?? `${options.id}.state`,
      defaults: options.defaults,
      ...(options.storage !== undefined ? { storage: options.storage } : {}),
      ...(options.reopenOnLoad === true ? {} : { transient: ["open"] as (keyof S)[] }),
    });
    const state = this.store.state;

    this.root = h("div", { id: `${options.id}-root` });
    this.shadow = this.root.attachShadow({ mode: "open" });
    this.shadow.appendChild(h("style", { text: windowCss(options.theme ?? {}) }));

    this.arrow = h("span", { class: "arrow", text: state.collapsed ? "►" : "▼" });
    this.badgeEl = h("span", { class: "ref", text: options.badge ?? "" });
    const close = h("span", { class: "x", text: "✕" });
    const title = h("div", { class: "title" }, [
      this.arrow,
      h("span", { class: "name", text: options.title }),
      this.badgeEl,
      close,
    ]);

    this.body = h("div", { class: "body" });
    this.statusLeft = h("span", { text: "" });
    this.statusRight = h("span", { text: "" });
    const status = h("div", { class: "status" }, [this.statusLeft, this.statusRight]);
    const grip = h("div", { class: "grip" });

    this.element = h("div", { class: `win hidden${state.collapsed ? " collapsed" : ""}` }, [
      title,
      this.body,
      status,
      grip,
    ]);
    this.shadow.appendChild(this.element);

    this.element.style.width = `${state.w}px`;
    this.element.style.height = `${state.h}px`;
    if (options.minWidth !== undefined) this.element.style.minWidth = `${options.minWidth}px`;
    if (options.minHeight !== undefined) this.element.style.minHeight = `${options.minHeight}px`;
    if (state.x !== null && state.y !== null) {
      this.element.style.left = `${Math.min(state.x, window.innerWidth - 60)}px`;
      this.element.style.top = `${Math.min(state.y, window.innerHeight - 30)}px`;
    } else {
      this.element.style.top = "40px";
      this.element.style.right = "8px";
    }

    this.launcher = options.launcher
      ? new Launcher({
          label: options.launcher.label,
          id: `${options.id}-launcher`,
          ...(options.launcher.anchor ? { anchor: options.launcher.anchor } : {}),
          ...(options.theme ? { theme: options.theme } : {}),
          onClick: () => this.open(),
        })
      : null;

    close.addEventListener("click", () => this.close());
    this.arrow.addEventListener("click", () => this.setCollapsed(!state.collapsed));

    this.teardown.push(
      makeDraggable(title, this.element, {
        ignoreSelector: ".arrow, .x",
        onMove: (x, y) => {
          state.x = x;
          state.y = y;
        },
        onEnd: () => this.store.save(),
      }),
      makeResizable(grip, this.element, {
        ...(options.minWidth !== undefined ? { minWidth: options.minWidth } : {}),
        ...(options.minHeight !== undefined ? { minHeight: options.minHeight } : {}),
        onResize: (w, hh) => {
          state.w = w;
          state.h = hh;
        },
        onEnd: () => this.store.save(),
      }),
    );

    if (options.hotkey) {
      const hotkey = parseHotkey(options.hotkey);
      const handler = (event: KeyboardEvent): void => {
        if (event.repeat || !matchesHotkey(event, hotkey)) return;
        event.preventDefault();
        this.toggle();
      };
      window.addEventListener("keydown", handler);
      this.teardown.push(() => window.removeEventListener("keydown", handler));
    }
  }

  get state(): S {
    return this.store.state;
  }

  get isOpen(): boolean {
    return !this.element.classList.contains("hidden");
  }

  section(options: { title?: string; open?: boolean; flex?: boolean; openKey?: BooleanKey<S> } = {}): Section<S> {
    const section = new Section<S>(this.store, () => this.sync(), options);
    this.sections.push(section);
    if (section.header) this.body.appendChild(section.header);
    this.body.appendChild(section.element);
    return section;
  }

  preview(options: PreviewOptions = {}): PreviewPane {
    const pane = new PreviewPane(options);
    if (pane.header) this.body.appendChild(pane.header);
    this.body.appendChild(pane.element);
    return pane;
  }

  buttons(buttons: readonly ButtonOptions[]): HTMLButtonElement[] {
    const elements = buttons.map((spec) => {
      const button = h("button", {
        class: "b",
        type: "button",
        text: spec.label,
        ...(spec.title ? { title: spec.title } : {}),
      });
      button.addEventListener("click", () => void spec.onClick(button));
      return button;
    });
    this.body.appendChild(h("div", { class: "btnbar" }, elements));
    return elements;
  }

  append(node: Node): void {
    this.body.appendChild(node);
  }

  setStatus(left: string, right = ""): void {
    this.statusLeft.textContent = left;
    this.statusRight.textContent = right;
  }

  setBadge(text: string): void {
    this.badgeEl.textContent = text;
  }

  sync(): void {
    for (const section of this.sections) section.sync();
    this.options.onSync?.(this.store.state);
  }

  mount(parent: Node = document.documentElement): this {
    if (!this.root.isConnected) parent.appendChild(this.root);
    this.launcher?.attach(this.shadow);
    this.sync();
    if (this.store.state.open) this.open();
    return this;
  }

  reanchorLauncher(): void {
    this.launcher?.reanchor();
  }

  open(): void {
    this.setOpen(true);
  }

  close(): void {
    this.setOpen(false);
  }

  toggle(): void {
    this.setOpen(!this.isOpen);
  }

  setCollapsed(collapsed: boolean): void {
    this.store.state.collapsed = collapsed;
    this.element.classList.toggle("collapsed", collapsed);
    this.arrow.textContent = collapsed ? "►" : "▼";
    this.store.save();
  }

  destroy(): void {
    for (const off of this.teardown) off();
    this.teardown.length = 0;
    this.launcher?.destroy();
    this.root.remove();
  }

  private setOpen(open: boolean): void {
    this.store.state.open = open;
    this.element.classList.toggle("hidden", !open);
    this.launcher?.setVisible(!open);
    this.store.save();
    if (open) {
      this.sync();
      this.options.onOpen?.();
    } else {
      this.options.onClose?.();
    }
  }
}
