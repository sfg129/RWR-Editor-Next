import { describe, expect, it } from 'bun:test';
import { initializeLocalization, setLanguage, translate } from '../src/i18n/runtime';

describe('runtime localization', () => {
  it('translates catalog and dynamic editor text', () => {
    expect(translate('打开模型')).toBe('Open Model');
    expect(translate('已选择 12 个体素')).toBe('12 voxels selected');
    expect(translate('第 3 帧 · 0.250s')).toBe('Frame 3 · 0.250s');
  });

  it('switches existing and newly updated interface text in place', async () => {
    document.body.innerHTML = '<button title="设置">打开模型</button>   <p id="status">就绪</p>';
    initializeLocalization('en');

    expect(document.querySelector('button')?.textContent).toBe('Open Model');
    expect(document.querySelector('button')?.title).toBe('Settings');
    expect(document.querySelector('#status')?.textContent).toBe('Ready');
    expect(document.body.childNodes[1]?.textContent).toBe('   ');

    document.querySelector('#status')!.textContent = '已选择 4 个体素';
    await new Promise((resolve) => queueMicrotask(resolve));
    expect(document.querySelector('#status')?.textContent).toBe('4 voxels selected');

    setLanguage('zh-CN');
    expect(document.querySelector('button')?.textContent).toBe('打开模型');
    expect(document.querySelector('#status')?.textContent).toBe('已选择 4 个体素');
  });
});
