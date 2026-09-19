import { defineConfig } from "vite";
import { existsSync, readFileSync } from "node:fs";

const hasNovecento = ["Normal", "DemiBold", "Bold"].every(weight =>
  existsSync(`public/fonts/novecento/webFonts/NovecentoSansWide${weight}/font.woff2`),
);
export default defineConfig(({ mode }) => {
  const isWallpaper = mode === "wallpaper";
  const isWanxiang = mode === "wanxiang";
  return {
    base: isWallpaper || isWanxiang ? "./" : "/",
    define: {
      __RHINE_MODELS__: JSON.stringify({}),
      __RHINE_NOVECENTO__: JSON.stringify(hasNovecento),
    },
    server: isWanxiang ? { port: 5181, strictPort: true } : undefined,
    plugins: [{
      name: "entry-metadata",
      transformIndexHtml: {
        order: "pre" as const,
        handler(html: string) {
          let entry = html
            .replaceAll("__ENTRY_NAME__", isWanxiang ? "万象" : "Rhine Lab")
            .replaceAll("__ENTRY_TITLE__", isWanxiang ? "万象" : "RHINE LAB · ANALYSIS OS")
            .replaceAll("__ENTRY_DESCRIPTION__", isWanxiang ? "万象" : "Rhine Lab — Synthesize Information Analysis OS. 交互式三维研究档案终端。")
            .replaceAll("__ENTRY_ICON__", isWanxiang ? "/wanxiang/logo.svg" : "/favicon.svg");
          if (isWallpaper || isWanxiang) entry = entry.replace(/\s*<link rel="manifest"[^>]*>/, "");
          if (isWanxiang) {
            entry = entry
              .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, "")
              .replace(/\s*<meta name="(?:mobile-web-app-capable|apple-mobile-web-app-(?:capable|status-bar-style|title))"[^>]*>/g, "");
          }
          return entry;
        },
      },
    }, ...(isWallpaper ? [{
      name: "wallpaper-host",
      transformIndexHtml(html: string) {
        return { html, tags: [{
          tag: "script", children: readFileSync("wallpaper/host.js", "utf8"), injectTo: "head-prepend" as const,
        }] };
      },
    }] : [])],
  };
});
