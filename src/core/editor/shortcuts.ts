import type { ShortcutAction, ShortcutMap } from '../types';
import { matchBindings } from './shortcut-bindings';
export const shortcutEntries: readonly (readonly [ShortcutAction, string])[] = [
  ['toolSelect', '选择工具'], ['toolSculpt', '修改工具'], ['toolPaint', '绘色工具'],
  ['cameraForward', '视角前进'], ['cameraBack', '视角后退'], ['cameraLeft', '视角左移'], ['cameraRight', '视角右移'],
  ['deleteSelection', '删除体素'], ['marqueeThrough', '框选'],
  ['overwrite', '保存'], ['openModel', '打开模型'], ['newModel', '新建模型'], ['closeTab', '关闭'],
  ['undo', '撤销'], ['redo', '重做'], ['nextTab', '下一个标签页'], ['previousTab', '上一个标签页'],
  ['saveAs', '另存为'], ['keepOpen', '保持打开'], ['pinTab', '固定'], ['closeSaved', '关闭已保存'], ['closeAll', '全部关闭'],
];
export function orderedShortcuts(bindings: ShortcutMap, secondary?: ShortcutMap) {
  const rank = (action: ShortcutAction) => {
    const binding = bindings[action] || secondary?.[action] || '';
    const keys = binding ? binding.split(/[+ ]/).length : 99;
    return [keys, action === 'marqueeThrough' && keys === 2 ? -1 : 0, binding.startsWith('Ctrl+') ? 0 : 1, shortcutEntries.findIndex(row => row[0] === action)];
  };
  return [...shortcutEntries].sort((a, b) => {
    const left = rank(a[0]), right = rank(b[0]);
    for (let i = 0; i < left.length; i++) { const delta = left[i]! - right[i]!; if (delta) return delta; }
    return 0;
  });
}
// Studio's chord matching: accept either releasing or holding Ctrl for the second key.
export function matchShortcut(bindings: ShortcutMap, stroke: string, prefix = '', secondary = {} as ShortcutMap): { action?: ShortcutAction; prefix?: string } {
  return matchBindings(bindings, secondary, stroke, prefix);
}
