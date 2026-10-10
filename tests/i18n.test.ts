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
    expect(translate('拖放 XML 文件以打开')).toBe('Drop an XML file to open it');
    expect(translate('版本 0.8')).toBe('Version 0.8');
    expect(translate('版本 0.8.1')).toBe('Version 0.8.1');
    expect(translate('当前模型有未保存修改。')).toBe('The current model has unsaved changes.');
    expect(translate('新模型已创建。')).toBe('Model created.');
    expect(translate('动画已创建。')).toBe('Animation created.');
    expect(translate('人物动画预览')).toBe('Character Animation Preview');
    expect(translate('无匹配动画')).toBe('No matching animations');
    expect(translate('已载入动画')).toBe('Loaded animations');
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

  it('keeps original sources when Traditional Chinese and Japanese contain Han characters', async () => {
    document.body.innerHTML =
      '<button title="设置">打开模型</button><p>已选择 8 个体素</p>' +
      '<div data-no-localize>简体中文 繁體中文 日本語</div>';
    setLanguage('zh-TW');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelector('button')?.textContent).toBe('開啟模型');
    expect(document.querySelector('button')?.title).toBe('設定');
    setLanguage('ja');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelector('button')?.textContent).toBe('モデルを開く');
    document.querySelector('p')!.textContent = '已选择 9 个体素';
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelector('p')?.textContent).toBe('9 個のボクセルを選択');
    setLanguage('fr');
    expect(document.querySelector('button')?.textContent).toBe('Ouvrir un modèle');
    setLanguage('zh-CN');
    expect(document.querySelector('button')?.textContent).toBe('打开模型');
    expect(document.querySelector('p')?.textContent).toBe('已选择 9 个体素');
    expect(document.querySelector('[data-no-localize]')?.textContent).toBe('简体中文 繁體中文 日本語');
  });
});
