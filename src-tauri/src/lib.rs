use serde::Serialize;
use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
};
use tauri::{AppHandle, State};
use tauri_plugin_dialog::{DialogExt, FilePath};

const APP_NAME: &str = "RWR 体素编辑器 Next";
const APP_VERSION: &str = "0.6.0";

#[derive(Default)]
struct EditorFileState {
    writable_xml_paths: Mutex<HashSet<PathBuf>>,
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
    if path.extension().and_then(|value| value.to_str()).map(|value| value.eq_ignore_ascii_case("xml")) != Some(true) {
        path.set_extension("xml");
    }
    path
}

fn display_path(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn remember_writable_path(state: &State<'_, EditorFileState>, path: &Path) -> Result<PathBuf, String> {
    let canonical = path.canonicalize().map_err(|error| format!("无法确认文件路径：{error}"))?;
    state
        .writable_xml_paths
        .lock()
        .map_err(|_| "文件权限状态不可用。".to_string())?
        .insert(canonical.clone());
    Ok(canonical)
}

async fn pick_xml_file(app: &AppHandle) -> Result<Option<FilePath>, String> {
    let (sender, mut receiver) = tauri::async_runtime::channel(1);
    app.dialog()
        .file()
        .add_filter("RWR XML 文件", &["xml"])
        .pick_file(move |selected| {
            let _ = sender.try_send(selected);
        });
    receiver
        .recv()
        .await
        .ok_or_else(|| "文件选择器意外关闭。".to_string())
}

async fn choose_xml_save_path(app: &AppHandle, default_name: &str) -> Result<Option<FilePath>, String> {
    let (sender, mut receiver) = tauri::async_runtime::channel(1);
    app.dialog()
        .file()
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
    let Some(selected) = selected else { return Ok(None) };
    let path = selected.as_path().ok_or_else(|| "只能打开本地文件。".to_string())?.to_path_buf();
    let bytes = fs::read(&path).map_err(|error| format!("读取文件失败：{error}"))?;
    let mut text = String::from_utf8(bytes).map_err(|_| "文件不是有效的 UTF-8 XML。".to_string())?;
    if text.starts_with('\u{feff}') {
        text.remove(0);
    }
    let canonical = remember_writable_path(&state, &path)?;
    Ok(Some(OpenedTextFile {
        name: canonical.file_name().and_then(|value| value.to_str()).unwrap_or("model.xml").to_string(),
        path: display_path(&canonical),
        kind: kind.unwrap_or_else(|| "model".to_string()),
        text,
    }))
}

#[tauri::command]
async fn save_text_file(
    app: AppHandle,
    state: State<'_, EditorFileState>,
    default_name: String,
    text: String,
) -> Result<Option<SavedTextFile>, String> {
    let selected = choose_xml_save_path(&app, &default_name).await?;
    let Some(selected) = selected else { return Ok(None) };
    let path = ensure_xml_extension(
        selected.as_path().ok_or_else(|| "只能保存到本地文件。".to_string())?.to_path_buf(),
    );
    fs::write(&path, text.as_bytes()).map_err(|error| format!("保存文件失败：{error}"))?;
    let canonical = remember_writable_path(&state, &path)?;
    Ok(Some(SavedTextFile {
        name: canonical.file_name().and_then(|value| value.to_str()).unwrap_or("model.xml").to_string(),
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
    let canonical = requested.canonicalize().map_err(|error| format!("找不到要覆盖的文件：{error}"))?;
    let is_xml = canonical.extension().and_then(|value| value.to_str()).map(|value| value.eq_ignore_ascii_case("xml")) == Some(true);
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
        name: canonical.file_name().and_then(|value| value.to_str()).unwrap_or("model.xml").to_string(),
        path: display_path(&canonical),
    })
}

#[tauri::command]
fn app_info() -> String {
    serde_json::json!({ "name": APP_NAME, "version": APP_VERSION }).to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(EditorFileState::default())
        .invoke_handler(tauri::generate_handler![
            open_text_file,
            save_text_file,
            overwrite_text_file,
            app_info
        ])
        .run(tauri::generate_context!())
        .expect("failed to run RWR Editor");
}
