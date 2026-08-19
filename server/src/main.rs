use axum::{
        response::Html,
    routing::{get, post, put},
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod db;
mod handlers;
mod middleware;
mod models;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "novel_server=debug,tower_http=debug".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Support DATABASE_PATH env var for persistent volume on Fly.io
    let db_path = std::env::var("DATABASE_PATH")
        .unwrap_or_else(|_| "novel_database.sqlite".to_string());
    let pool = db::init_db(&db_path)?;
    tracing::info!("SQLite Database connected & initialized: {}", db_path);

    let cors = CorsLayer::permissive();

    let api_routes = Router::new()
        // Auth
        .route("/auth/register", post(handlers::register))
        .route("/auth/login", post(handlers::login))
        .route("/auth/me", get(handlers::get_me))
        // Novels
        .route("/novels", get(handlers::get_novels).post(handlers::create_novel))
        .route("/novels/:id", get(handlers::get_novel_detail))
        // Chapters
        .route("/novels/:novel_id/chapters/:chapter_id", get(handlers::get_chapter_content))
        .route("/novels/:novel_id/chapters", post(handlers::create_chapter))
        .route("/chapters/:chapter_id/unlock", post(handlers::unlock_chapter))
        // Library
        .route("/library", get(handlers::get_user_library))
        .route("/library/bookmark", post(handlers::toggle_bookmark))
        .route("/library/progress", post(handlers::save_reading_progress))
        // Ads & Monetization
        .route("/ads/config", get(handlers::get_ad_config))
        .route("/admin/ads/config", put(handlers::update_ad_config))
        .route("/ads/claim-reward", post(handlers::claim_rewarded_ad_token))
        // Dashboards
        .route("/author/dashboard", get(handlers::get_author_dashboard))
        .route("/admin/dashboard", get(handlers::get_admin_dashboard))
        .route("/admin/novels/:id/feature", put(handlers::toggle_novel_featured))
        .with_state(pool);

    let app = Router::new()
        .nest("/api", api_routes)
        .route("/privacy-policy", get(privacy_policy_page))
        .route("/terms-of-service", get(terms_of_service_page))
        .nest_service("/uploads", ServeDir::new("uploads"))
        .layer(cors);

    // Read port from env var (Fly.io sets PORT=8080, local dev defaults to 4000)
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "4000".to_string())
        .parse()
        .unwrap_or(4000);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Naratika Rust Engine Server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn privacy_policy_page() -> Html<&'static str> {
    Html(r#"<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kebijakan Privasi - Naratika Platform</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
        h1, h2 { color: #1e293b; }
        .badge { background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Kebijakan Privasi (Privacy Policy)</h1>
    <p><em>Terakhir diperbarui: 18 Agustus 2026</em> <span class="badge">Google Play Store Compliant</span></p>
    <p>Aplikasi <strong>Naratika Hub</strong> ("Kami") berkomitmen untuk melindungi dan menghormati privasi pengguna ("Anda"). Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda sesuai dengan kebijakan pengembang Google Play Store.</p>
    
    <h2>1. Informasi yang Kami Kumpulkan</h2>
    <ul>
        <li><strong>Informasi Akun:</strong> Username, alamat email, dan data profil yang Anda berikan saat mendaftar.</li>
        <li><strong>Aktivitas Membaca:</strong> Riwayat bab novel yang dibaca, penanda buku (bookmarks), dan preferensi tampilan pembaca untuk menyinkronkan progres Anda.</li>
        <li><strong>Identifikasi Perangkat & Iklan:</strong> ID Iklan Google (Google Advertising ID) untuk menayangkan iklan relevan melalui Google AdMob.</li>
    </ul>

    <h2>2. Layanan Pihak Ketiga & Google AdMob</h2>
    <p>Aplikasi kami menggunakan layanan pihak ketiga, termasuk <strong>Google AdMob</strong>, untuk menampilkan iklan (Banner, Interstitial, dan Rewarded Video Ads). Google AdMob dapat mengumpulkan data perangkat dan informasi penggunaan anonim untuk menyajikan iklan yang dipersonalisasi. Kebijakan privasi Google dapat dilihat di <a href="https://policies.google.com/privacy" target="_blank">Google Privacy & Terms</a>.</p>

    <h2>3. Keamanan Data</h2>
    <p>Kami menerapkan standar keamanan enkripsi modern untuk menjaga data Anda tetap aman dan terlindungi dari akses tanpa izin.</p>

    <h2>4. Kontak Kami</h2>
    <p>Jika Anda memiliki pertanyaan seputar Kebijakan Privasi ini, hubungi tim kami di: <strong>support@naratika.com</strong></p>
</body>
</html>"#)
}

async fn terms_of_service_page() -> Html<&'static str> {
    Html(r#"<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Syarat & Ketentuan - Naratika Platform</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
        h1, h2 { color: #1e293b; }
    </style>
</head>
<body>
    <h1>Syarat & Ketentuan Layanan (Terms of Service)</h1>
    <p>Dengan menggunakan aplikasi Naratika Hub, Anda menyetujui hak cipta konten, etika kepenulisan karya original, dan ketentuan monetisasi platform.</p>
</body>
</html>"#)
}
