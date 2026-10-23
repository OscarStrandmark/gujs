import { h } from "./dom.js";
import type { StateStore } from "./store.js";

export type KeysOfType<S, V> = { [K in keyof S]-?: S[K] extends V ? K : never }[keyof S];
export type BooleanKey<S> = KeysOfType<S, boolean>;
export type NumberKey<S> = KeysOfType<S, number>;
export type StringKey<S> = KeysOfType<S, string>;

export interface Control {
  readonly element: HTMLElement;
  sync(): void;
  setDisabled(disabled: boolean): void;
}

export interface ControlOptions<S extends object> {
  sub?: boolean;
  enabledWhen?: BooleanKey<S> | ((state: S) => boolean);
}

export interface BoundBinding<S, K, V> {
  key: K;
  value?: never;
  onChange?: (value: V, state: S) => void;
}

export interface ControlledBinding<S, V> {
  key?: never;
  value: () => V;
  onChange: (value: V, state: S) => void;
}

export type Binding<S, K, V> = BoundBinding<S, K, V> | ControlledBinding<S, V>;

export type CheckboxOptions<S extends object> = ControlOptions<S> &
  Binding<S, BooleanKey<S>, boolean> & {
    label: string;
  };

export type SliderOptions<S extends object> = ControlOptions<S> &
  Binding<S, NumberKey<S>, number> & {
    label: string;
    min?: number;
    max: number | (() => number);
    step?: number;
    zeroMeansAll?: boolean;
    live?: boolean;
    format?: (value: number, max: number) => string;
  };

export type TextOptions<S extends object> = ControlOptions<S> &
  Binding<S, StringKey<S>, string> & {
    label?: string;
    placeholder?: string;
  };

export type SelectOptions<S extends object> = ControlOptions<S> &
  Binding<S, StringKey<S>, string> & {
    label?: string;
    options: readonly { value: string; label: string }[];
  };

export interface ButtonOptions {
  label: string;
  onClick: (button: HTMLButtonElement) => void | Promise<void>;
  title?: string;
}

export class Section<S extends object> {
  readonly header: HTMLDivElement | null;
  readonly element: HTMLDivElement;
  private readonly controls: Control[] = [];

  constructor(
    private readonly store: StateStore<S>,
    private readonly onChange: () => void,
    options: { title?: string; open?: boolean; flex?: boolean; openKey?: BooleanKey<S> } = {},
  ) {
    const open = options.openKey ? Boolean(this.store.state[options.openKey]) : (options.open ?? true);
    this.element = h("div", { class: `section${open ? " open" : ""}${options.flex ? " flex" : ""}` });
    if (options.title === undefined) {
      this.header = null;
      return;
    }
    const arrow = h("span", { text: open ? "▼" : "►" });
    this.header = h("div", { class: "hdr" }, [arrow, h("span", { text: options.title })]);
    this.header.addEventListener("click", () => {
      const next = !this.element.classList.contains("open");
      this.element.classList.toggle("open", next);
      arrow.textContent = next ? "▼" : "►";
      if (options.openKey) {
        this.store.state[options.openKey] = next as S[BooleanKey<S>];
        this.store.save();
      }
    });
  }

  add(control: Control): Control {
    this.controls.push(control);
    this.element.appendChild(control.element);
    return control;
  }

  append(node: Node): void {
    this.element.appendChild(node);
  }

  sync(): void {
    for (const control of this.controls) control.sync();
  }

  checkbox(options: CheckboxOptions<S>): Control {
    const state = this.store.state;
    const value = this.bind(options);
    const box = h("span", { class: "box" });
    const toggle = h("span", { class: "cb" }, [box, h("span", { text: options.label })]);
    const row = this.row(toggle, options.sub);
    toggle.addEventListener("click", () => value.write(!value.read()));
    return this.add({
      element: row,
      sync: () => {
        toggle.classList.toggle("on", Boolean(value.read()));
        value.settle();
        applyEnabled(row, state, options.enabledWhen);
      },
      setDisabled: (disabled) => row.classList.toggle("dim", disabled),
    });
  }

