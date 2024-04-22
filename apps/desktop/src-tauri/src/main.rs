// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::sync::Mutex;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use serde::{Deserialize, Serialize};
use tauri::menu::MenuBuilder;
use tauri::menu::MenuItemBuilder;
use tauri::tray::ClickType;
use tauri::tray::TrayIconBuilder;
use tauri::Manager;
use tauri_plugin_positioner::Position;
use tauri_plugin_positioner::WindowExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_positioner::init())
        .setup(|app| {
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let login = MenuItemBuilder::with_id("login", "Login").build(app)?;
            let menu = MenuBuilder::new(app).items(&[&quit, &login]).build()?;
            TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "login" => {
                        let _ = app.emit("login-requested", "");
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => (),
                })
                .on_tray_icon_event(|tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                    if event.click_type == ClickType::Left {
                        let window = tray.app_handle().get_webview_window("main").unwrap();
                        // use TrayCenter as initial window position
                        tray.app_handle()
                            .get_webview_window("main")
                            .unwrap()
                            .as_ref()
                            .window()
                            .move_window(Position::TrayCenter)
                            .unwrap();
                        if window.is_visible().unwrap() {
                            window.hide().unwrap();
                        } else {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![setup_callback])
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
        .emit("login-tokens", info.clone())
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
