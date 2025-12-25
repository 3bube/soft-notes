mod db;

use tauri::{AppHandle, WebviewWindowBuilder, Manager};
use uuid::Uuid;
use chrono::Utc;
use rand::Rng;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn create_note(app: AppHandle, content: String, color: String) -> Result<String, String> {
    let note_id = Uuid::new_v4().to_string();
    let window_label = format!("note-{}", note_id);
    
    // Randomize position to avoid stacking all notes at (100, 100)
    let mut rng = rand::thread_rng();
    let x = rng.gen_range(50..400) as i32;
    let y = rng.gen_range(50..400) as i32;
    
    let now = Utc::now().to_rfc3339();
    let note = db::Note {
        id: note_id.clone(),
        title: String::new(),
        content,
        x,
        y,
        width: 230,
        height: 300,
        color,
        text_color: "#3d3d3d".to_string(),
        pinned: false,
        has_checkboxes: false,
        created_at: now.clone(),
        updated_at: now,
    };
    
    // Save to database
    let conn = db::init_db()?;
    db::insert_note(&conn, &note)?;

    let _webview = WebviewWindowBuilder::new(
        &app,
        &window_label,
        tauri::WebviewUrl::App("/index.html".into()),
    )
    .title("SoftNote")
    .inner_size(230.0, 300.0)
    .min_inner_size(150.0, 80.0)
    .max_inner_size(600.0, 800.0)
    .position(x as f64, y as f64)
    .decorations(false)
    .resizable(true)
    .transparent(true)
    .shadow(false)
    .disable_drag_drop_handler()
    .build()
    .map_err(|e| e.to_string())?;

    Ok(note_id)
}

#[tauri::command]
fn fetch_all_notes() -> Result<Vec<db::Note>, String> {
    let conn = db::init_db()?;
    db::fetch_all_notes(&conn)
}

#[tauri::command]
fn update_note(note: db::Note) -> Result<(), String> {
    let conn = db::init_db()?;
    db::update_note(&conn, &note)
}

#[tauri::command]
fn delete_note(id: String) -> Result<(), String> {
    let conn = db::init_db()?;
    db::delete_note(&conn, &id)
}

#[tauri::command]
fn show_menu_window(app: AppHandle, note_id: String, note_x: f64, note_y: f64) -> Result<(), String> {
    let menu_label = format!("menu-{}", note_id);
    
    // Position menu to the right of the note's top-right corner
    let menu_x = note_x + 240.0; // 230px note width + small gap
    let menu_y = note_y + 10.0;
    
    let _webview = WebviewWindowBuilder::new(
        &app,
        &menu_label,
        tauri::WebviewUrl::App("/menu.html".into()),
    )
    .title("SoftNotes Menu")
    .inner_size(160.0, 100.0)
    .position(menu_x, menu_y)
    .decorations(false)
    .resizable(false)
    .transparent(true)
    .shadow(false)
    .disable_drag_drop_handler()
    .always_on_top(true)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_note_window_position(app: AppHandle, note_id: String) -> Result<(f64, f64, f64, f64), String> {
    let window_label = format!("note-{}", note_id);
    let window = app.get_webview_window(&window_label)
        .ok_or_else(|| "Window not found".to_string())?;
    
    let pos = window.outer_position()
        .map_err(|e| format!("Failed to get position: {}", e))?;
    let size = window.outer_size()
        .map_err(|e| format!("Failed to get size: {}", e))?;
    
    Ok((pos.x as f64, pos.y as f64, size.width as f64, size.height as f64))
}

#[tauri::command]
fn debug_fetch_notes() -> Result<String, String> {
    let conn = db::init_db()?;
    let notes = db::fetch_all_notes(&conn)?;
    Ok(format!("Found {} notes", notes.len()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            create_note,
            fetch_all_notes,
            update_note,
            delete_note,
            show_menu_window,
            get_note_window_position,
            debug_fetch_notes
        ])
        .setup(|app| {
            // Set up system tray with menu
            use tauri::menu::{Menu, MenuItemBuilder};
            use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState};
            
            let new_note = MenuItemBuilder::with_id("new_note", "New Note").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let menu = Menu::with_items(app, &[&new_note, &quit])?;
            
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "quit" => {
                            std::process::exit(0);
                        }
                        "new_note" => {
                            let app_handle = app.clone();
                            let _ = create_note(app_handle, "New Note".to_string(), "yellow".to_string());
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        let app = tray.app_handle();
                        if let Ok(_) = create_note(app.clone(), "New Note".to_string(), "yellow".to_string()) {
                            // Created note
                        }
                    }
                })
                .build(app)?;

            // Create initial window on startup
            let app_handle = app.handle().clone();
            
            // Load existing notes from database
            match db::init_db() {
                Ok(conn) => {
                    match db::fetch_all_notes(&conn) {
                        Ok(notes) => {
                            // Create windows for all notes
                            for note in &notes {
                                let window_label = format!("note-{}", note.id);
                                let _ = WebviewWindowBuilder::new(
                                    &app_handle,
                                    &window_label,
                                    tauri::WebviewUrl::App("/index.html".into()),
                                )
                                .title("SoftNote")
                                .inner_size(note.width as f64, note.height as f64)
                                .min_inner_size(150.0, 80.0)
                                .max_inner_size(600.0, 800.0)
                                .position(note.x as f64, note.y as f64)
                                .decorations(false)
                                .resizable(true)
                                .transparent(true)
                                .shadow(false)
                                .disable_drag_drop_handler()
                                .build();
                            }
                            
                            // If no notes exist, create one initial note
                            if notes.is_empty() {
                                let note_id = Uuid::new_v4().to_string();
                                let window_label = format!("note-{}", note_id);
                                let now = Utc::now().to_rfc3339();
                                
                                let note = db::Note {
                                    id: note_id.clone(),
                                    title: String::new(),
                                    content: "Welcome to SoftNotes!".to_string(),
                                    x: 100,
                                    y: 100,
                                    width: 230,
                                    height: 300,
                                    color: "yellow".to_string(),
                                    text_color: "#3d3d3d".to_string(),
                                    pinned: false,
                                    has_checkboxes: false,
                                    created_at: now.clone(),
                                    updated_at: now,
                                };
                                
                                let _ = db::insert_note(&conn, &note);
                                
                                let _ = WebviewWindowBuilder::new(
                                    &app_handle,
                                    &window_label,
                                    tauri::WebviewUrl::App("/index.html".into()),
                                )
                                .title("SoftNote")
                                .inner_size(230.0, 300.0)
                                .min_inner_size(150.0, 80.0)
                                .max_inner_size(600.0, 800.0)
                                .position(100.0, 100.0)
                                .decorations(false)
                                .resizable(true)
                                .transparent(true)
                                .shadow(false)
                                .disable_drag_drop_handler()
                                .build();
                            }
                        }
                        Err(e) => {
                            eprintln!("Failed to fetch notes: {}", e);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to initialize database: {}", e);
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

