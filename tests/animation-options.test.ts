import { describe, expect, it } from 'bun:test';
import { filterAnimationOptions, populateAnimationOptions } from '../src/editor/animation-options';

const options = [
  { id: '0', label: 'Running' },
  { id: '1', label: 'crouch still' },
  { id: '2', label: 'crouch forward' },
];
describe('animation search', () => {
  it('matches all keywords case-insensitively without changing original IDs', () => {
    expect(filterAnimationOptions(options, '  CROUCH   forw ')).toEqual([options[2]!]);
    expect(filterAnimationOptions(options, '')).toEqual(options);
  });
  it('updates options while preserving the current animation, including when hidden', () => {
    const select = document.createElement('select');
    populateAnimationOptions(select, options, 'forward', '0');
    expect([...select.options].map(({ value }) => value)).toEqual(['2']);
    expect(select.value).toBe('');
    expect(select.disabled).toBe(false);
    populateAnimationOptions(select, options, '', '0');
    expect(select.value).toBe('0');
  });
  it('disables empty searches and restores available selections when cleared', () => {
    const select = document.createElement('select');
    populateAnimationOptions(select, options, 'missing', '1');
    expect(select.disabled).toBe(true);
    expect(select.options[0]?.textContent).toBe('无匹配动画');
    populateAnimationOptions(select, options, 'still', '1');
    expect(select.disabled).toBe(false);
    expect(select.value).toBe('1');
    populateAnimationOptions(select, [], '', '');
    expect(select.options[0]?.textContent).toBe('未载入动画文件');
  });
});
