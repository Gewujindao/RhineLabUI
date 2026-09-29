import content from "../content/wanxiang-archives.json" with { type: "json" };
import { escapeHtml } from "./html.ts";

// Generated from wanxiang-game/content/art/branding/wx_logo.svg. Browser and
// Node consumers use the same projection; neither redraws or renames the mark.
const source = content.branding.svg.trim();
const [title, subtitle, caption] = content.branding.texts;
export const brandText = { title, subtitle, caption };
const mark = source.match(/<g\b[\s\S]*?<\/g>/)![0];

// Preserve the printed-label/icon viewport while keeping the square mark's
// proportions. The existing canvas consumer can retain its destination box.
export const labelMarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 145"><g transform="translate(82.5 0) scale(0.453125)">${mark}</g></svg>`;
export const logo = source.replace(
  "<svg ",
  `<svg class="wanxiang-brand-logo" role="img" aria-label="${escapeHtml(title)}" `,
);
export const brandHeading = `<h1>${escapeHtml(title)}</h1><div>${escapeHtml(subtitle)}</div><p>${escapeHtml(caption)}</p>`;

// The Tiangong terminal calibrating itself as it starts, in the machine's own terms: electricity reads
// and writes, the sigil-held medium keeps its state, and spell power holds threshold and phase. These
// describe the instrument, not a player, account, authorization service or learning progress.
export const bootCopy = {
  access: "天工终端 · 暖机",
  identity: "咒印介质",
  identityDetail: "稳定",
  request: "相位校准",
  processing: "接续万象网",
  processingGlitch: "　　　万象网...",
  permission: "校准完成",
  welcome: title,
  company: subtitle,
  database: caption,
  powered: `${title} · ${subtitle}`,
} as const;
