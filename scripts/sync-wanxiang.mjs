import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Standalone calls obtain the same ReleasePlan used by the Wanxiang build.
// A parent build passes its already selected opening projection without reselecting lessons.
const referenceRoot = fileURLToPath(new URL("../", import.meta.url));

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

function childPath(root, relativePath, label) {
  if (typeof relativePath !== "string" || !relativePath || relativePath.includes("\\") || path.isAbsolute(relativePath)) {
    throw new Error(`${label} requires a normalized relative path.`);
  }
  const result = path.resolve(root, relativePath);
  const relative = path.relative(root, result);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`)
    || path.isAbsolute(relative) || relative.split(path.sep).join("/") !== relativePath) {
    throw new Error(`${label} must stay below its generated/source owner.`);
  }
  return result;
}

async function directoryChain(root, target) {
  let current = path.resolve(root);
  const relative = path.relative(current, target);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Generated path leaves the opening source: ${target}`);
  }
  for (const part of ["", ...relative.split(path.sep)]) {
    if (part) current = path.join(current, part);
    try {
      const entry = await fs.lstat(current);
      if (entry.isSymbolicLink() || !entry.isDirectory()) throw new Error(`Expected an ordinary directory: ${current}`);
    } catch (error) {
      if (error.code === "ENOENT" && current !== path.resolve(root)) break;
      throw error;
    }
  }
}

async function pruneGeneratedDirectory(root, allowed) {
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = childPath(root, path.relative(root, path.join(directory, entry.name)).split(path.sep).join("/"), "Generated cleanup");
      if (entry.isSymbolicLink()) throw new Error(`Generated opening content contains a symbolic link: ${target}`);
      if (entry.isDirectory()) {
        await visit(target);
        if ((await fs.readdir(target)).length === 0) await fs.rmdir(target);
      } else if (!allowed.has(path.relative(root, target).split(path.sep).join("/"))) {
        await fs.unlink(target);
      }
    }
  }
  await visit(root);
}

async function writeGeneratedText(root, target, contents) {
  await directoryChain(root, path.dirname(target));
  try {
    const existing = await fs.lstat(target);
    if (existing.isSymbolicLink() || !existing.isFile()) throw new Error(`Generated output is not an ordinary file: ${target}`);
  } catch (error) { if (error.code !== "ENOENT") throw error; }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents, "utf8");
}

