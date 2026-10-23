# Gujs

A framework-free overlay-window toolkit in TypeScript, in the style of an ImGui debug panel.

Zero runtime dependencies. Renders into a shadow root, so host-page CSS cannot reach it.

## Install

```
npm install path/to/gujs
```

## Use

```ts
import { Overlay, copyText, downloadText, flash, withOverlayState } from "gujs";

const defaults = withOverlayState(
  { errors: true, warnings: true, debug: false, maxLines: 0, optionsOpen: true },
  { w: 560, h: 620 },
);

const gui = new Overlay({
  id: "log-viewer",
  title: "Log Viewer",
  storageKey: "logViewer.v1",
  defaults,
  hotkey: "ctrl+alt+l",
  launcher: { label: "▤ Logs" },
  onOpen: () => refresh(),
  onSync: () => refresh(),
});

const options = gui.section({ title: "Options", openKey: "optionsOpen" });
options.checkbox({ label: "Errors", key: "errors" });
options.checkbox({ label: "Warnings", key: "warnings" });
options.checkbox({ label: "Debug output", key: "debug", sub: true, enabledWhen: "warnings" });
options.slider({
  label: "Max lines",
  key: "maxLines",
  max: () => total,
  zeroMeansAll: true,
  sub: true,
});

const preview = gui.preview({ title: "Preview" });

gui.buttons([
  { label: "Copy", onClick: async (b) => { await copyText(preview.value); flash(b, "Copied!"); } },
  { label: "Save .log", onClick: () => downloadText("app.log", preview.value, "text/plain") },
]);

gui.mount();
```

## API

| Export | Purpose |
| --- | --- |
| `Overlay` | Draggable, resizable, collapsible window with title bar, launcher, status bar. |
| `Section` | A collapsible group of controls: `checkbox`, `slider`, `text`, `select`. Store-bound (`key`) or controlled (`value` + `onChange`). |
| `PreviewPane` | Monospace text pane with a collapsible header. |
| `Launcher` | Floating or DOM-anchored button in its own shadow root. |
| `createStateStore` | `localStorage`-backed state with defaults and transient keys. |
| `copyText` | Clipboard write: Greasemonkey API, then async clipboard, then `execCommand`. |
| `downloadText` / `downloadBlob` / `slugify` | File save helpers. |
| `h` / `deepQuery` / `onPointerDrag` | DOM helpers, including shadow-root-piercing query. |
| `makeDraggable` / `makeResizable` | Attach window interactions to any element. |
| `parseHotkey` / `matchesHotkey` | `"ctrl+alt+g"` style shortcuts. |
| `defaultTheme` / `windowCss` / `launcherCss` | Styling. Pass `theme` to `Overlay` to override. |

## Controlled mode

Use controlled mode when the host app owns the state, for example an admin overlay on top of a React,
Vue or plain-JS app. Pass `value` and `onChange` instead of `key`:

```ts
const gui = new Overlay({ id: "admin", title: "Admin", defaults: withOverlayState({}) });
const flags = gui.section({ title: "Feature flags" });

flags.checkbox({ label: "New checkout", value: () => config.newCheckout, onChange: config.setNewCheckout });
flags.slider({ label: "Log level", min: 0, max: 5, value: () => config.logLevel, onChange: config.setLogLevel });

config.subscribe(() => gui.sync());
gui.mount();
```

- gujs calls `value()` on every `sync()`, and calls `onChange` when the user edits a control.
- gujs never saves a controlled value. The app is the only owner.
- After an edit, the control shows the user's value until the next `sync()`. The app does not need to update synchronously.
- Call `gui.sync()` when the app state changes. A focused text field is not overwritten.
- `key` and `value` are exclusive. You can mix both modes in one overlay.

State keys `x`, `y`, `w`, `h`, `collapsed` and `open` are owned by the window.
`withOverlayState` merges them into your own defaults.
`open` resets to `false` on load unless you pass `reopenOnLoad: true`.

Theme values are CSS custom properties (`--gu-accent`, `--gu-window-bg`, …), so a partial
`theme` object restyles the whole window.

## Scripts

- `npm run build` — emit ESM plus `.d.ts` to `dist/`.
- `npm run typecheck` — types only.
- `npm run bundle` — single-file IIFE global `Gujs` in `dist/gujs.global.js`.
- `npm run demo` — serve `examples/` at http://localhost:8000 with the demo bundled on each request.
