// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::sync::Mutex;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use serde::{Deserialize, Serialize};
use tauri::CustomMenuItem;
use tauri::SystemTrayMenu;
use tauri::{Manager, SystemTray, SystemTrayEvent};
use tauri_plugin_positioner::Position;
use tauri_plugin_positioner::WindowExt;

fn main() {
    let tray = SystemTray::new().with_menu(
        SystemTrayMenu::new()
            .add_item(CustomMenuItem::new("login", "Login"))
            .add_item(CustomMenuItem::new("quit", "Quit")),
    );
    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .system_tray(tray)
        .invoke_handler(tauri::generate_handler![setup_callback])
        .on_menu_event(|event| {
            println!("{}", event.menu_item_id());
        })
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                tauri_plugin_positioner::on_tray_event(app, &event);
                let window = app.get_window("main").unwrap();
                // use TrayCenter as initial window position
                let _ = window.move_window(Position::TrayCenter);
                if window.is_visible().unwrap() {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "login" => {
                    let _ = app.emit_all("login-requested", "");
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Deserialize, Serialize, Clone)]
struct TokenData {
    access_token: String,
    refresh_token: String,
}

struct AppState {
    app_handle: Mutex<tauri::AppHandle>,
}

async fn callback(info: web::Json<TokenData>, state: web::Data<AppState>) -> String {
    state
        .app_handle
        .lock()
        .unwrap()
        .emit_all("login-tokens", info.clone())
        .unwrap();

    "Success!".to_string()
}

#[tauri::command]
async fn setup_callback(app_handle: tauri::AppHandle) -> u16 {
    let state = web::Data::new(AppState {
        app_handle: Mutex::new(app_handle),
    });
    let result = std::thread::spawn(move || {
        let local = tokio::task::LocalSet::new();
        tauri::async_runtime::block_on(local.run_until(async move {
            let bind = HttpServer::new(move || {
                App::new()
                    .app_data(state.clone())
                    .wrap(Cors::permissive())
                    .route("/callback", web::post().to(callback))
            })
            .bind(("127.0.0.1", 0))
            .unwrap();

            let port = bind.addrs().first().unwrap().port();

            tokio::task::spawn(bind.run());

            port
        }))
    });

    result.join().unwrap()
}
