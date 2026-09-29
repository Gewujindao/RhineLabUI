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
// Only the loading mark carries the game's own title. From the boot on, the opening speaks from inside the
// world: the player's 万象终端 at the academy warms up, calibrates and joins the academy's 万象网 node. The
// terms come from the lore: every university runs a 万象网 node (worldview 12 and the Pacific-coast base
// map); the player studies at 不列颠哥伦比亚学院 in 新维港 (player card); the story's rooms name the device
// 万象终端 (万象终端通信室); the calendar is 万象历.
const terminal = "万象终端";
const academy = "不列颠哥伦比亚学院";
const era = "万象历一九〇一年";
export const terminalPlate = { title: terminal, subtitle: academy, caption: `新维港 · ${era}` } as const;
export const networkText = { title: "万象网", node: "新维港节点", place: `${academy} · ${era}` } as const;

export const brandHeading = `<h1>${escapeHtml(terminalPlate.title)}</h1><div>${escapeHtml(terminalPlate.subtitle)}</div><p>${escapeHtml(terminalPlate.caption)}</p>`;

// The boot lockup is the terminal's mark: the emblem, the 万象 wordmark and its rule. Its two caption lines
// stay as empty text nodes (boot.ts fades them in with the wordmark): the corner plate already shows the
// academy and the date from the same moment, and the same words twice on screen have no reason to be there.
export const bootLogo = logo
  .replace(/<text([^>]*)>([^<]*)<\/text>/g, (whole, attributes: string, text: string) =>
    text === subtitle || text === caption ? `<text${attributes}></text>` : whole);

// The 万象终端 calibrating itself as it starts, in the machine's own terms: the sigil-held medium keeps
// its state, spell power holds threshold and phase, and the line reaches the network. These describe
// the instrument and its connection, not a player, account, authorization service or learning progress.
// `database` and `powered` feed nodes boot.ts animates; in 万象 both nodes are hidden (wanxiang.css) because
// they would repeat the corner plate's academy, date and terminal name.
export const bootCopy = {
  access: `${terminal} · 暖机`,
  identity: "咒印介质",
  // Chinese status lines join with a full-width colon and no spaces, not the source's " : ".
  identityJoin: "：",
  identityDetail: "稳定",
  request: "相位校准",
  processing: "接入万象网",
  processingGlitch: "　　　万象网...",
  permission: "已接入",
  welcome: networkText.title,
  company: networkText.node,
  database: networkText.place,
  powered: `${terminal} · 新维港`,
} as const;
