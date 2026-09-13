# RWR Editor Next

RWR Editor Next 是面向 _Running With Rifles_ 资源工作流的跨平台离线体素、骨骼与动画编辑器。它保留原版 RWR Editor 的 XML 行为与编辑能力，同时提供现代界面、非阻塞文件操作和可独立分发的原生桌面程序。

RWR Editor Next is a cross-platform, offline voxel, skeleton, and animation editor for _Running With Rifles_ asset workflows. Simplified Chinese is the default interface language, with complete English UI localization available in Settings.

## 技术结构

```text
src/
├─ components/          Vue 3 界面组件
├─ config/              设置、默认值与本地持久化
├─ core/                平台无关的模型、动画、颜色和摄像机算法
├─ editor/              Three.js 场景、交互和预览控制器
├─ i18n/                运行时语言目录与即时界面本地化
├─ platform/            可注入、可测试的 Tauri 桌面桥接
└─ styles/              组件与主题样式
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

## 正式发布资产

正式版本在 [Releases](https://github.com/sfg129/RWR-Editor-Next/releases) 提供以下三平台产物：

- Windows：NSIS 安装程序（`.exe`）与便携版（portable `.exe`）；
- macOS：磁盘映像（`.dmg`）与便携版（`.app.zip`）；
- Linux：Debian 包（`.deb`）与便携版（`.AppImage`）。

## 开发与构建

需要 Bun 1.3+、通过 rustup 安装的系统 Rust stable，以及 [Tauri 2 对应平台依赖](https://v2.tauri.app/start/prerequisites/)。

```sh
bun install
bun run test
bun run test:rust
bun run build:frontend
bun run dev
bun run build
```

`bun run build` 会安装锁定依赖、执行 JavaScript 回归测试与 Vue 类型检查、构建前端、调用系统 Rust 构建 Tauri，并将便携程序和平台安装包复制到 `release/`。最终用户无需安装 Bun、Rust 或编译工具。

GitHub Actions 会在 Windows、macOS 与 Linux 上执行持续集成。正式发布工作流需要手动输入一个已经存在的 GitHub Release 标签，并从对应标签构建及上传上述平台资产。

## 许可

本项目采用 [GNU General Public License v3.0](LICENSE)。你可以依照 GPL-3.0 使用、研究、修改和再分发本项目；分发修改版本时需要继续提供相应源代码并保留相同许可。

项目仓库：[sfg129/RWR-Editor-Next](https://github.com/sfg129/RWR-Editor-Next)
