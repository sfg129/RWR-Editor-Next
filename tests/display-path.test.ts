import { expect, test } from 'bun:test';
import { displayPath } from '../src/core/editor/display-path';
test('UI paths omit extended prefixes and preserve ordinary and network paths', () => {
  expect(displayPath(String.raw`\\?\C:\mods\model.xml`)).toBe(String.raw`C:\mods\model.xml`);
  expect(displayPath(String.raw`\\?\UNC\server\share\model.xml`)).toBe(String.raw`\\server\share\model.xml`);
  expect(displayPath(String.raw`\\server\share\model.xml`)).toBe(String.raw`\\server\share\model.xml`);
  expect(displayPath(undefined)).toBe('');
});
