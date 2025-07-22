use crate::service;
use notify::{Event, EventKind, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::mpsc::channel;
use std::sync::Arc;
// 了解更多关于 Tauri 命令的内容请访问：https://tauri.app/develop/calling-rust/
use std::{fs, io};
use tauri::{AppHandle, Emitter, Wry};

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


// 此函数在一个单独的线程中启动文件系统监视器，以避免阻塞主线程
pub(crate) fn start_file_watcher(app_handle: AppHandle<Wry>, path_to_watch: Arc<PathBuf>) {
    // 创建一个云客户端实例
    let cloud_client = service::CloudClient::new();

    // 创建一个新线程来处理文件监视
    std::thread::spawn(move || {
        let (tx, rx) = channel();

        // 创建一个推荐的监视器实例，并提供一个回调函数来处理事件
        let mut watcher = notify::recommended_watcher(move |res: Result<Event, _>| {
            match res {
                Ok(event) => {
                    // 我们只关心文件的创建和内容修改事件
                    if event.kind.is_create() || event.kind.is_modify() {
                        // 将有效事件发送到通道
                        tx.send(event).expect("无法发送事件");
                    }
                }
                Err(e) => println!("监视错误: {:?}", e),
            }
        })
            .expect("无法创建文件监视器");

        // 添加要监视的路径，并设置为递归模式
        match watcher.watch(&*path_to_watch, RecursiveMode::Recursive) {
            Ok(_) => println!("开始监控目录: {:?}", path_to_watch),
            Err(e) => {
                eprintln!("监控目录失败: {:?} - {:?}", path_to_watch, e);
                return;
            }
        }

        println!("已开始监视目录: {:?}", path_to_watch);

        // 创建一个 Tokio 运行时来执行我们的异步上传任务
        let rt = tokio::runtime::Runtime::new().unwrap();

        // 从通道接收文件变更事件
        for event in rx {
            let kind_str = match event.kind {
                EventKind::Create(_) => "create",
                EventKind::Remove(_) => "del",
                EventKind::Modify(_) => "rename",
                EventKind::Other => "other",
                // Ignore other event types
                _ => continue,
            };
            println!("---- 文件变更: {} - {}", kind_str, event.paths.len());
            // rename 时 paths是数组，0 旧名称 1 新名称
            for path in event.paths {
                let client = cloud_client.clone();
                let file_path = path.to_string_lossy().into_owned();
                let file_name = path.file_name().unwrap().to_str().unwrap().to_string();
                println!("---- 文件变更: {} - {} {}", kind_str, file_path, file_name);
                // 确保变更的是一个文件
                if path.is_file() || path.is_dir() {
                    // 向前端发送事件，告知同步正在进行
                    app_handle
                        .emit("sync-status", format!("正在同步: {}", file_name))
                        .unwrap();

                    // 在 Tokio 运行时中执行异步上传
                    rt.block_on(async {
                        if let Err(e) = client.upload_file_to_cloud(&path).await {
                            eprintln!("文件上传失败 {:?}: {}", path, e);
                            app_handle
                                .emit("sync-status", format!("同步失败: {}", file_name))
                                .unwrap();
                        } else {
                            // 成功后，通知前端恢复空闲状态
                            app_handle.emit("sync-status", "空闲").unwrap();
                        }
                    });
                }
            }
        }
    });
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