  slider(options: SliderOptions<S>): Control {
    const state = this.store.state;
    const value = this.bind(options);
    const label = h("span", { class: "lbl", text: options.label });
    const input = h("input", {
      class: "slider",
      type: "range",
      min: String(options.min ?? 1),
      step: String(options.step ?? 1),
      max: "1",
    });
    const row = this.row([label, input], options.sub);
    const maxOf = (): number => (typeof options.max === "function" ? options.max() : options.max);
    const format =
      options.format ??
      ((value: number, max: number): string =>
        options.zeroMeansAll && value === 0 ? `${options.label}: all (${max})` : `${options.label}: ${value}`);

    const clampedMax = (): number => Math.max(Number(options.min ?? 1), maxOf());
    const inputValue = (max: number): number => {
      const raw = Number(input.value);
      return options.zeroMeansAll && raw >= max ? 0 : raw;
    };

    const commit = (): void => value.write(inputValue(clampedMax()));

    input.addEventListener("input", () => {
      if (options.live === false) {
        const max = clampedMax();
        label.textContent = format(inputValue(max), max);
        return;
      }
      commit();
    });
    input.addEventListener("change", () => {
      if (options.live === false) commit();
    });

    return this.add({
      element: row,
      sync: () => {
        const max = clampedMax();
        input.max = String(max);
        let current = Number(value.read());
        value.settle();
        if (options.zeroMeansAll && current > max) {
          current = 0;
          if (options.key !== undefined) state[options.key] = 0 as S[NumberKey<S>];
        }
        input.value = String(options.zeroMeansAll && current === 0 ? max : current);
        label.textContent = format(current, max);
        applyEnabled(row, state, options.enabledWhen);
      },
      setDisabled: (disabled) => row.classList.toggle("dim", disabled),
    });
  }

  text(options: TextOptions<S>): Control {
    const state = this.store.state;
    const value = this.bind(options);
    const input = h("input", { class: "txt", type: "text", placeholder: options.placeholder ?? "" });
    const parts = options.label ? [h("span", { class: "lbl", text: options.label }), input] : [input];
    const row = this.row(parts, options.sub);
    input.addEventListener("change", () => value.write(input.value));
    return this.add({
      element: row,
      sync: () => {
        const current = String(value.read() ?? "");
        value.settle();
        const root = input.getRootNode() as Document | ShadowRoot;
        if (root.activeElement !== input && input.value !== current) input.value = current;
        applyEnabled(row, state, options.enabledWhen);
      },
      setDisabled: (disabled) => row.classList.toggle("dim", disabled),
    });
  }

  select(options: SelectOptions<S>): Control {
    const state = this.store.state;
    const value = this.bind(options);
    const select = h(
      "select",
      { class: "sel" },
      options.options.map((option) => h("option", { value: option.value, text: option.label })),
    );
    const parts = options.label ? [h("span", { class: "lbl", text: options.label }), select] : [select];
    const row = this.row(parts, options.sub);
    select.addEventListener("change", () => value.write(select.value));
    return this.add({
      element: row,
      sync: () => {
        select.value = String(value.read() ?? "");
        value.settle();
        applyEnabled(row, state, options.enabledWhen);
      },
      setDisabled: (disabled) => row.classList.toggle("dim", disabled),
    });
  }

  private bind<K extends keyof S, V>(binding: Binding<S, K, V>): Accessor<V> {
    const state = this.store.state;
    if (binding.value !== undefined) {
      const { value, onChange } = binding;
      let pending: { value: V } | null = null;
      return {
        read: () => (pending ? pending.value : value()),
        write: (next) => {
          pending = { value: next };
          onChange(next, state);
          this.onChange();
        },
        settle: () => {
          pending = null;
        },
      };
    }
    const { key, onChange } = binding;
    return {
      read: () => state[key] as V,
      write: (next) => {
        state[key] = next as unknown as S[K];
        this.store.save();
        onChange?.(next, state);
        this.onChange();
      },
      settle: () => undefined,
    };
  }

  private row(content: HTMLElement | HTMLElement[], sub?: boolean): HTMLDivElement {
    return h("div", { class: `row${sub ? " sub" : ""}` }, Array.isArray(content) ? content : [content]);
  }
}

interface Accessor<V> {
  read(): V;
  write(value: V): void;
  settle(): void;
}

function applyEnabled<S extends object>(
  row: HTMLElement,
  state: S,
  enabledWhen: ControlOptions<S>["enabledWhen"],
): void {
  if (enabledWhen === undefined) return;
  const enabled = typeof enabledWhen === "function" ? enabledWhen(state) : Boolean(state[enabledWhen]);
  row.classList.toggle("dim", !enabled);
}
