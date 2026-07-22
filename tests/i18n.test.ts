import { describe, expect, it } from 'bun:test';
import { initializeLocalization, setLanguage, translate } from '../src/i18n/runtime';

describe('runtime localization', () => {
  it('translates catalog and dynamic editor text', () => {
    expect(translate('打开模型')).toBe('Open Model');
    expect(translate('已选择 12 个体素')).toBe('12 voxels selected');
    expect(translate('第 3 帧 · 0.250s')).toBe('Frame 3 · 0.250s');
    expect(translate('正在等待文件选择…')).toBe('Waiting for file selection…');
    expect(translate('柔和')).toBe('Soft');
    expect(translate('固定镜头 · 左键拖动旋转人物模型')).toBe(
      'Fixed camera · Left drag rotates the character',
    );
    expect(translate('1552 个已绑定体素正在跟随 running 动画。')).toBe(
      '1552 bound voxels are following the running animation.',
    );
    expect(translate('模型有 15 个骨骼点；still 预设提供 16 个。')).toBe(
      'Model: 15 bones; still preset: 16.',
    );
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
