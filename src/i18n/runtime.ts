export type AppLanguage = 'zh-CN' | 'en';

const englishMessages: Record<string, string> = {
  'RWR 体素编辑器': 'RWR Voxel Editor',
  'RWR 体素编辑器 Next': 'RWR Voxel Editor Next',
  文件操作: 'File actions',
  文件: 'File',
  新建空模型: 'New empty model',
  '创建 1 个中心体素': 'Create one center voxel',
  保存: 'Save',
  覆盖当前模型文件: 'Overwrite the current model file',
  另存为: 'Save As',
  选择目录和文件名: 'Choose a folder and file name',
  打开模型: 'Open Model',
  载入动画: 'Load Animation',
  撤销: 'Undo',
  重做: 'Redo',
  编辑工具: 'Editing tools',
  选择: 'Select',
  雕刻: 'Sculpt',
  绘色: 'Paint',
  取色: 'Pick Color',
  移动: 'Move',
  框选: 'Marquee',
  '框选 · 穿透框选': 'Marquee · Through',
  框选模式: 'Marquee mode',
  穿透框选: 'Through Marquee',
  选中框内的所有体素: 'Select all voxels inside the rectangle',
  可视框选: 'Visible Marquee',
  仅选中可见的第一层体素: 'Select only the first visible voxel layer',
  设置: 'Settings',
  当前颜色: 'Current color',
  颜色选择器: 'Color picker',
  尚未载入模型: 'No model loaded',
  请选择一个RWR模型XML: 'Choose an RWR model XML file',
  场景光照: 'Scene lighting',
  柔和: 'Soft',
  标准: 'Standard',
  明亮: 'Bright',
  颜色校对: 'Color proofing',
  预览人物模型效果: 'Preview Character',
  关闭预览: 'Close Preview',
  当前工具: 'Current tool',
  切换编辑工具: 'Switch editing tool',
  操作模式: 'Operation mode',
  '左键添加 / 右键删除': 'Left click add / Right click remove',
  '左键删除 / 右键添加': 'Left click remove / Right click add',
  移动操作台: 'Move Workbench',
  清除: 'Clear',
  按住Ctrl可同时选取多个体素: 'Hold Ctrl to select multiple voxels',
  未选择体素: 'No voxels selected',
  请先载入带骨骼的模型: 'Load a model with a skeleton first',
  移动所选体素: 'Move selected voxels',
  'Y 轴正向': 'Positive Y axis',
  'Y 轴负向': 'Negative Y axis',
  'Y 轴': 'Y axis',
  删除所选体素: 'Delete Selected Voxels',
  开始编辑RWR模型: 'Start Editing an RWR Model',
  打开角色XML或创建包含一个中心体素的新模型所有解析与保存均在本机完成:
    'Open a character XML file or create a new model with one center voxel. Parsing and saving stay on this device.',
  选择模型文件: 'Choose Model File',
  新建空文件: 'New Empty File',
  也可以将XML拖放到工作区: 'You can also drop an XML file into the workspace',
  透视视图: 'Perspective View',
  '视角旋转 · 透视': 'View Rotation · Perspective',
  '场景旋转 · 透视': 'Scene Rotation · Perspective',
  就绪: 'Ready',
  体素: 'Voxels',
  已选: 'Selected',
  骨骼点: 'Bones',
  未加载: 'Not loaded',
  动画工作台: 'Animation Workbench',
  点击展开或收起动画工作台: 'Click to expand or collapse the animation workbench',
  未载入动画: 'No animation loaded',
  骨骼与绑定: 'Skeleton & Binding',
  绑定组: 'Binding groups',
  未绑定体素: 'Unbound voxels',
  重新绑定到最近骨骼: 'Rebind to Nearest Bone',
  保存时自动维护体素索引重新绑定前可撤销:
    'Voxel indices are maintained when saving; rebinding can be undone.',
  动画预览与编辑: 'Animation Preview & Editing',
  关键帧与骨骼姿势: 'Keyframes and skeleton poses',
  预览: 'Preview',
  创建与编辑: 'Create & Edit',
  未载入动画文件: 'No animation file loaded',
  体素跟随骨骼: 'Voxels Follow Skeleton',
  请先载入模型: 'Load a model first',
  载入动画XML后可同步预览骨骼与体素:
    'Load an animation XML file to preview the skeleton and voxels together.',
  新建: 'New',
  复制: 'Duplicate',
  删除: 'Delete',
  动画名称: 'Animation name',
  总时长: 'Duration',
  速度: 'Speed',
  速度随机: 'Speed spread',
  循环播放: 'Loop playback',
  关键帧: 'Keyframes',
  没有关键帧: 'No keyframes',
  新增: 'Add',
  '＋ 新增': '＋ Add',
  '帧时间（秒）': 'Frame time (seconds)',
  骨骼点位置: 'Bone position',
  场景拖动可编辑: 'Drag in the scene to edit',
  恢复模型位置: 'Restore Model Position',
  导出动画XML: 'Export Animation XML',
  编辑实时驱动预览仅导出时写入新文件:
    'Edits drive the preview in real time and are written only when exported.',
  性能: 'Performance',
  功能: 'Behavior',
  外观: 'Appearance',
  快捷键: 'Shortcuts',
  语言: 'Language',
  关于: 'About',
  性能预设: 'Performance preset',
  调整抗锯齿阴影和渲染倍率: 'Adjust antialiasing, shadows, and render scale',
  高质量: 'High quality',
  均衡: 'Balanced',
  高性能: 'High performance',
  颜色校对接近平涂效果: 'Color proofing approximates a flat-shaded view',
  渲染倍率: 'Render scale',
  抗锯齿: 'Antialiasing',
  让体素边缘更平滑: 'Smooth voxel edges',
  动态阴影: 'Dynamic shadows',
  大型模型关闭后可提高帧率: 'Disable for better performance on large models',
  显示网格: 'Show grid',
  显示地面坐标参考: 'Show the ground coordinate reference',
  体素显示模式: 'Voxel display mode',
  悬浮模式接近实际渲染外观网格模式紧密贴合并绘制体素边线:
    'Floating mode resembles the rendered model; grid mode packs voxels tightly and draws edges.',
  '悬浮模式（默认）': 'Floating (default)',
  网格模式: 'Grid',
  完成框选操作后自动切换: 'After marquee selection',
  进行框选后是否自动切换工具: 'Choose whether to switch tools after a marquee selection',
  不自动切换: 'Do not switch',
  '切换到选择工具（默认）': 'Switch to Select (default)',
  切换到上一个工具: 'Switch to previous tool',
  左键旋转模式: 'Left-drag rotation mode',
  '视角-直接旋转摄像头；场景-围绕模型旋转': 'View rotates the camera directly; Scene orbits around the model',
  '视角（默认）': 'View (default)',
  场景: 'Scene',
  相机移动速度: 'Camera movement speed',
  '· Shift 双倍速度': '· Shift doubles speed',
  自动恢复: 'Automatic recovery',
  在本机保存最近编辑快照: 'Keep the latest editing snapshot on this device',
  删除时确认: 'Confirm deletion',
  删除多个体素时要求二次确认: 'Ask for confirmation when deleting multiple voxels',
  覆盖保存前确认: 'Confirm overwrite',
  覆盖当前模型前要求确认: 'Ask before overwriting the current model',
  主题: 'Theme',
  切换深色或浅色界面: 'Switch between dark and light interfaces',
  深色: 'Dark',
  浅色: 'Light',
  字体大小: 'Font size',
  调整文字尺寸: 'Adjust interface text size',
  '标准（16 px）': 'Standard (16 px)',
  '大（18 px）': 'Large (18 px)',
  '特大（20 px）': 'Extra large (20 px)',
  主题颜色: 'Accent color',
  用于按钮选择框和状态提示: 'Used by buttons, selections, and status indicators',
  界面亮度: 'Interface brightness',
  界面缩放: 'Interface scale',
  快捷键设置: 'Shortcut Settings',
  新建模型: 'New model',
  覆盖保存: 'Overwrite save',
  删除体素: 'Delete voxels',
  选择工具: 'Select tool',
  雕刻工具: 'Sculpt tool',
  绘色工具: 'Paint tool',
  取色工具: 'Color picker tool',
  移动工具: 'Move tool',
  视角前进: 'Camera forward',
  视角后退: 'Camera back',
  视角左移: 'Camera left',
  视角右移: 'Camera right',
  界面语言: 'Interface language',
  后续可添加语言包而不改动核心: 'Language resources remain separate from the editor core',
  简体中文: 'Simplified Chinese',
  '版本 0.6.0 · Vue 3 + Tauri 2': 'Version 0.6.0 · Vue 3 + Tauri 2',
  面向RunningWithRifles资源工作流的离线体素骨骼与动画编辑器解析编辑和保存均在本机完成并以原版XML行为为兼容基准:
    'An offline voxel, skeleton, and animation editor for Running With Rifles asset workflows. Parsing, editing, and saving stay local, with the original XML behavior as the compatibility baseline.',
  访问GitHub仓库: 'Open GitHub Repository',
  恢复默认: 'Restore Defaults',
  完成: 'Done',
  选择操作风格: 'Choose an Operation Style',
  只决定左键拖动时的旋转方式不改变模型或快捷键:
    'This only changes left-drag rotation. Models and shortcuts are unaffected.',
  '键盘移动 + 鼠标操作': 'Keyboard Movement + Mouse',
  WASD移动左键直接改变镜头朝向: 'Move with WASD and aim the camera directly with left drag',
  适合快速穿行: 'Best for quick navigation',
  纯鼠标操作: 'Mouse Only',
  左键拖动围绕场景和模型旋转: 'Left drag orbits around the scene and model',
  适合传统编辑器操作: 'Best for traditional editor controls',
  '仅影响“设置 → 功能 → 左键旋转模式”可随时调整':
    'Only changes Settings → Behavior → Left-drag rotation mode. You can change it at any time.',
  新建模型前如何处理当前文件: 'What should happen to the current file?',
  当前模型包含未保存修改取消不会改变任何内容:
    'The current model has unsaved changes. Cancel leaves everything unchanged.',
  放弃修改: 'Discard Changes',
  取消: 'Cancel',
  确认替换当前模型文件: 'Confirm Model File Replacement',
  原文件将被当前模型内容替换此操作无法在磁盘上撤销:
    'The current model will replace the original file. This cannot be undone on disk.',
  我确认要覆盖当前模型文件: 'I confirm that I want to overwrite the current model file',
  确认删除所选体素: 'Confirm Voxel Deletion',
  将删除当前选择的: 'This will delete the',
  个体素该操作可通过撤销恢复: 'selected voxels. You can undo this action.',
  确认删除: 'Delete',
  人物模型效果预览: 'Character Model Preview',
  关闭人物预览: 'Close character preview',
  人物模型预览场景: 'Character preview scene',
  'WASD 移动 · Shift 加速 · 左键转动视角 · 滚轮缩放': 'WASD move · Shift boost · Left drag look · Wheel zoom',
  预设动画: 'Preset animation',
  'running（循环）': 'running (loop)',
  'running, no weapon（循环）': 'running, no weapon (loop)',
  'crouch forward（循环）': 'crouch forward (loop)',
  'prone forward（循环）': 'prone forward (loop)',
  预览光照: 'Preview lighting',
  体素渲染尺寸: 'Voxel render size',
  固定镜头: 'Fixed camera',
  '固定镜头 · 左键拖动旋转人物模型 · 滚轮缩放': 'Fixed camera · Left drag rotates the character · Wheel zoom',
  固定后禁用镜头移动左键拖动可旋转人物模型:
    'Fixed mode disables camera movement; left drag rotates the character.',
  导出预览设定到剪贴板: 'Copy Preview Settings',
  参数用于确定后续固定的游戏化预览视角: 'These parameters describe the fixed in-game-style preview camera.',
  请先载入人物模型再打开人物效果预览: 'Load a character model before opening the character preview.',
  当前模型没有骨骼无法播放人物预览动画:
    'The current model has no skeleton and cannot play preview animations.',
  当前模型尚未绑定体素与骨骼请先完成骨骼绑定:
    'The current model has no voxel-to-skeleton bindings. Bind it before opening the preview.',
  当前系统不允许写入剪贴板: 'The current system does not allow clipboard access.',
  无法写入剪贴板: 'Could not write to the clipboard.',
  预览设定已写入剪贴板可以直接粘贴发送: 'Preview settings copied to the clipboard and ready to paste.',
  人物预览设定已复制到剪贴板: 'Character preview settings copied to the clipboard.',
  '工具：选择': 'Tool: Select',
  '工具：雕刻': 'Tool: Sculpt',
  '工具：绘色': 'Tool: Paint',
  '工具：取色': 'Tool: Pick Color',
  '工具：移动': 'Tool: Move',
  '工具：框选': 'Tool: Marquee',
};

