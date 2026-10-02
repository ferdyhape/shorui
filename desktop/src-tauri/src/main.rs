// Prevents an extra console window from popping up on Windows release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::TcpStream;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Duration;

use tauri::Manager;

/// The fixed localhost port the bundled backend listens on. Fixed (not dynamic) because this is
/// a single-user local app - see desktop/README.md for why that's an acceptable trade-off here.
/// Must match the port hardcoded in `desktop/backend_entry.py` (the actual source of truth for
/// what the backend binds to) and the `VITE_API_BASE` baked in by `desktop/scripts/sync.sh`.
const BACKEND_PORT: u16 = 47821;

/// Frontend's CORS origin on Windows, where the bundled frontend is served from Tauri's own
/// internal asset protocol rather than http(s). See desktop/README.md "CORS" section if this
/// ever needs confirming against a newer Tauri release.
const DESKTOP_CORS_ORIGINS: &str = r#"["tauri://localhost","https://tauri.localhost"]"#;

/// Holds the backend child process so it can be killed when the window closes.
struct BackendProcess(Mutex<Option<Child>>);

fn backend_binary_path(app: &tauri::AppHandle) -> PathBuf {
    let resource_dir = app
        .path()
        .resource_dir()
        .expect("resource dir must be resolvable - the app would not have started otherwise");
    resource_dir
        .join("binaries")
        .join("backend")
        .join(if cfg!(windows) {
            "shorui-backend.exe"
        } else {
            "shorui-backend"
        })
}

/// `None` when the bundled exe is missing - expected in `desktop/scripts/dev.sh` previews, which
/// point the window at the normal web dev server (`../dev.sh`) instead of a packaged backend.
fn spawn_backend(app: &tauri::AppHandle) -> Option<Child> {
    let path = backend_binary_path(app);
    if !path.is_file() {
        eprintln!(
            "[shorui] no bundled backend at {path:?} - assuming a dev preview against ../dev.sh"
        );
        return None;
    }
    match Command::new(&path)
        .env("SHORUI_DESKTOP", "1")
        .env("SHORUI_CORS_ORIGINS", DESKTOP_CORS_ORIGINS)
        .spawn()
    {
        Ok(child) => Some(child),
        Err(e) => {
            eprintln!("[shorui] failed to start the bundled backend at {path:?}: {e}");
            None
        }
    }
}

/// Polls the backend's port rather than the app's own `/api/health` route, so this has no HTTP
/// client dependency at all - a successful TCP connect is enough evidence the server is up.
fn wait_for_backend(max_attempts: u32) {
    for attempt in 0..max_attempts {
        if TcpStream::connect(("127.0.0.1", BACKEND_PORT)).is_ok() {
            return;
        }
        if attempt + 1 < max_attempts {
            std::thread::sleep(Duration::from_millis(150));
        }
    }
    // Not fatal: the window still opens, the frontend's own error banners take over
    // ("Cannot reach the server...") if the backend genuinely never came up.
}

fn main() {
    tauri::Builder::default()
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            let handle = app.handle().clone();
            let spawned = spawn_backend(&handle);
            let is_bundled = spawned.is_some();
            *app.state::<BackendProcess>().0.lock().unwrap() = spawned;
            if is_bundled {
                wait_for_backend(40); // ~6s worst case
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if let Some(mut child) = window
                    .state::<BackendProcess>()
                    .0
                    .lock()
                    .unwrap()
                    .take()
                {
                    let _ = child.kill();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running the Shorui desktop shell");
}
