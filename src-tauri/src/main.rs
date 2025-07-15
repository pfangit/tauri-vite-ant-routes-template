// 防止在 Windows 上发布版本运行时出现额外的控制台窗口，不要移除！！
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// 使用 tauri 必要模块来构建应用程序
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

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
        .invoke_handler(tauri::generate_handler![])
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
