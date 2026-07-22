# RWR 体素编辑器 Next（Tauri）

面向 Running With Rifles 模型制作流程的跨平台离线体素、骨骼与动画编辑器。界面与编辑逻辑使用 TypeScript + Three.js，桌面原生边界使用 Tauri 2 + Rust。

## 架构

- `src/`：平台无关的界面、体素、骨骼、动画和设置逻辑。
- `src/desktop-api.ts`：可注入、可测试的桌面桥接接口。
- `src-tauri/`：原生窗口、文件对话框与受限文件写入。
- `scripts/tasks.mjs`：跨平台 Bun 构建、测试和开发任务；没有 PowerShell 项目脚本。
- `tests/`：Bun 原生测试。
- `兼容性与回归测试指标.md`：迁移与发布基准。

## 开发环境

所有平台需要：

- Bun 1.3 或更高版本。
- 通过 rustup 安装的系统 Rust stable。
- 对应平台的 Tauri 系统依赖。

Windows 需要 Microsoft C++ Build Tools 与 WebView2；macOS 需要 Xcode Command Line Tools；Linux 需要 WebKitGTK 等 Tauri 官方依赖。

## 常用命令

```sh
bun install
bun run test
bun run test:rust
bun run build:frontend
bun run dev
bun run build
```

`bun run build` 会依次安装锁定依赖、执行 JS 测试、构建前端、构建当前平台的 Tauri 安装包，并将便携二进制与安装包复制到 `release/`。

## 发布产物

- Windows：便携 `.exe` 与 NSIS `-setup.exe`。
- macOS：应用二进制与 `.dmg`。
- Linux：应用二进制与 `.AppImage`。

构建工具不会被放入产物；普通用户不需要安装 Bun、Rust、Python 或 Microsoft C++ Build Tools。