const english = new Map(
  Object.entries(englishMessages).map(([source, translation]) => [lookupKey(source), translation]),
);

const patterns: Array<[RegExp, string]> = [
  [/^已载入 (\d+) 个体素$/, '$1 voxels loaded'],
  [/^模型已载入：(.*)$/, 'Model loaded: $1'],
  [/^已载入 (\d+) 个动画$/, '$1 animations loaded'],
  [/^(.*) · (\d+) 帧$/, '$1 · $2 frames'],
  [/^第 (\d+) 帧 · (.*)$/, 'Frame $1 · $2'],
  [/^(\d+) 帧$/, '$1 frames'],
  [/^骨骼点 (\d+)$/, 'Bone $1'],
  [/^已选择 (\d+) 个体素$/, '$1 voxels selected'],
  [/^范围 (.*)$/, 'Bounds $1'],
  [/^(\d+) \/ (\d+) 个体素已绑定$/, '$1 / $2 voxels bound'],
  [/^(\d+) \/ (\d+) 已绑定 · (\d+) 个保持原位$/, '$1 / $2 bound · $3 remain in place'],
  [/^已载入：(.*)$/, 'Loaded: $1'],
  [/^已保存：(.*)$/, 'Saved: $1'],
  [/^已覆盖：(.*)$/, 'Overwritten: $1'],
  [/^已另存为：(.*)$/, 'Saved as: $1'],
  [/^已覆盖保存：(.*)$/, 'Overwritten: $1'],
  [/^已导出：(.*)$/, 'Exported: $1'],
  [/^动画已导出：(.*)$/, 'Animation exported: $1'],
  [/^动画已保存：(.*)$/, 'Animation saved: $1'],
  [/^工具：(.*)$/, 'Tool: $1'],
  [/^框选了 (\d+) 个体素$/, 'Selected $1 voxels'],
  [/^已绘色 (\d+) 个体素$/, 'Painted $1 voxels'],
  [/^已移动 (\d+) 个体素$/, 'Moved $1 voxels'],
  [/^已删除 (\d+) 个体素$/, 'Deleted $1 voxels'],
  [/^已创建含 (\d+) 个基点体素的新模型$/, 'Created a new model with $1 base voxel(s)'],
  [/^即将替换：(.*)$/, 'Will replace: $1'],
  [/^快捷键 (.*) 已被占用$/, 'Shortcut $1 is already assigned.'],
  [/^撤销 \((.*)\)$/, 'Undo ($1)'],
  [/^重做 \((.*)\)$/, 'Redo ($1)'],
  [/^已为 (\d+) 个体素重新绑定骨骼$/, 'Rebound $1 voxels to the skeleton'],
  [/^(\d+) 个已绑定体素正在跟随 (.*) 动画。?$/, '$1 bound voxels are following the $2 animation.'],
  [/^模型有 (\d+) 个骨骼点；(.*) 预设提供 (\d+) 个。?$/, 'Model: $1 bones; $2 preset: $3.'],
  [/^内置 (.*) 动画无法读取。?$/, 'The built-in $1 animation could not be loaded.'],
  [/^人物预览界面元素不存在：(.*)$/, 'Character preview element not found: $1'],
];

