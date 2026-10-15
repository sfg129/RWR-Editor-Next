use serde::Serialize;
use std::{
    collections::HashSet,
    ffi::OsString,
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
};
use tauri::{AppHandle, State, Manager};
use tauri_plugin_dialog::{DialogExt, FilePath};

const APP_NAME: &str = "RWR 体素编辑器 Next";
const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

fn owned_file_dialog(app: &AppHandle) -> Result<tauri_plugin_dialog::FileDialogBuilder<tauri::Wry>, String> {
    let owner = app.get_webview_window("main").ok_or_else(|| "主窗口已关闭".to_string())?;
    Ok(app.dialog().file().set_parent(&owner))
}

struct EditorFileState {
    writable_xml_paths: Mutex<HashSet<PathBuf>>,
    startup_xml_path: Mutex<Option<PathBuf>>,
}

impl EditorFileState {
    fn from_process_args() -> Self {
        Self {
            writable_xml_paths: Mutex::new(HashSet::new()),
            startup_xml_path: Mutex::new(first_xml_path(std::env::args_os().skip(1))),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OpenedTextFile {
    name: String,
    path: String,
    kind: String,
    text: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SavedTextFile {
    name: String,
    path: String,
}

fn ensure_xml_extension(mut path: PathBuf) -> PathBuf {
    if path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.eq_ignore_ascii_case("xml"))
        != Some(true)
    {
        path.set_extension("xml");
    }
    path
}

fn display_path(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn first_xml_path(args: impl IntoIterator<Item = OsString>) -> Option<PathBuf> {
    args.into_iter().map(PathBuf::from).find(|path| {
        path.is_file()
            && path
                .extension()
                .and_then(|value| value.to_str())
                .map(|value| value.eq_ignore_ascii_case("xml"))
                == Some(true)
    })
}

fn remember_writable_path(
    state: &State<'_, EditorFileState>,
    path: &Path,
) -> Result<PathBuf, String> {
    let canonical = path
        .canonicalize()
        .map_err(|error| format!("无法确认文件路径：{error}"))?;
    state
        .writable_xml_paths
        .lock()
        .map_err(|_| "文件权限状态不可用。".to_string())?
        .insert(canonical.clone());
    Ok(canonical)
}

fn read_xml_file(
    state: &State<'_, EditorFileState>,
    path: PathBuf,
    kind: String,
) -> Result<OpenedTextFile, String> {
    let is_xml = path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.eq_ignore_ascii_case("xml"))
        == Some(true);
    if !path.is_file() || !is_xml {
        return Err("只能打开本地 XML 文件。".to_string());
    }
    let bytes = fs::read(&path).map_err(|error| format!("读取文件失败：{error}"))?;
    let mut text =
        String::from_utf8(bytes).map_err(|_| "文件不是有效的 UTF-8 XML。".to_string())?;
    if text.starts_with('\u{feff}') {
        text.remove(0);
    }
    let canonical = remember_writable_path(state, &path)?;
    Ok(OpenedTextFile {
        name: canonical
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("model.xml")
            .to_string(),
        path: display_path(&canonical),
        kind,
        text,
    })
}

async fn pick_xml_file(app: &AppHandle) -> Result<Option<FilePath>, String> {
    let (sender, mut receiver) = tauri::async_runtime::channel(1);
    owned_file_dialog(app)?
        .add_filter("RWR XML 文件", &["xml"])
        .pick_file(move |selected| {
            let _ = sender.try_send(selected);
        });
    receiver
        .recv()
        .await
        .ok_or_else(|| "文件选择器意外关闭。".to_string())
}

async fn choose_xml_save_path(
    app: &AppHandle,
    default_name: &str,
) -> Result<Option<FilePath>, String> {
    let (sender, mut receiver) = tauri::async_runtime::channel(1);
    owned_file_dialog(app)?
        .add_filter("RWR XML 文件", &["xml"])
        .set_file_name(default_name)
        .save_file(move |selected| {
            let _ = sender.try_send(selected);
        });
    receiver
        .recv()
        .await
        .ok_or_else(|| "文件保存对话框意外关闭。".to_string())
}

#[tauri::command]
async fn open_text_file(
    app: AppHandle,
    state: State<'_, EditorFileState>,
    kind: Option<String>,
) -> Result<Option<OpenedTextFile>, String> {
    let selected = pick_xml_file(&app).await?;
    let Some(selected) = selected else {
        return Ok(None);
    };
    let path = selected
        .as_path()
        .ok_or_else(|| "只能打开本地文件。".to_string())?
        .to_path_buf();
    read_xml_file(&state, path, kind.unwrap_or_else(|| "model".to_string())).map(Some)
}

#[tauri::command]
fn open_dropped_text_file(
    state: State<'_, EditorFileState>,
    path: String,
) -> Result<OpenedTextFile, String> {
    read_xml_file(&state, PathBuf::from(path), "model".to_string())
}

#[tauri::command]
fn take_startup_text_file(
    state: State<'_, EditorFileState>,
) -> Result<Option<OpenedTextFile>, String> {
    let path = state
        .startup_xml_path
        .lock()
        .map_err(|_| "启动文件状态不可用。".to_string())?
        .take();
    path.map(|value| read_xml_file(&state, value, "model".to_string()))
        .transpose()
}

#[tauri::command]
async fn save_text_file(
    app: AppHandle,
    state: State<'_, EditorFileState>,
    default_name: String,
    text: String,
) -> Result<Option<SavedTextFile>, String> {
    let selected = choose_xml_save_path(&app, &default_name).await?;
    let Some(selected) = selected else {
        return Ok(None);
    };
    let path = ensure_xml_extension(
        selected
            .as_path()
            .ok_or_else(|| "只能保存到本地文件。".to_string())?
            .to_path_buf(),
    );
    fs::write(&path, text.as_bytes()).map_err(|error| format!("保存文件失败：{error}"))?;
    let canonical = remember_writable_path(&state, &path)?;
    Ok(Some(SavedTextFile {
        name: canonical
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("model.xml")
            .to_string(),
        path: display_path(&canonical),
    }))
}

#[tauri::command]
fn overwrite_text_file(
    state: State<'_, EditorFileState>,
    path: String,
    text: String,
) -> Result<SavedTextFile, String> {
    let requested = PathBuf::from(path);
    let canonical = requested
        .canonicalize()
        .map_err(|error| format!("找不到要覆盖的文件：{error}"))?;
    let is_xml = canonical
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.eq_ignore_ascii_case("xml"))
        == Some(true);
    if !canonical.is_file() || !is_xml {
        return Err("只能覆盖当前已打开的 XML 模型文件。".to_string());
    }
    let allowed = state
        .writable_xml_paths
        .lock()
        .map_err(|_| "文件权限状态不可用。".to_string())?
        .contains(&canonical);
    if !allowed {
        return Err("该文件未由本次编辑会话打开或保存，已拒绝覆盖。".to_string());
    }
    fs::write(&canonical, text.as_bytes()).map_err(|error| format!("覆盖保存失败：{error}"))?;
    Ok(SavedTextFile {
        name: canonical
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("model.xml")
            .to_string(),
        path: display_path(&canonical),
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ModelWorkspaceEntry { name: String, path: String, is_directory: bool, is_model: bool, children: Vec<ModelWorkspaceEntry> }
#[derive(Serialize)]
struct ModelWorkspace { root: String, entries: Vec<ModelWorkspaceEntry> }

// Studio's immediate-child listing: lazy recursion in the UI, directories first.
fn model_workspace_entries(path: &Path) -> Result<Vec<ModelWorkspaceEntry>, String> {
    let mut paths = fs::read_dir(path).map_err(|e| e.to_string())?.filter_map(Result::ok).map(|entry| entry.path()).collect::<Vec<_>>();
    paths.sort_by(|a,b| b.is_dir().cmp(&a.is_dir()).then_with(|| a.file_name().cmp(&b.file_name())));
    let mut result = Vec::new();
    for child in paths {
        let Ok(metadata) = fs::symlink_metadata(&child) else { continue };
        if metadata.file_type().is_symlink() { continue }
        result.push(ModelWorkspaceEntry { name: child.file_name().unwrap_or_default().to_string_lossy().into_owned(), path: display_path(&child), is_directory: metadata.is_dir(), is_model: metadata.is_file() && child.extension().and_then(|value| value.to_str()).is_some_and(|value| value.eq_ignore_ascii_case("xml")), children: Vec::new() });
    }
    Ok(result)
}
fn model_workspace(path: PathBuf) -> Result<ModelWorkspace, String> {
    let root = path.canonicalize().map_err(|e| e.to_string())?;
    if !root.is_dir() { return Err("Not a directory".into()) }
    Ok(ModelWorkspace { entries: model_workspace_entries(&root)?, root: display_path(&root) })
}
#[tauri::command]
fn scan_model_workspace(path: String) -> Result<ModelWorkspace, String> { model_workspace(PathBuf::from(path)) }
#[tauri::command]
fn list_model_workspace_dir(path: String) -> Result<Vec<ModelWorkspaceEntry>, String> {
    let root = PathBuf::from(path).canonicalize().map_err(|e| e.to_string())?;
    model_workspace_entries(&root)
}
#[tauri::command]
async fn choose_model_workspace(app: AppHandle) -> Result<Option<ModelWorkspace>, String> {
    let (sender, mut receiver) = tauri::async_runtime::channel(1);
    owned_file_dialog(&app)?.pick_folder(move |selected| { let _ = sender.try_send(selected); });
    let selected = receiver.recv().await.ok_or_else(|| "Folder chooser closed".to_string())?;
    selected.map(|file| file.as_path().ok_or_else(|| "Not a local folder".to_string()).and_then(|path| model_workspace(path.to_path_buf()))).transpose()
}
fn write_editor_session(path: &Path, text: &str) -> Result<(), String> {
    use std::io::Write;
    let value: serde_json::Value = serde_json::from_str(text).map_err(|e| e.to_string())?;
    if value["version"] != 1 || !value["tabs"].is_array() || !value["activeId"].is_string() { return Err("Invalid editor session".into()) }
    let parent = path.parent().ok_or_else(|| "Invalid session directory".to_string())?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let temp = parent.join(format!(".editor-session.{}.{}.tmp", std::process::id(), std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_nanos()));
    let result = (|| {
        let mut file = fs::File::create(&temp).map_err(|e| e.to_string())?;
        file.write_all(text.as_bytes()).map_err(|e| e.to_string())?; file.sync_all().map_err(|e| e.to_string())?; drop(file);
        fs::rename(&temp, path).map_err(|e| e.to_string())
    })();
    if result.is_err() { let _ = fs::remove_file(&temp); }
    result
}
#[tauri::command]
fn load_editor_session(app: AppHandle) -> Result<Option<String>, String> {
    let path = app.path().app_config_dir().map_err(|e| e.to_string())?.join("editor-session.json");
    if !path.exists() { return Ok(None) }
    fs::read_to_string(path).map(Some).map_err(|e| e.to_string())
}
#[tauri::command]
fn save_editor_session(app: AppHandle, text: String) -> Result<(), String> {
    let path = app.path().app_config_dir().map_err(|e| e.to_string())?.join("editor-session.json");
    write_editor_session(&path, &text)
}
#[tauri::command]
fn reveal_model_file(path: String) -> Result<(), String> {
    let file = PathBuf::from(path).canonicalize().map_err(|e| e.to_string())?;
    #[cfg(target_os = "windows")]
    let result = std::process::Command::new("explorer.exe").arg(format!("/select,{}", display_path(&file))).spawn();
    #[cfg(target_os = "macos")]
    let result = std::process::Command::new("open").arg("-R").arg(&file).spawn();
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    let result = std::process::Command::new("xdg-open").arg(file.parent().unwrap_or(&file)).spawn();
    result.map(|_| ()).map_err(|e| e.to_string())
}

#[tauri::command]
fn app_info() -> String {
    serde_json::json!({ "name": APP_NAME, "version": APP_VERSION }).to_string()
}

#[tauri::command]
fn system_locale() -> String {
    #[cfg(target_os = "windows")]
    {
        #[link(name = "kernel32")]
        extern "system" {
            fn GetUserDefaultLocaleName(buffer: *mut u16, length: i32) -> i32;
        }
        let mut buffer = [0u16; 85];
        // Windows regional format, rather than the UI/browser display language.
        let length = unsafe { GetUserDefaultLocaleName(buffer.as_mut_ptr(), buffer.len() as i32) };
        if length > 1 {
            return String::from_utf16_lossy(&buffer[..length as usize - 1]);
        }
    }
    std::env::var("LC_ALL")
        .or_else(|_| std::env::var("LC_MESSAGES"))
        .or_else(|_| std::env::var("LANG"))
        .unwrap_or_default()
        .split('.')
        .next()
        .unwrap_or_default()
        .replace('_', "-")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(EditorFileState::from_process_args())
        .invoke_handler(tauri::generate_handler![
            open_text_file,
            open_dropped_text_file,
            take_startup_text_file,
            save_text_file,
            overwrite_text_file,
            choose_model_workspace, scan_model_workspace, list_model_workspace_dir,
            load_editor_session, save_editor_session, reveal_model_file,
            app_info,
            system_locale
        ])
        .run(tauri::generate_context!())
        .expect("failed to run RWR Editor");
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn session_replaces_atomically_and_preserves_unsaved_payload() {
        let directory = std::env::temp_dir().join(format!("rwr-editor-session-{}", std::process::id()));
        fs::create_dir_all(&directory).unwrap();
        let path = directory.join("editor-session.json");
        let first = r#"{"version":1,"activeId":"","tabs":[]}"#;
        let second = r#"{"version":1,"activeId":"one","tabs":[{"dirty":true,"text":"edited"}]}"#;
        write_editor_session(&path, first).unwrap(); write_editor_session(&path, second).unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), second);
        assert!(write_editor_session(&path, "{}").is_err());
        assert_eq!(fs::read_dir(&directory).unwrap().count(), 1);
        fs::remove_dir_all(directory).unwrap();
    }
    #[test]
    fn workspace_lists_only_immediate_children() {
        let directory = std::env::temp_dir().join(format!("rwr-editor-workspace-{}", std::process::id()));
        fs::create_dir_all(directory.join("sub")).unwrap();
        fs::write(directory.join("tank.xml"), "<model/>").unwrap();
        fs::write(directory.join("sub/deeper.xml"), "<model/>").unwrap();
        let entries = model_workspace_entries(&directory).unwrap();
        assert_eq!(entries.len(), 2); assert!(entries[0].is_directory);
        assert!(entries[1].is_model); assert!(entries.iter().all(|entry| entry.children.is_empty()));
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    #[cfg(target_os = "windows")]
    fn reads_windows_regional_locale() {
        let locale = system_locale();
        assert!(!locale.is_empty());
        assert!(locale
            .chars()
            .all(|value| value.is_ascii_alphanumeric() || value == '-'));
    }

    #[test]
    fn finds_the_first_existing_xml_startup_argument() {
        let fixture_dir = std::env::temp_dir().join(format!(
            "rwr-editor-startup-argument-{}",
            std::process::id()
        ));
        fs::create_dir_all(&fixture_dir).expect("create startup argument fixture directory");
        let text_path = fixture_dir.join("ignored.txt");
        let xml_path = fixture_dir.join("拖入模型.XML");
        fs::write(&text_path, "ignored").expect("write non-XML fixture");
        fs::write(&xml_path, "<model />").expect("write XML fixture");

        let selected = first_xml_path([
            OsString::from("--ignored-option"),
            text_path.into_os_string(),
            xml_path.clone().into_os_string(),
        ]);

        assert_eq!(selected, Some(xml_path));
        fs::remove_dir_all(fixture_dir).expect("remove startup argument fixtures");
    }
}
