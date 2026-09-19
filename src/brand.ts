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

// These states describe this local interface's presentation, not a player,
// account, authorization service or fabricated learning progress.
export const bootCopy = {
  access: "STARTING INTERFACE",
  identity: "LOCAL ARCHIVE",
  identityDetail: "DISPLAY",
  request: "OPENING ARCHIVE",
  processing: "PREPARING VIEW",
  processingGlitch: "          VIEW...",
  permission: "ARCHIVE VIEW",
  welcome: title,
  company: subtitle,
  database: caption,
  powered: `${title} · ${subtitle}`,
} as const;
