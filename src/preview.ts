import { h } from "./dom.js";

export interface PreviewOptions {
  title?: string;
  readonly?: boolean;
  placeholder?: string;
  onInput?: (value: string) => void;
}

export class PreviewPane {
  readonly header: HTMLDivElement | null;
  readonly element: HTMLTextAreaElement;

  constructor(options: PreviewOptions = {}) {
    this.element = h("textarea", {
      class: "preview",
      spellcheck: "false",
      readonly: options.readonly !== false,
      placeholder: options.placeholder ?? "",
    });
    if (options.onInput) {
      this.element.addEventListener("input", () => options.onInput?.(this.element.value));
    }
    if (options.title === undefined) {
      this.header = null;
      return;
    }
    const arrow = h("span", { text: "▼" });
    this.header = h("div", { class: "hdr" }, [arrow, h("span", { text: options.title })]);
    this.header.addEventListener("click", () => {
      const hidden = this.element.style.display === "none";
      this.element.style.display = hidden ? "" : "none";
      arrow.textContent = hidden ? "▼" : "►";
    });
  }

  get value(): string {
    return this.element.value;
  }

  set value(text: string) {
    this.element.value = text;
  }

  selectAll(): void {
    this.element.select();
  }
}
