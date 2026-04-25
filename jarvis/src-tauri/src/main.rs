// Evita janela de console extra no Windows em builds de release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar a aplicação Tauri");
}
