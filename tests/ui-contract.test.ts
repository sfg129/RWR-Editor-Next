import { describe, expect, it } from 'bun:test';

const controllerSource = await Bun.file('src/editor/controller.ts').text();
const componentPaths = await Array.fromAsync(new Bun.Glob('src/**/*.vue').scan('.'));
const componentSource = (await Promise.all(componentPaths.map((path) => Bun.file(path).text()))).join('\n');

function uniqueMatches(source: string, pattern: RegExp): string[] {
  return [
    ...new Set(
      [...source.matchAll(pattern)]
        .map((match) => match[1])
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}

describe('Vue editor DOM contract', () => {
  it('provides every element required by the Three.js controller', () => {
    const requiredIds = uniqueMatches(
      controllerSource,
      /(?:element(?:<[^>]+>)?\(|getElementById\()'?#([^']+)'?\)/g,
    );
    const providedIds = new Set(uniqueMatches(componentSource, /\bid="([^"]+)"/g));

    expect(requiredIds.filter((id) => !providedIds.has(id))).toEqual([]);
  });

  it('does not duplicate document IDs across Vue components', () => {
    const ids = [...componentSource.matchAll(/\bid="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((value): value is string => Boolean(value));
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect([...new Set(duplicates)]).toEqual([]);
  });
});
