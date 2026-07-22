# RWR Editor Next

面向 _Running With Rifles_ 模型制作流程的跨平台离线体素、骨骼与动画编辑器。项目使用 Vue 3 + TypeScript + Three.js 构建编辑界面，以 Tauri 2 + Rust 提供原生窗口和文件访问。

## 设计原则

- 模型 XML、骨骼绑定和动画读写保持平台无关，并以原编辑器行为作为兼容边界。
- Vue 负责界面结构，Three.js 编辑控制器负责场景交互，Tauri 只处理原生能力。
- 文件选择使用异步原生对话框；等待用户选择时不阻塞主窗口。
- 默认采用石墨黑与单一主题色组成的工业风界面，状态色仅用于成功或危险提示。
- 构建链只需要 Bun 与系统 Rust，不包含 Python、PowerShell 项目脚本或内联工具链。

## 目录结构

```text
src/
├─ components/          Vue 界面组件
├─ config/              设置、默认值与持久化
├─ core/                平台无关的模型、动画、颜色和摄像机算法
├─ editor/              Three.js 场景及编辑器交互控制器
├─ platform/            可注入、可测试的 Tauri 桌面桥接
└─ styles/              基础组件样式与工业主题
src-tauri/              Tauri/Rust 原生边界
tests/                  Bun 回归测试
docs/                   兼容契约和发布检查
scripts/tasks.mjs       跨平台开发、测试和构建任务
```

## 开发

所有平台需要 Bun 1.3+、通过 rustup 安装的系统 Rust stable，以及 [Tauri 对应平台的系统依赖](https://v2.tauri.app/start/prerequisites/)。

```sh
bun install
bun run test
bun run test:rust
bun run build:frontend
bun run dev
bun run build
```

`bun run build` 会依次安装锁定依赖、运行 JS 回归测试、执行 Vue 类型检查、构建前端、构建当前平台的 Tauri 安装包，并把便携程序及安装包复制到 `release/`。

普通用户只需运行发布产物，不需要安装 Bun、Rust、Python 或编译工具。兼容边界和发布前人工检查见 [兼容契约](docs/compatibility-contract.zh-CN.md)。
