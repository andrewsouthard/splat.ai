// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::menu::*;
use tauri::Emitter;
use tauri::Manager;
use tauri::{AppHandle, Wry};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let menu = make_menu(&app.handle()).unwrap();
            // Don't worry about the error
            let _ = app.set_menu(menu);
            Ok(())
        })
        .on_menu_event(|app_handle, event| {
            let binding = format!("{:?}", event.id())
                .replacen("MenuId(\"", "", 1)
                .replacen("\")", "", 1);
            let menu_id = binding.trim();
            match menu_id {
                "preferences" => {
                    if let Some(pref_window) = app_handle.get_webview_window("preferences") {
                        pref_window.show().unwrap();
                    } else {
                        let window = tauri::webview::WebviewWindowBuilder::new(
                            app_handle,
                            "Settings",
                            tauri::WebviewUrl::App("preferences.html".into()),
                        )
                        .title("Settings")
                        .resizable(false)
                        .build()
                        .unwrap();
                        window
                            .set_size(tauri::LogicalSize::new(600.0, 600.0))
                            .unwrap();

                        app_handle
                            .webview_windows()
                            .insert("preferences".to_string(), window);
                    }
                }
                "new-conversation" => {
                    app_handle.emit("new-conversation", "").unwrap();
                }
                "find" => {
                    app_handle.emit("find", "").unwrap();
                }
                "find-all" => {
                    app_handle.emit("find-all", "").unwrap();
                }
                _ => {
                    println!("Unknown menu event id: {:?}", menu_id);
                }
            }
        })
        .run(tauri::generate_context!())?;

    Ok(())
}

// Copied from tauri's menu.rs default function. Added "new" and "settings" options
fn make_menu(app_handle: &AppHandle) -> Result<Menu<Wry>, tauri::Error> {
    #[cfg(target_os = "macos")]
    const WINDOW_SUBMENU_ID: &str = "window-submenu";
    #[cfg(target_os = "macos")]
    let pkg_info = app_handle.package_info();
    let config = app_handle.config();
    let about_metadata = AboutMetadata {
        name: Some(pkg_info.name.clone()),
        version: Some(pkg_info.version.to_string()),
        copyright: config.bundle.copyright.clone(),
        authors: config.bundle.publisher.clone().map(|p| vec![p]),
        ..Default::default()
    };

    let window_menu = Submenu::with_id_and_items(
        app_handle,
        WINDOW_SUBMENU_ID,
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app_handle, None)?,
            &PredefinedMenuItem::maximize(app_handle, None)?,
            #[cfg(target_os = "macos")]
            &PredefinedMenuItem::separator(app_handle)?,
            &PredefinedMenuItem::close_window(app_handle, None)?,
        ],
    )?;

    let help_menu = Submenu::with_id_and_items(
        app_handle,
        HELP_SUBMENU_ID,
        "Help",
        true,
        &[
            #[cfg(not(target_os = "macos"))]
            &PredefinedMenuItem::about(app_handle, None, Some(about_metadata))?,
        ],
    )?;

    let menu = Menu::with_items(
        app_handle,
        &[
            #[cfg(target_os = "macos")]
            &Submenu::with_items(
                app_handle,
                pkg_info.name.clone(),
                true,
                &[
                    &PredefinedMenuItem::about(app_handle, None, Some(about_metadata))?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    // &MenuItem::new(app_handle, "Settings", true, Some("Cmd+,"))?,
                    &MenuItemBuilder::new("Settings")
                        .accelerator("CmdOrCtrl+,")
                        .id("preferences")
                        .build(app_handle)?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &PredefinedMenuItem::services(app_handle, None)?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &PredefinedMenuItem::hide(app_handle, None)?,
                    &PredefinedMenuItem::hide_others(app_handle, None)?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &PredefinedMenuItem::quit(app_handle, None)?,
                ],
            )?,
            #[cfg(not(any(
                target_os = "linux",
                target_os = "dragonfly",
                target_os = "freebsd",
                target_os = "netbsd",
                target_os = "openbsd"
            )))]
            &Submenu::with_items(
                app_handle,
                "File",
                true,
                &[
                    &MenuItemBuilder::new("New Conversation")
                        .accelerator("CmdOrCtrl+N")
                        .id("new-conversation")
                        .build(app_handle)?,
                    &PredefinedMenuItem::close_window(app_handle, None)?,
                    #[cfg(not(target_os = "macos"))]
                    &PredefinedMenuItem::quit(app_handle, None)?,
                ],
            )?,
            &Submenu::with_items(
                app_handle,
                "Edit",
                true,
                &[
                    &PredefinedMenuItem::undo(app_handle, None)?,
                    &PredefinedMenuItem::redo(app_handle, None)?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &PredefinedMenuItem::cut(app_handle, None)?,
                    &PredefinedMenuItem::copy(app_handle, None)?,
                    &PredefinedMenuItem::paste(app_handle, None)?,
                    &PredefinedMenuItem::select_all(app_handle, None)?,
                    &PredefinedMenuItem::separator(app_handle)?,
                    &MenuItemBuilder::new("Find")
                        .accelerator("CmdOrCtrl+F")
                        .id("find")
                        .build(app_handle)?,
                    &MenuItemBuilder::new("Find in Conversations")
                        .accelerator("CmdOrCtrl+Shift+F")
                        .id("find-all")
                        .build(app_handle)?,
                ],
            )?,
            #[cfg(target_os = "macos")]
            &Submenu::with_items(
                app_handle,
                "View",
                true,
                &[&PredefinedMenuItem::fullscreen(app_handle, None)?],
            )?,
            &window_menu,
            &help_menu,
        ],
    )?;

    Ok(menu)
}
