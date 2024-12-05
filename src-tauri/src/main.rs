// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItem, Submenu},
    AppHandle, Manager,
};
use tokio::sync::Mutex;

mod chat;
mod llm;

#[tauri::command]
async fn send_message(
    message: String,
    state: tauri::State<'_, Arc<Mutex<chat::ChatState>>>,
) -> Result<String, String> {
    let mut chat_state = state.lock().await;
    chat_state.send_message(message).await
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    let context = Arc::new(Mutex::new(chat::ChatState::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            //let menu = create_menu(app.handle().clone())?;
            //app.set_menu(menu)?;
            Ok(())
        })
        .manage(context)
        .invoke_handler(tauri::generate_handler![send_message])
        .run(tauri::generate_context!())?;

    Ok(())
}

/*
fn create_menu(app_handle: AppHandle) -> Result<Menu, tauri::Error> {
    let app_submenu = Submenu::new(
        &app_handle,
        "App",
        Menu::new(&app_handle)?
            .add_item(MenuItem::new(&app_handle, "About Shout.AI", true, None::<&str>)?)?
            .add_separator()?
            .add_item(MenuItem::new(&app_handle, "Quit", true, None::<&str>)?)?,
    )?;

    let edit_submenu = Submenu::new(
        &app_handle,
        "Edit",
        Menu::new(&app_handle)?
            .add_item(MenuItem::new(&app_handle, "Undo", true, None::<&str>)?)?
            .add_item(MenuItem::new(&app_handle, "Redo", true, None::<&str>)?)?
            .add_separator()?
            .add_item(MenuItem::new(&app_handle, "Cut", true, None::<&str>)?)?
            .add_item(MenuItem::new(&app_handle, "Copy", true, None::<&str>)?)?
            .add_item(MenuItem::new(&app_handle, "Paste", true, None::<&str>)?)?,
    )?;

    Menu::new(&app_handle)
        .append_items(app_submenu)?
        //.add_submenu(edit_submenu)
}
*/