const textSources = new WeakMap<Text, string>();
const attributeSources = new WeakMap<Element, Map<string, string>>();
const translatableAttributes = ['aria-label', 'title', 'placeholder'] as const;
let language: AppLanguage = 'zh-CN';
let observer: MutationObserver | null = null;

export function currentLanguage(): AppLanguage {
  return language;
}

function normalized(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function lookupKey(value: string): string {
  return normalized(value).replace(/[\s，。；：？、“”‘’（）()·/→+\-]/g, '');
}

export function translate(source: string): string {
  const content = normalized(source);
  const exact = english.get(lookupKey(content));
  if (exact) return exact;
  for (const [pattern, replacement] of patterns) {
    if (pattern.test(content)) return content.replace(pattern, replacement);
  }
  return source.trim();
}

function containsChinese(value: string): boolean {
  return /\p{Script=Han}/u.test(value);
}

function localizeTextNode(node: Text): void {
  const current = node.data;
  const currentContent = normalized(current);
  if (!currentContent) return;
  let source = textSources.get(node);
  if (!source || containsChinese(currentContent)) {
    source = currentContent;
    textSources.set(node, source);
  }
  const content = language === 'en' ? translate(source) : source;
  const leading = current.match(/^\s*/)?.[0] ?? '';
  const trailing = current.match(/\s*$/)?.[0] ?? '';
  const next = `${leading}${content}${trailing}`;
  if (next !== current) node.data = next;
}

function localizeAttribute(element: Element, name: (typeof translatableAttributes)[number]): void {
  const current = element.getAttribute(name);
  if (!current) return;
  let sources = attributeSources.get(element);
  if (!sources) {
    sources = new Map();
    attributeSources.set(element, sources);
  }
  let source = sources.get(name);
  if (!source || containsChinese(current)) {
    source = normalized(current);
    sources.set(name, source);
  }
  const next = language === 'en' ? translate(source) : source;
  if (next !== current) element.setAttribute(name, next);
}

function localizeTree(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) localizeTextNode(root as Text);
  if (root instanceof Element) {
    translatableAttributes.forEach((name) => localizeAttribute(root, name));
  }
  const walker = document.createTreeWalker(root, 0x1 | 0x4);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) localizeTextNode(node as Text);
    else translatableAttributes.forEach((name) => localizeAttribute(node as Element, name));
    node = walker.nextNode();
  }
}

export function setLanguage(nextLanguage: AppLanguage): void {
  language = nextLanguage;
  document.documentElement.lang = nextLanguage;
  localizeTree(document.documentElement);
}

export function initializeLocalization(initialLanguage: AppLanguage): void {
  if (!observer) {
    const Observer = globalThis.MutationObserver ?? document.defaultView?.MutationObserver;
    if (!Observer) throw new Error('MutationObserver is unavailable in this environment.');
    observer = new Observer((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') localizeTextNode(mutation.target as Text);
        else if (mutation.type === 'attributes') {
          localizeAttribute(
            mutation.target as Element,
            mutation.attributeName as (typeof translatableAttributes)[number],
          );
        } else {
          mutation.addedNodes.forEach(localizeTree);
        }
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...translatableAttributes],
    });
  }
  setLanguage(initialLanguage);
}
