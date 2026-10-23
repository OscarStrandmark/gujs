export interface OverlayTheme {
  font: string;
  monoFont: string;
  fontSize: string;
  text: string;
  windowBg: string;
  titleBg: string;
  border: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  headerBg: string;
  headerHoverBg: string;
  inputBg: string;
  buttonBg: string;
  buttonHoverBg: string;
  launcherBg: string;
  danger: string;
  shadow: string;
}

export const defaultTheme: OverlayTheme = {
  font: '"Segoe UI", Tahoma, sans-serif',
  monoFont: 'Consolas, "DejaVu Sans Mono", monospace',
  fontSize: "12px",
  text: "#e6e6e6",
  windowBg: "rgba(15,15,15,0.96)",
  titleBg: "rgba(41,74,122,1)",
  border: "rgba(110,110,128,0.5)",
  accent: "#4296fa",
  accentStrong: "rgba(15,135,250,1)",
  accentSoft: "rgba(41,74,122,0.55)",
  headerBg: "rgba(66,150,250,0.31)",
  headerHoverBg: "rgba(66,150,250,0.5)",
  inputBg: "rgba(10,10,12,0.9)",
  buttonBg: "rgba(66,150,250,0.4)",
  buttonHoverBg: "rgba(66,150,250,0.85)",
  launcherBg: "rgba(38,66,111,0.92)",
  danger: "rgba(230,80,80,0.8)",
  shadow: "0 6px 24px rgba(0,0,0,0.5)",
};

const VARS: Record<keyof OverlayTheme, string> = {
  font: "--gu-font",
  monoFont: "--gu-mono-font",
  fontSize: "--gu-font-size",
  text: "--gu-text",
  windowBg: "--gu-window-bg",
  titleBg: "--gu-title-bg",
  border: "--gu-border",
  accent: "--gu-accent",
  accentStrong: "--gu-accent-strong",
  accentSoft: "--gu-accent-soft",
  headerBg: "--gu-header-bg",
  headerHoverBg: "--gu-header-hover-bg",
  inputBg: "--gu-input-bg",
  buttonBg: "--gu-button-bg",
  buttonHoverBg: "--gu-button-hover-bg",
  launcherBg: "--gu-launcher-bg",
  danger: "--gu-danger",
  shadow: "--gu-shadow",
};

export function themeVars(theme: Partial<OverlayTheme> = {}): string {
  const merged = { ...defaultTheme, ...theme };
  return (Object.keys(VARS) as (keyof OverlayTheme)[])
    .map((key) => `  ${VARS[key]}: ${merged[key]};`)
    .join("\n");
}
