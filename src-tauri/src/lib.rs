#[cfg_attr(mobile, tauri::mobile_entry_point)]
use tauri_plugin_log::{Target, TargetKind};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::Stderr),
                    Target::new(TargetKind::LogDir {
                        file_name: Some(String::from("splat.log")),
                    }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