export async function syncWanxiangContent({ repositoryRoot, openingSourceRoot = referenceRoot, projection, readFile = fs.readFile } = {}) {
  if (!projection || projection.schemaVersion !== 1 || !Array.isArray(projection.lessons)
    || !["production", "acceptance-prototype"].includes(projection.channel)) {
    throw new Error("Wanxiang opening sync requires a channel ReleasePlan openingProjection.");
  }
  const canonicalRoot = path.resolve(repositoryRoot);
  const outputRoot = path.resolve(openingSourceRoot);
  const lessonRoot = childPath(outputRoot, "public/wanxiang/lessons", "Lesson output");
  const downloadRoot = childPath(outputRoot, "public/wanxiang/archives", "Download output");
  for (const target of [lessonRoot, downloadRoot, path.join(outputRoot, "content"), path.join(outputRoot, "src")]) {
    await directoryChain(outputRoot, target);
  }
  // All selected bodies are prepared before any old generated file is removed.
  const lessons = await Promise.all(projection.lessons.map(async (lesson) => {
    if (!lesson.sourceRelative?.startsWith("content/lessons/")) throw new Error("Opening lesson source is outside the lesson owner.");
    const source = childPath(canonicalRoot, lesson.sourceRelative, "Selected lesson source");
    await directoryChain(canonicalRoot, path.dirname(source));
    const sourceEntry = await fs.lstat(source);
    if (!sourceEntry.isFile() || sourceEntry.isSymbolicLink()) throw new Error(`Selected lesson is not an ordinary file: ${source}`);
    childPath(lessonRoot, lesson.lessonFile, "Selected lesson output");
    childPath(downloadRoot, lesson.downloadFile, "Selected download output");
    return { lesson, markdown: await readFile(source, "utf8") };
  }));
  const canonicalLogo = path.join(canonicalRoot, "content/art/branding/wx_logo.svg");
  const logoSvg = await readFile(canonicalLogo, "utf8");
  const branding = { svg: logoSvg,
    texts: [...logoSvg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map((match) => match[1]) };
  const courseTitles = [...new Set(lessons.map(({ lesson }) => lesson.courseTitle))];
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
  source: `wanxiang/lessons/${lesson.lessonFile}`,
  downloadPath: `wanxiang/archives/${lesson.downloadFile}`,
  duration: lesson.duration,
  prerequisiteLessonId: lesson.prerequisiteLessonId,
  }));
  await fs.mkdir(lessonRoot, { recursive: true });
  await fs.mkdir(downloadRoot, { recursive: true });
  for (const { lesson, markdown } of lessons) {
    for (const target of [childPath(lessonRoot, lesson.lessonFile, "Lesson output"), childPath(downloadRoot, lesson.downloadFile, "Download output")]) {
      await writeGeneratedText(outputRoot, target, markdown);
    }
  }
  const metadataPath = path.join(outputRoot, "content/wanxiang-archives.json");
  await fs.mkdir(path.dirname(metadataPath), { recursive: true });
  await fs.mkdir(path.join(outputRoot, "src"), { recursive: true });
  await writeGeneratedText(outputRoot, metadataPath, `${JSON.stringify({ branding, categories: courseTitles, columns: courseTitles, records }, null, 2)}\n`);
  await writeGeneratedText(outputRoot, path.join(outputRoot, "src/wanxiang-logo.svg"), logoSvg);
  await writeGeneratedText(outputRoot, path.join(outputRoot, "public/wanxiang/logo.svg"), logoSvg);
  await pruneGeneratedDirectory(lessonRoot, new Set(lessons.map(({ lesson }) => lesson.lessonFile)));
  await pruneGeneratedDirectory(downloadRoot, new Set(lessons.map(({ lesson }) => lesson.downloadFile)));
  return { channel: projection.channel, lessonIds: lessons.map(({ lesson }) => lesson.id), metadataPath };
}

async function runCli() {
  let repositoryRoot = process.env.WANXIANG_REPOSITORY_ROOT ?? path.resolve(referenceRoot, "../../wanxiang-game");
  let projectionPath = process.env.WANXIANG_OPENING_PROJECTION_PATH;
  let channel = process.env.WANXIANG_PACKAGE_CHANNEL ?? "production";
  const args = process.argv.slice(2);
  if (args[0] && !args[0].startsWith("--")) repositoryRoot = args.shift();
  for (let index = 0; index < args.length; index += 2) {
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${args[index]} requires a value.`);
    if (args[index] === "--repository-root") repositoryRoot = value;
    else if (args[index] === "--release-plan") projectionPath = value;
    else if (args[index] === "--channel") channel = value;
    else throw new Error(`Unknown Wanxiang opening argument: ${args[index]}`);
  }
  repositoryRoot = path.resolve(repositoryRoot);
  const projection = projectionPath ? JSON.parse(await fs.readFile(projectionPath, "utf8"))
    : (await import(pathToFileURL(path.join(repositoryRoot, "scripts/lib/generated-active-content-projection.mjs")).href))
      .createGeneratedChannelReleasePlan({ repository: repositoryRoot, channel }).openingProjection;
  if (projection.channel !== channel) throw new Error("Opening projection channel does not match the requested build.");
  const result = await syncWanxiangContent({ repositoryRoot,
    openingSourceRoot: process.env.WANXIANG_OPENING_SOURCE_ROOT ?? referenceRoot, projection });
  console.log(`Projected ${result.lessonIds.length} Wanxiang lessons from ${channel} ReleasePlan.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
