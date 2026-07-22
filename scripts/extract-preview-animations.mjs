import { basename, resolve } from 'node:path';

const [, , inputPath, outputPath] = process.argv;
const selectedNames = [
  'still',
  'running',
  'running, no weapon?',
  'crouch still',
  'crouching forwards',
  'prone',
  'prone, moving forwards',
];

if (!inputPath || !outputPath) {
  throw new Error('Usage: bun scripts/extract-preview-animations.mjs <source.xml> <output.xml>');
}

const source = await Bun.file(resolve(inputPath)).text();
const blocks = source.match(/<animation\b[\s\S]*?<\/animation>/g) ?? [];
const byName = new Map(blocks.map((block) => [block.match(/\bcomment="([^"]+)"/)?.[1] ?? '', block]));
const missing = selectedNames.filter((name) => !byName.has(name));
if (missing.length) throw new Error(`Missing preview animations: ${missing.join(', ')}`);

const output = `<?xml version="1.0" encoding="UTF-8"?>\n<animations>\n${selectedNames
  .map((name) => `  ${byName.get(name)?.replaceAll('\n', '\n  ')}`)
  .join('\n')}\n</animations>\n`;
await Bun.write(resolve(outputPath), output);
console.log(`Extracted ${selectedNames.length} animations from ${basename(inputPath)}.`);
