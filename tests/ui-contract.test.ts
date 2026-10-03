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
  it('keeps actionable help and warnings without development explanations', () => {
    for (const copy of [
      '所有解析与保存均在本机完成',
      '保存时自动维护体素索引',
      '编辑实时驱动预览',
      'Vue 3 + Tauri 2',
      'GRASS TEST WORLD',
      '调整文字尺寸',
      '拖放 XML 文件以打开',
      '按住 Ctrl 可同时选取多个体素',
      '覆盖保存前确认',
      '场景拖动可编辑',
      '可跨文件粘贴',
      '开始编辑 RWR 模型',
      '大型模型关闭后可提高帧率',
      'Running With Rifles 体素与动画编辑器。',
    ]) {
      expect(componentSource).not.toContain(copy);
    }
    for (const copy of ['此操作无法在磁盘上撤销', '该操作可通过撤销恢复']) {
      expect(componentSource).toContain(copy);
    }
    expect(controllerSource).not.toContain('载入动画 XML 后可同步预览骨骼与体素');
  });

  it('keeps only three settings pages and the marquee tool in the left rail', async () => {
    const settings = await Bun.file('src/components/SettingsDialog.vue').text();
    expect(uniqueMatches(settings, /data-settings-page="([^"]+)"/g)).toEqual([
      'settings',
      'shortcuts',
      'about',
    ]);
    const rail = await Bun.file('src/components/ToolRail.vue').text();
    expect(uniqueMatches(rail, /data-tool="([^"]+)"/g)).toEqual(['marquee']);
    expect(rail).toContain('data-shortcut-label="marqueeThrough"');
    expect(rail.slice(0, rail.indexOf('class="marquee-mode-menu"'))).not.toContain('<kbd');
    expect(componentSource).not.toContain('id="activeToolLabel"');
    expect(componentSource).not.toContain('id="emptyState"');
    expect(componentSource).not.toContain('id="characterPreviewAnimationSource"');
    expect(componentSource).not.toContain('id="characterPreviewVoxelSize"');
    expect(componentSource).not.toContain('体素跟随骨骼');
    expect(componentSource).not.toContain('id="animationVoxelToggle"');
    expect(componentSource).not.toContain('id="animationWorkbenchToggle"');
    expect(componentSource).toContain('id="animationWorkbenchTrigger"');
    expect(controllerSource).not.toContain('closeColorPicker');
  });

  it('preserves every character-preview control required by its controller', async () => {
    const preview = await Bun.file('src/editor/character-preview.ts').text();
    const ids = uniqueMatches(preview, /child\(root, '#([^']+)'\)/g);
    const providedIds = new Set(uniqueMatches(componentSource, /\bid="([^"]+)"/g));
    expect(ids.filter((id) => !providedIds.has(id))).toEqual([]);
    expect(ids).toContain('characterPreviewStatus');
    expect(preview).toContain('模型有 ${this.model.skeleton.length} 个骨骼点');
    expect(preview).not.toContain('个已绑定体素正在跟随');
  });
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
