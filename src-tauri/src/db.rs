use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
    pub color: String,
    #[serde(rename = "textColor")]
    pub text_color: String,
    pub pinned: bool,
    pub has_checkboxes: bool,
    pub created_at: String,
    pub updated_at: String,
}

pub fn get_db_path() -> PathBuf {
    let app_data = std::path::PathBuf::from(
        dirs::config_dir().unwrap_or_else(|| std::path::PathBuf::from("."))
    ).join("soft-notes");
    
    if !app_data.exists() {
        std::fs::create_dir_all(&app_data).expect("Failed to create app data dir");
    }
    
    app_data.join("soft-notes.db")
}

pub fn init_db() -> Result<rusqlite::Connection, String> {
    let db_path = get_db_path();
    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Create notes table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL DEFAULT '',
            content TEXT NOT NULL,
            x INTEGER NOT NULL DEFAULT 100,
            y INTEGER NOT NULL DEFAULT 100,
            width INTEGER NOT NULL DEFAULT 230,
            height INTEGER NOT NULL DEFAULT 300,
            color TEXT NOT NULL DEFAULT 'yellow',
            text_color TEXT NOT NULL DEFAULT '#3d3d3d',
            pinned INTEGER NOT NULL DEFAULT 0,
            has_checkboxes INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| format!("Failed to create notes table: {}", e))?;

    // Add title column if it doesn't exist (migration)
    let _ = conn.execute(
        "ALTER TABLE notes ADD COLUMN title TEXT NOT NULL DEFAULT ''",
        [],
    );

    // Rename textColor to text_color if needed (migration)
    let _ = conn.execute(
        "ALTER TABLE notes RENAME COLUMN textColor TO text_color",
        [],
    );

    // Add has_checkboxes column if it doesn't exist (migration)
    let _ = conn.execute(
        "ALTER TABLE notes ADD COLUMN has_checkboxes INTEGER NOT NULL DEFAULT 0",
        [],
    );

    // Create app_settings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    ).map_err(|e| format!("Failed to create app_settings table: {}", e))?;

    Ok(conn)
}

pub fn fetch_all_notes(conn: &rusqlite::Connection) -> Result<Vec<Note>, String> {
    let mut stmt = conn
        .prepare("SELECT id, title, content, x, y, width, height, color, text_color, pinned, has_checkboxes, created_at, updated_at FROM notes ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let notes = stmt
        .query_map([], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                x: row.get(3)?,
                y: row.get(4)?,
                width: row.get(5)?,
                height: row.get(6)?,
                color: row.get(7)?,
                text_color: row.get(8)?,
                pinned: row.get::<_, i32>(9)? != 0,
                has_checkboxes: row.get::<_, i32>(10)? != 0,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(notes)
}

pub fn insert_note(conn: &rusqlite::Connection, note: &Note) -> Result<(), String> {
    conn.execute(
        "INSERT INTO notes (id, title, content, x, y, width, height, color, text_color, pinned, has_checkboxes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        [
            &note.id,
            &note.title,
            &note.content,
            &note.x.to_string(),
            &note.y.to_string(),
            &note.width.to_string(),
            &note.height.to_string(),
            &note.color,
            &note.text_color,
            &(if note.pinned { 1 } else { 0 }).to_string(),
            &(if note.has_checkboxes { 1 } else { 0 }).to_string(),
            &note.created_at,
            &note.updated_at,
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_note(conn: &rusqlite::Connection, note: &Note) -> Result<(), String> {
    conn.execute(
        "UPDATE notes SET title = ?1, content = ?2, x = ?3, y = ?4, width = ?5, height = ?6, color = ?7, text_color = ?8, pinned = ?9, has_checkboxes = ?10, updated_at = ?11
         WHERE id = ?12",
        [
            &note.title,
            &note.content,
            &note.x.to_string(),
            &note.y.to_string(),
            &note.width.to_string(),
            &note.height.to_string(),
            &note.color,
            &note.text_color,
            &(if note.pinned { 1 } else { 0 }).to_string(),
            &(if note.has_checkboxes { 1 } else { 0 }).to_string(),
            &note.updated_at,
            &note.id,
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_note(conn: &rusqlite::Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM notes WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
