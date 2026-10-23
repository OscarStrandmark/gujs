import type { OverlayTheme } from "./theme.js";
import { themeVars } from "./theme.js";

export function windowCss(theme: Partial<OverlayTheme> = {}): string {
  return `
:host {
  all: initial;
${themeVars(theme)}
}
* { box-sizing: border-box; margin: 0; padding: 0; font-family: var(--gu-font); }
.win {
  position: fixed; z-index: 2147483000; display: flex; flex-direction: column;
  min-width: 320px; min-height: 120px;
  background: var(--gu-window-bg); border: 1px solid var(--gu-border);
  color: var(--gu-text); font-size: var(--gu-font-size); box-shadow: var(--gu-shadow);
}
.win.hidden { display: none; }
.win.collapsed { height: auto !important; min-height: 0 !important; }
.title {
  display: flex; align-items: center; gap: 6px; padding: 4px 6px; cursor: move;
  background: var(--gu-title-bg); border-bottom: 1px solid var(--gu-border); user-select: none;
  touch-action: none;
}
.title .arrow { width: 12px; text-align: center; cursor: pointer; opacity: 0.9; }
.title .name {
  flex: 1; font-weight: 600; letter-spacing: 0.2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.title .ref { opacity: 0.65; font-weight: 400; }
.title .x { cursor: pointer; padding: 0 4px; opacity: 0.8; }
.title .x:hover { background: var(--gu-danger); }
.body { display: flex; flex-direction: column; flex: 1; min-height: 0; padding: 6px; gap: 6px; }
.win.collapsed .body, .win.collapsed .grip, .win.collapsed .status { display: none; }
.hdr {
  background: var(--gu-header-bg); border: 1px solid transparent; padding: 3px 6px; cursor: pointer;
  user-select: none; display: flex; align-items: center; gap: 6px;
}
.hdr:hover { background: var(--gu-header-hover-bg); }
.section { display: none; padding: 6px 4px 2px 14px; flex-direction: column; gap: 4px; }
.section.open { display: flex; }
.section.flex { flex: 1; min-height: 0; }
.row { display: flex; align-items: center; gap: 6px; }
.row.sub { padding-left: 16px; }
.row.dim { opacity: 0.45; pointer-events: none; }
.cb { display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; }
.cb .box {
  width: 14px; height: 14px; flex: 0 0 14px; background: var(--gu-accent-soft);
  border: 1px solid var(--gu-border); display: flex; align-items: center; justify-content: center;
  color: var(--gu-accent); font-size: 11px; line-height: 1;
}
.cb.on .box::after { content: "\\2714"; }
.cb.dim, .dim { opacity: 0.45; pointer-events: none; }
.slider {
  flex: 1; -webkit-appearance: none; appearance: none; height: 16px;
  background: var(--gu-accent-soft); border: 1px solid var(--gu-border);
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 10px; height: 14px; background: var(--gu-accent); border: 0;
}
.slider::-moz-range-thumb {
  width: 10px; height: 14px; background: var(--gu-accent); border: 0; border-radius: 0;
}
.lbl { white-space: nowrap; opacity: 0.85; }
.txt, .sel {
  flex: 1; min-width: 0; background: var(--gu-input-bg); color: var(--gu-text);
  border: 1px solid var(--gu-border); padding: 3px 5px; font-size: var(--gu-font-size);
}
.btnbar { display: flex; gap: 6px; flex-wrap: wrap; }
button.b {
  background: var(--gu-button-bg); color: var(--gu-text); border: 1px solid var(--gu-border);
  padding: 4px 10px; font-size: var(--gu-font-size); cursor: pointer;
}
button.b:hover { background: var(--gu-button-hover-bg); }
button.b:active { background: var(--gu-accent-strong); }
button.b:disabled { opacity: 0.45; cursor: default; }
.preview {
  flex: 1; min-height: 80px; width: 100%; resize: none; background: var(--gu-input-bg);
  color: #d8d8d8; border: 1px solid var(--gu-border); padding: 6px;
  font-family: var(--gu-mono-font); font-size: 11px; line-height: 1.45;
  white-space: pre-wrap; word-break: break-word; overflow: auto; tab-size: 2;
}
.status {
  border-top: 1px solid rgba(110,110,128,0.35); padding: 3px 6px; font-size: 11px; opacity: 0.75;
  display: flex; justify-content: space-between; gap: 8px;
}
.grip { position: absolute; right: 0; bottom: 0; width: 14px; height: 14px; cursor: nwse-resize; touch-action: none; }
.grip::after {
  content: ""; position: absolute; right: 2px; bottom: 2px; width: 0; height: 0;
  border-left: 9px solid transparent; border-bottom: 9px solid rgba(110,110,128,0.7);
}
`;
}

export function launcherCss(theme: Partial<OverlayTheme> = {}): string {
  return `
:host {
  display: block;
${themeVars(theme)}
}
* { box-sizing: border-box; margin: 0; padding: 0; font-family: var(--gu-font); }
.launch {
  background: var(--gu-launcher-bg); color: var(--gu-text); border: 1px solid var(--gu-border);
  font-size: var(--gu-font-size); line-height: 1; padding: 5px 9px; cursor: pointer;
  letter-spacing: 0.3px; white-space: nowrap;
}
.launch:hover { background: var(--gu-button-hover-bg); }
`;
}
