#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![tauri_plugin_sql::Migration {
    version: 1,
    description: "create_gapmap_ai_tables",
    sql: r#"
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        goal_type TEXT NOT NULL,
        known_background TEXT NOT NULL,
        analogy_domain TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS knowledge_trees (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        modules_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS interview_sessions (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL,
        current_question_index INTEGER NOT NULL,
        max_questions INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS interview_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        goal_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        diagnostic_tags_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        message_order INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS blindspot_reports (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL UNIQUE,
        mastered_json TEXT NOT NULL,
        fuzzy_json TEXT NOT NULL,
        missing_json TEXT NOT NULL,
        misconceptions_json TEXT NOT NULL,
        can_skip_for_now_json TEXT NOT NULL,
        next_focus_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS learning_paths (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        steps_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS concept_cards (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        concept_name TEXT NOT NULL,
        one_sentence TEXT NOT NULL,
        explanation TEXT NOT NULL,
        why_it_matters TEXT NOT NULL,
        learn_depth TEXT NOT NULL,
        common_misunderstandings_json TEXT NOT NULL,
        analogy TEXT NOT NULL,
        related_concepts_json TEXT NOT NULL,
        example TEXT NOT NULL,
        not_necessary_yet_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_interview_messages_session_id
        ON interview_messages(session_id, message_order);
      CREATE INDEX IF NOT EXISTS idx_concept_cards_goal_id
        ON concept_cards(goal_id, created_at);
    "#,
    kind: tauri_plugin_sql::MigrationKind::Up,
  }];

  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      save_api_key,
      get_api_key,
      delete_api_key,
      save_markdown_file
    ])
    .plugin(tauri_plugin_dialog::init())
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:gapmap-ai.db", migrations)
        .build(),
    )
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

const API_KEY_SERVICE: &str = "GapmapAI";
const API_KEY_ACCOUNT: &str = "ai-provider-api-key";

#[tauri::command]
fn save_api_key(api_key: String) -> Result<(), String> {
  let entry = api_key_entry()?;

  if api_key.trim().is_empty() {
    delete_api_key()
  } else {
    entry.set_password(&api_key).map_err(format_keyring_error)
  }
}

#[tauri::command]
fn get_api_key() -> Result<Option<String>, String> {
  let entry = api_key_entry()?;

  match entry.get_password() {
    Ok(api_key) => Ok(Some(api_key)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(error) => Err(format_keyring_error(error)),
  }
}

#[tauri::command]
fn delete_api_key() -> Result<(), String> {
  let entry = api_key_entry()?;

  match entry.delete_credential() {
    Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
    Err(error) => Err(format_keyring_error(error)),
  }
}

fn api_key_entry() -> Result<keyring::Entry, String> {
  keyring::Entry::new(API_KEY_SERVICE, API_KEY_ACCOUNT).map_err(format_keyring_error)
}

fn format_keyring_error(error: keyring::Error) -> String {
  format!("secure API key storage error: {error}")
}

#[tauri::command]
fn save_markdown_file(path: String, content: String) -> Result<(), String> {
  if path.trim().is_empty() {
    return Err("保存路径为空。".to_string());
  }

  std::fs::write(path, content).map_err(|error| format!("保存文件失败：{error}"))
}
