# RWR Editor Next

RWR Editor Next 是面向 _Running With Rifles_ 资源工作流的跨平台离线体素、骨骼与动画编辑器。它保留原版 RWR Editor 的 XML 行为与编辑能力，同时提供现代界面、非阻塞文件操作和可独立分发的原生桌面程序。

RWR Editor Next is a cross-platform, offline voxel, skeleton, and animation editor for _Running With Rifles_ asset workflows. Simplified Chinese is the default interface language, with complete English UI localization available in Settings.

## 主要功能

- 打开、创建、编辑并保存 RWR 模型 XML；支持安全覆盖确认与标准“另存为”流程。
- 选择、雕刻、绘色、取色、移动、可视框选和穿透框选体素。
- 可切换悬浮体素与紧密网格显示，并提供主题、主题色、亮度、字号、缩放和渲染质量设置。
- 读取骨骼与体素绑定，自动重新绑定最近骨骼，并在模型编辑后维护稳定索引。
- 载入、预览、创建和编辑动画 XML；绑定体素会随关键帧骨骼姿态运动。
- 在独立人物预览窗口中循环播放内置典型动作，并提供固定游戏化镜头、自由镜头、光照和体素尺寸预览。
- 可完全自定义编辑与视角快捷键，支持 WASD 相机相对移动和 Shift 加速。
- 简体中文与 English 界面可即时切换；语言资源与模型、动画领域逻辑保持分离。

## 技术结构

```text
src/
├─ components/          Vue 3 界面组件
├─ config/              设置、默认值与本地持久化
├─ core/                平台无关的模型、动画、颜色和摄像机算法
├─ editor/              Three.js 场景、交互和预览控制器
├─ i18n/                运行时语言目录与即时界面本地化
├─ platform/            可注入、可测试的 Tauri 桌面桥接
└─ styles/              工业风组件与主题样式
src-tauri/              Tauri 2 / Rust 原生文件边界
tests/                  Bun 自动化回归测试
docs/                   XML 兼容契约与发布检查
scripts/                跨平台 Bun 构建与资源维护任务
```

核心技术栈：

- Vue 3.5 + TypeScript：界面结构与组件化组织。
- Three.js：体素、骨骼、网格、选择和动画预览渲染。
- Tauri 2 + Rust：原生窗口、异步文件选择、受控覆盖写入和安装包生成。
- Bun：依赖、测试、格式检查、前端构建和跨平台任务编排。

模型与动画解析器位于 `src/core`，不依赖 Vue 或 Tauri。桌面原生边界只接收文本和路径信息，因此核心编辑行为可在 Bun 测试环境中独立验证。原始 XML 中未被编辑的模型结构会尽量保持语义不变。

## 开发与构建

需要 Bun 1.3+、通过 rustup 安装的系统 Rust stable，以及 [Tauri 2 对应平台依赖](https://v2.tauri.app/start/prerequisites/)。项目不使用 Python、PowerShell 构建脚本或仓库内嵌 Rust 工具链。

```sh
bun install
bun run test
bun run test:rust
bun run build:frontend
bun run dev
bun run build
```

`bun run build` 会安装锁定依赖、执行 JavaScript 回归测试与 Vue 类型检查、构建前端、调用系统 Rust 构建 Tauri，并将便携程序和平台安装包复制到 `release/`。最终用户无需安装 Bun、Rust 或编译工具。

XML 兼容边界与发布前检查见 [兼容契约](docs/compatibility-contract.zh-CN.md)。

## 许可

本项目采用 [GNU General Public License v3.0](LICENSE)。你可以依照 GPL-3.0 使用、研究、修改和再分发本项目；分发修改版本时需要继续提供相应源代码并保留相同许可。

项目仓库：[sfg129/RWR-Editor-Next](https://github.com/sfg129/RWR-Editor-Next)
