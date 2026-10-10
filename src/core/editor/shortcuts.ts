import type { ShortcutAction, ShortcutMap } from '../types';
export const shortcutEntries: readonly (readonly [ShortcutAction, string])[] = [
  ['toolSelect', '选择工具'], ['toolSculpt', '修改工具'], ['toolPaint', '绘色工具'],
  ['cameraForward', '视角前进'], ['cameraBack', '视角后退'], ['cameraLeft', '视角左移'], ['cameraRight', '视角右移'],
  ['deleteSelection', '删除体素'], ['marqueeThrough', '框选'],
  ['saveAs', '另存为'], ['openModel', '打开模型'], ['newModel', '新建模型'], ['closeTab', '关闭'],
  ['undo', '撤销'], ['redo', '重做'], ['nextTab', '下一个标签页'], ['previousTab', '上一个标签页'],
  ['overwrite', '覆盖保存'], ['keepOpen', '保持打开'], ['pinTab', '固定'], ['closeSaved', '关闭已保存'], ['closeAll', '全部关闭'],
];
export function orderedShortcuts(bindings: ShortcutMap) {
  const rank = (action: ShortcutAction) => {
    const binding = bindings[action];
    const keys = binding.split(/[+ ]/).length;
    return [keys, action === 'marqueeThrough' && keys === 2 ? -1 : 0, binding.startsWith('Ctrl+') ? 0 : 1, shortcutEntries.findIndex(row => row[0] === action)];
  };
  return [...shortcutEntries].sort((a, b) => {
    const left = rank(a[0]), right = rank(b[0]);
    for (let i = 0; i < left.length; i++) { const delta = left[i]! - right[i]!; if (delta) return delta; }
    return 0;
  });
}
// Studio's chord matching: accept either releasing or holding Ctrl for the second key.
export function matchShortcut(bindings: ShortcutMap, stroke: string, prefix = ''): { action?: ShortcutAction; prefix?: string } {
  const entries = Object.entries(bindings) as [ShortcutAction, string][];
  const sequence = prefix ? prefix + ' ' + stroke : stroke;
  let action = entries.find(([, key]) => key === sequence)?.[0];
  if (!action && prefix && stroke.startsWith('Ctrl+')) action = entries.find(([, key]) => key === prefix + ' ' + stroke.slice(5))?.[0];
  if (action) return { action };
  if (!prefix && entries.some(([, key]) => key.startsWith(stroke + ' '))) return { prefix: stroke };
  return {};
}
