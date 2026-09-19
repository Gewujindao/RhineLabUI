import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Run from this checkout with: node scripts/sync-wanxiang.mjs [canonical-repo]
// The default canonical repo is the sibling of wanxiang-game-reference.
// This projects source content; it does not infer player state or access rights.
const referenceRoot = fileURLToPath(new URL("../", import.meta.url));
const canonicalRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(referenceRoot, "../../wanxiang-game");
const catalog = JSON.parse(
  await fs.readFile(
    path.join(canonicalRoot, "content/lessons/lessonCatalogData.json"),
    "utf8",
  ),
);
const canonicalLogo = path.join(canonicalRoot, "content/art/branding/wx_logo.svg");
const logoSvg = await fs.readFile(canonicalLogo, "utf8");
const branding = {
  svg: logoSvg,
  texts: [...logoSvg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(
    (match) => match[1],
  ),
};

function plainInline(text) {
  return text.replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
}

function openingText(markdown) {
  const blocks = markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<a\s[^>]*><\/a>/g, "")
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim());
  const openingIndex = blocks.findIndex(
    (block) =>
      block && !/^(?:#{1,6}\s|```|~~~|\||[-*]\s|\d+\.\s|\\\[)/.test(block),
  );
  const opening = blocks[openingIndex];
  const attached = blocks[openingIndex + 1];
  const prose = /[:：]$/.test(opening) && /^(?:>|[-*]\s|\d+\.\s)/.test(attached)
    ? `${opening}\n${attached}`
    : opening;
  return plainInline(prose.replace(/^>\s?/gm, "").replace(/\r?\n/g, " "));
}

function sectionTitles(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = lines.filter((line) => /^###\s/.test(line));
  const headings = sections.length
    ? sections
    : lines.filter((line) => /^##\s/.test(line));
  return headings.map((line) => plainInline(line.replace(/^#+\s+/, "")));
}

const lessons = await Promise.all(
  catalog.lessons.map(async (lesson) => {
    const relativeLesson = lesson.assetPath.replace(
      /^\.\/game\/wanxiang\/lessons\//,
      "",
    );
    const markdown = await fs.readFile(
      path.join(canonicalRoot, "content/lessons", relativeLesson),
      "utf8",
    );
    return { lesson, markdown };
  }),
);
const courseTitles = [...new Set(catalog.lessons.map((lesson) => lesson.courseTitle))];
const records = lessons.map(({ lesson, markdown }) => ({
  id: lesson.id,
  title: lesson.title,
  en: lesson.id,
  department: lesson.courseTitle,
  category: lesson.courseTitle,
  // The source catalog date is an authoring date, not an in-world date.
  // A static lesson catalog supplies no person, progress or clearance state.
  date: "",
  lead: "",
  clearance: "",
  abstract: openingText(markdown),
  findings: sectionTitles(markdown),
  source: `wanxiang/lessons/${lesson.id}.md`,
  downloadPath: `wanxiang/archives/${lesson.id}.txt`,
  duration: lesson.duration,
  prerequisiteLessonId: lesson.prerequisiteLessonId,
}));

await fs.mkdir(path.join(referenceRoot, "public/wanxiang/archives"), { recursive: true });
await fs.mkdir(path.join(referenceRoot, "public/wanxiang/lessons"), { recursive: true });
for (const { lesson, markdown } of lessons) {
  await fs.writeFile(
    path.join(referenceRoot, "public/wanxiang/archives", `${lesson.id}.txt`),
    markdown,
    "utf8",
  );
  await fs.writeFile(
    path.join(referenceRoot, "public/wanxiang/lessons", `${lesson.id}.md`),
    markdown,
    "utf8",
  );
}
await fs.writeFile(
  path.join(referenceRoot, "content/wanxiang-archives.json"),
  `${JSON.stringify({ branding, categories: courseTitles, columns: courseTitles, records }, null, 2)}\n`,
  "utf8",
);
await fs.copyFile(canonicalLogo, path.join(referenceRoot, "src/wanxiang-logo.svg"));
await fs.copyFile(canonicalLogo, path.join(referenceRoot, "public/wanxiang/logo.svg"));
console.log(`Projected ${records.length} Wanxiang lessons and the canonical logo.`);
