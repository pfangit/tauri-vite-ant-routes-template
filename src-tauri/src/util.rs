// 了解更多关于 Tauri 命令的内容请访问：https://tauri.app/develop/calling-rust/

use std::{fs, io};
use std::path::Path;
use serde::{Deserialize, Serialize};

//  向用户提供问候，包含其名字。
// 
//  # 参数
// 
//  # 返回值
// 
//  返回一个包含用户名字的问候语字符串。
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileOrDir {
    name: String,
    path: String,
    is_directory: bool,
    children: Vec<FileOrDir>,
}

#[tauri::command]
/// 递归地列出目录下的所有文件和子目录，并返回一个包含文件和目录信息的向量
pub fn list_files_and_directories_internal<P: AsRef<Path>>(dir: P) -> io::Result<FileOrDir> {
    let path = dir.as_ref();
    let name = path.file_name().unwrap_or_default().to_string_lossy().into_owned();
    let is_directory = path.is_dir();
    let mut children = Vec::new();

    if is_directory {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let entry_path = entry.path();
            children.push(list_files_and_directories_internal(entry_path)?);
        }
    }

    Ok(FileOrDir {
        name,
        path: path.to_string_lossy().into_owned(),
        is_directory,
        children,
    })
}

#[tauri::command]
pub fn list_files_and_directories(dir_path: &str) -> Result<FileOrDir, String> {
    list_files_and_directories_internal(dir_path).map_err(|e| e.to_string())
}

//  运行 Tauri 应用程序的主入口点。
//
//  在移动平台上，该函数被标记为移动应用的入口点。
// #[cfg_attr(mobile, tauri::mobile_entry_point)]
// pub fn run() {
//     // 初始化默认的 Tauri 构建器
//     tauri::Builder::default()
//         // 初始化并添加 opener 插件
//         .plugin(tauri_plugin_opener::init())
//         // 注册 Tauri 命令处理函数
//         .invoke_handler(tauri::generate_handler![greet, list_files_and_directories])
//         // 运行 Tauri 应用程序
//         .run(tauri::generate_context!())
//         // 如果运行过程中出错，打印错误信息
//         .expect("error while running tauri application");
// }
