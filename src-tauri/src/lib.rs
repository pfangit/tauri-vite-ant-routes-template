// 了解更多关于 Tauri 命令的内容请访问：https://tauri.app/develop/calling-rust/

//  向用户提供问候，包含其名字。
// 
//  # 参数
// 
//  # 返回值
// 
//  返回一个包含用户名字的问候语字符串。
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

//  运行 Tauri 应用程序的主入口点。
// 
//  在移动平台上，该函数被标记为移动应用的入口点。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化默认的 Tauri 构建器
    tauri::Builder::default()
        // 初始化并添加 opener 插件
        .plugin(tauri_plugin_opener::init())
        // 注册 Tauri 命令处理函数
        .invoke_handler(tauri::generate_handler![greet])
        // 运行 Tauri 应用程序
        .run(tauri::generate_context!())
        // 如果运行过程中出错，打印错误信息
        .expect("error while running tauri application");
}
