#!/usr/bin/env bun
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { delimiter } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bun = process.execPath;
const tool = (...parts) => join(root, 'node_modules', ...parts);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: options.env ?? process.env,
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function findVsWhere() {
  const programFilesX86 = process.env['ProgramFiles(x86)'];
  const candidates = [
    programFilesX86 && join(programFilesX86, 'Microsoft Visual Studio', 'Installer', 'vswhere.exe'),
    process.env.ProgramFiles &&
      join(process.env.ProgramFiles, 'Microsoft Visual Studio', 'Installer', 'vswhere.exe'),
  ].filter(Boolean);
  return candidates.find(existsSync);
}

function findCargo() {
  const probe = spawnSync('cargo', ['--version'], { encoding: 'utf8', shell: false });
  if (probe.status === 0) return 'cargo';
  const candidate = join(homedir(), '.cargo', 'bin', process.platform === 'win32' ? 'cargo.exe' : 'cargo');
  if (existsSync(candidate)) return candidate;
  throw new Error('未找到系统 Rust/Cargo。请通过 rustup 安装 stable 工具链。');
}

function prependPath(env, directory) {
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') ?? 'PATH';
  const current = env[pathKey] ?? '';
  const entries = current.split(delimiter).filter(Boolean);
  const normalize = (value) => (process.platform === 'win32' ? value.toLowerCase() : value);
  if (!entries.some((entry) => normalize(entry) === normalize(directory))) {
    env[pathKey] = `${directory}${delimiter}${current}`;
  }
}

function withNativeBuildEnvironment() {
  const env = { ...process.env };
  const cargo = findCargo();
  if (cargo !== 'cargo') prependPath(env, dirname(cargo));
  if (process.platform !== 'win32') return env;

  const linker = spawnSync('where.exe', ['link.exe'], { env, stdio: 'ignore', shell: false });
  if (linker.status === 0) return env;

  const vswhere = findVsWhere();
  if (!vswhere) throw new Error('未找到 Microsoft Visual Studio Build Tools（vswhere.exe）。');
  const query = spawnSync(
    vswhere,
    [
      '-latest',
      '-products',
      '*',
      '-requires',
      'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
      '-property',
      'installationPath',
    ],
    { encoding: 'utf8', shell: false },
  );
  const installationPath = query.stdout?.trim();
  if (query.status !== 0 || !installationPath)
    throw new Error('未找到包含 C++ 工具的 Visual Studio Build Tools。');

  const vcvars = join(installationPath, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat');
  if (!existsSync(vcvars)) throw new Error(`缺少 MSVC 环境脚本：${vcvars}`);
  const initialized = spawnSync('cmd.exe', ['/d', '/c', 'call', vcvars, '>nul', '&&', 'set'], {
    encoding: 'utf8',
    shell: false,
  });
  if (initialized.status !== 0) throw new Error('无法初始化 MSVC 编译环境。');
  for (const line of initialized.stdout.split(/\r?\n/)) {
    const separator = line.indexOf('=');
    if (separator > 0) env[line.slice(0, separator)] = line.slice(separator + 1);
  }
  // vcvars may rebuild PATH. Ensure the system Rust selected above is still
  // discoverable by the Tauri CLI and every process it launches.
  if (cargo !== 'cargo') prependPath(env, dirname(cargo));
  return env;
}

function install() {
  run(bun, ['install', '--frozen-lockfile', '--ignore-scripts']);
}

function test() {
  run(bun, ['test', 'tests']);
}

function frontendBuild() {
  run(bun, [tool('vue-tsc', 'bin', 'vue-tsc.js'), '--noEmit']);
  run(bun, [tool('vite', 'bin', 'vite.js'), 'build', '--base=./', '--outDir=dist', '--emptyOutDir']);
}

function format(write) {
  run(bun, [
    tool('prettier', 'bin', 'prettier.cjs'),
    write ? '--write' : '--check',
    'src',
    'tests',
    'scripts',
    'docs',
    'README.md',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
  ]);
}

function bundleName() {
  if (process.platform === 'win32') return 'nsis';
  if (process.platform === 'darwin') return 'dmg';
  return 'appimage';
}

function copyReleaseArtifacts() {
  const release = join(root, 'release');
  mkdirSync(release, { recursive: true });
  const target = join(root, 'src-tauri', 'target', 'release');
  const binary = join(target, process.platform === 'win32' ? 'rwr-editor.exe' : 'rwr-editor');
  if (existsSync(binary)) {
    copyFileSync(
      binary,
      join(release, process.platform === 'win32' ? 'RWR-Editor-Next.exe' : 'rwr-editor-next'),
    );
  }
  const bundleDir = join(target, 'bundle', bundleName());
  if (!existsSync(bundleDir)) return;
  const artifact = readdirSync(bundleDir).find((name) => /(-setup\.exe|\.dmg|\.AppImage)$/i.test(name));
  if (artifact) copyFileSync(join(bundleDir, artifact), join(release, artifact));
}

function tauri(args) {
  const env = withNativeBuildEnvironment();
  env.CARGO_HTTP_CHECK_REVOKE ??= 'false';
  env.CARGO_HTTP_MULTIPLEXING ??= 'false';
  run(bun, [tool('@tauri-apps', 'cli', 'tauri.js'), ...args], { env });
}

function rustCheck() {
  const env = withNativeBuildEnvironment();
  env.CARGO_HTTP_CHECK_REVOKE ??= 'false';
  env.CARGO_HTTP_MULTIPLEXING ??= 'false';
  run(findCargo(), ['check', '--manifest-path', join(root, 'src-tauri', 'Cargo.toml')], { env });
}

function check() {
  test();
  frontendBuild();
  rustCheck();
}

async function waitForPort(port, timeoutMs = 20_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const open = await new Promise((resolvePort) => {
      const socket = createServer()
        .once('error', () => resolvePort(true))
        .once('listening', function () {
          this.close(() => resolvePort(false));
        })
        .listen(port, '127.0.0.1');
      socket.unref();
    });
    if (open) return;
    await Bun.sleep(100);
  }
  throw new Error(`Vite did not start on port ${port}.`);
}

async function dev() {
  install();
  const vite = spawn(bun, [tool('vite', 'bin', 'vite.js'), '--host', '127.0.0.1', '--port', '5173'], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });
  const stopVite = () => {
    if (!vite.killed) vite.kill();
  };
  process.once('SIGINT', stopVite);
  process.once('SIGTERM', stopVite);
  try {
    await waitForPort(5173);
    tauri(['dev', '--no-watch']);
  } finally {
    stopVite();
  }
}

const [command = 'help', ...args] = process.argv.slice(2);
switch (command) {
  case 'install':
    install();
    break;
  case 'test':
    test();
    break;
  case 'check':
    check();
    break;
  case 'format':
    format(true);
    break;
  case 'format-check':
    format(false);
    break;
  case 'frontend-build':
    frontendBuild();
    break;
  case 'preview':
    run(bun, [tool('vite', 'bin', 'vite.js'), 'preview', '--host', '127.0.0.1']);
    break;
  case 'tauri':
    tauri(args);
    break;
  case 'rust-check':
    rustCheck();
    break;
  case 'build':
    install();
    test();
    frontendBuild();
    tauri(['build', '--bundles', bundleName()]);
    copyReleaseArtifacts();
    break;
  case 'dev':
    await dev();
    break;
  default:
    console.log(
      'Usage: bun scripts/tasks.mjs <install|test|check|format|format-check|frontend-build|rust-check|build|dev|preview|tauri>',
    );
}
