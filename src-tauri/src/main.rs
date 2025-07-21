// 防止在 Windows 上发布版本运行时出现额外的控制台窗口，不要移除！！
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod util;

use notify::{Event, EventKind, RecursiveMode, Watcher};
use std::path::PathBuf;
use std::sync::{mpsc::channel, Arc, Mutex};
use std::time::Duration;
// 使用 tauri 必要模块来构建应用程序
use crate::util::list_files_and_directories;
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Wry,
};
use log::log;

// 这是一个模拟的云客户端的占位符。
// 在真实应用中，你将在这里初始化你选择的云服务商的 SDK。
#[derive(Clone)]
struct CloudClient;

impl CloudClient {
    fn new() -> Self {
        // 在这里，你会用真实的凭证来初始化云客户端。
        println!("云客户端已初始化。");
        CloudClient
    }

    // 模拟将文件上传到云端。
    // 这是一个异步函数。
    async fn upload_file(&self, path: &PathBuf) -> Result<(), String> {
        let file_name = path
            .file_name()
            .unwrap_or_default()
            .to_str()
            .unwrap_or_default();
        println!("模拟操作：正在上传 '{}' 到云端...", file_name);

        // 在这里插入你真实的上传逻辑 (例如，使用 AWS S3 SDK)。
        // 比如：tokio::fs::read(path).await ... 然后发送数据

        // 模拟网络延迟
        tokio::time::sleep(Duration::from_secs(2)).await;

        println!("模拟操作：'{}' 上传完成。", file_name);
        Ok(())
    }
}

// 此函数在一个单独的线程中启动文件系统监视器，以避免阻塞主线程
fn start_file_watcher(app_handle: AppHandle<Wry>, path_to_watch: Arc<PathBuf>) {
    // 创建一个云客户端实例
    let cloud_client = CloudClient::new();

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
                        if let Err(e) = client.upload_file(&path).await {
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

// 主函数，启动 Tauri 应用程序
fn main() {
    // 初始化默认的 Tauri 构建器
    tauri::Builder::default()
        // 初始化进程插件
        .plugin(tauri_plugin_process::init())
        // 初始化更新插件
        .plugin(tauri_plugin_updater::Builder::new().build())
        // 初始化操作系统插件
        .plugin(tauri_plugin_os::init())
        // 初始化 HTTP 插件
        .plugin(tauri_plugin_http::init())
        // 设置应用程序初始化逻辑
        .setup(|app| {
            // 构建托盘图标
            let _tray = TrayIconBuilder::new()
                // 设置托盘图标为默认窗口图标
                .icon(app.default_window_icon().unwrap().clone())
                // 定义托盘图标的事件处理函数
                .on_tray_icon_event(|tray, event| match event {
                    // 响应鼠标左键点击事件
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        // 获取应用句柄
                        let app = tray.app_handle();
                        // 如果存在名为 "main" 的窗口，则显示并聚焦该窗口
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    // 其他事件不做处理
                    _ => {}
                })
                // 构建托盘图标
                .build(app)?;

            // 获取用户的文档目录路径
            let documents_path = app.path().document_dir().expect("无法找到文档目录");

            // 定义我们的同步文件夹路径
            let sync_dir = documents_path.join("MyCloudSyncApp");

            // 如果同步文件夹不存在，则创建它
            if !sync_dir.exists() {
                std::fs::create_dir_all(&sync_dir).expect("无法创建同步目录");
            }

            // 使用 Arc（原子引用计数）来安全地在线程间共享路径
            let sync_dir_arc = Arc::new(sync_dir.clone());

            // 启动文件监视器
            start_file_watcher(app.handle().clone(), sync_dir_arc);

            // 初始化完成
            Ok(())
        })
        // 初始化对话框插件
        .plugin(tauri_plugin_dialog::init())
        // 初始化窗口状态插件
        .plugin(tauri_plugin_window_state::Builder::new().build())
        // 初始化全局快捷键插件
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // 初始化 shell 插件
        .plugin(tauri_plugin_shell::init())
        // 初始化剪贴板插件
        .plugin(tauri_plugin_clipboard::init())
        // 注册 JS 通信处理函数
        .invoke_handler(tauri::generate_handler![list_files_and_directories])
        // 初始化文件系统插件
        .plugin(tauri_plugin_fs::init())
        // 初始化 store 插件
        .plugin(tauri_plugin_store::Builder::new().build())
        // 初始化 SQL 插件
        .plugin(tauri_plugin_sql::Builder::default().build())
        // 运行 Tauri 应用程序
        .run(tauri::generate_context!())
        // 异常处理：如果运行过程中出错，打印错误信息
        .expect("error while running tauri application");
}
