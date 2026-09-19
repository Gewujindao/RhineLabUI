import "./theme.css";
import { isWanxiang } from "./wallpaper";

const palette = isWanxiang ? {
  ink: ["#263238", "#f3ead7"], muted: ["#645a4b", "#c9bca6"], line: ["#9f927b", "#89775d"],
  paper: ["#efe5d0", "#35302a"], panel: ["#f6efde", "#403a31"], field: ["#e8ddc6", "#4b4439"],
  accent: ["#896524", "#c5a16b"], focus: ["#24645f", "#80d6cf"],
  document: ["#f6efde", "#efe5d0"], documentInk: ["#263238", "#263238"], documentMuted: ["#645a4b", "#645a4b"],
} as const : {
  ink: ["#080a08", "#e0e3dc"], muted: ["#77756d", "#a6b0b1"], line: ["#aaa59a", "#536166"],
  paper: ["#eae5e1", "#11181b"], panel: ["#edebe4", "#202a2f"], field: ["#e7e3d9", "#2a363b"],
  accent: ["#9b7247", "#c5a16b"],
} as const;
let previous = -1;
export let themeAmount = 0;
function rgb(hex: string) { return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); }
export function paintTheme(amount: number) {
  if (Math.abs(amount - previous) < .0001) return;
  previous = themeAmount = amount;
  const root = document.documentElement;
  root.dataset.darkSurface = String(amount > .0001);
  for (const [name, values] of Object.entries(palette)) {
    const from = rgb(values[0]), to = rgb(values[1]);
    const value = from.map((v, i) => Math.round(v + (to[i] - v) * amount)).join(", ");
    root.style.setProperty(`--theme-${name}`, `rgb(${value})`);
    root.style.setProperty(`--theme-${name}-rgb`, value);
  }
}
export function themeSettingsMarkup(dark: boolean) {
  return `<div class="theme-settings"><div><strong>界面配色</strong>${isWanxiang ? "" : '<span>玻璃阵列随配色逐张过渡</span>'}</div><div class="theme-choices" role="group" aria-label="界面配色"><button data-color-theme="light" aria-pressed="${!dark}">亮色</button><button data-color-theme="dark" aria-pressed="${dark}">暗色</button></div></div>`;
}
