use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use rusqlite::params;
use std::collections::HashMap;
use uuid::Uuid;
use chrono::Utc;

use crate::db::{hash_password, DbPool};
use crate::middleware::{create_jwt, AuthUser, MaybeAuthUser};
use crate::models::*;

pub async fn register(
    State(pool): State<DbPool>,
    Json(payload): Json<RegisterRequest>,
) -> impl IntoResponse {
    let conn = pool.lock().await;

    let role = payload.role.unwrap_or_else(|| "reader".to_string());
    if role != "reader" && role != "author" {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<AuthResponse>::err("Role harus reader atau author")),
        );
    }

    let user_id = format!("user-{}", Uuid::new_v4());
    let display_name = payload.display_name.unwrap_or_else(|| payload.username.clone());
    let pass_hash = hash_password(&payload.password);
    let now = Utc::now().to_rfc3339();

    let res = conn.execute(
        "INSERT INTO users (id, username, email, password_hash, display_name, role, coins, free_unlock_tokens, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            user_id,
            payload.username,
            payload.email,
            pass_hash,
            display_name,
            role,
            100,
            5,
            now
        ],
    );

    match res {
        Ok(_) => {
            let token = match create_jwt(&user_id, &payload.username, &role) {
                Ok(t) => t,
                Err(_) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(ApiResponse::<AuthResponse>::err("Gagal membuat token session")),
                    )
                }
            };

            let user = User {
                id: user_id,
                username: payload.username,
                email: payload.email,
                password_hash: String::new(),
                display_name,
                role,
                avatar_url: None,
                coins: 100,
                free_unlock_tokens: 5,
                created_at: now,
            };

            (
                StatusCode::CREATED,
                Json(ApiResponse::ok(AuthResponse { token, user })),
            )
        }
        Err(e) => {
            let msg = if e.to_string().contains("UNIQUE constraint failed") {
                "Username atau Email sudah terdaftar"
            } else {
                "Gagal mendaftarkan akun"
            };
            (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<AuthResponse>::err(msg)),
            )
        }
    }
}

pub async fn login(
    State(pool): State<DbPool>,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
    let conn = pool.lock().await;
    let pass_hash = hash_password(&payload.password);

    let mut stmt = match conn.prepare(
        "SELECT id, username, email, password_hash, display_name, role, avatar_url, coins, free_unlock_tokens, created_at
         FROM users WHERE (username = ?1 OR email = ?1) AND password_hash = ?2"
    ) {
        Ok(s) => s,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<AuthResponse>::err("Database query error")),
            )
        }
    };

    let user_res = stmt.query_row(params![payload.username_or_email, pass_hash], |row| {
        Ok(User {
            id: row.get(0)?,
            username: row.get(1)?,
            email: row.get(2)?,
            password_hash: String::new(),
            display_name: row.get(4)?,
            role: row.get(5)?,
            avatar_url: row.get(6)?,
            coins: row.get(7)?,
            free_unlock_tokens: row.get(8)?,
            created_at: row.get(9)?,
        })
    });

    match user_res {
        Ok(user) => {
            let token = match create_jwt(&user.id, &user.username, &user.role) {
                Ok(t) => t,
                Err(_) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(ApiResponse::<AuthResponse>::err("Gagal generate JWT token")),
                    )
                }
            };

            (
                StatusCode::OK,
                Json(ApiResponse::ok(AuthResponse { token, user })),
            )
        }
        Err(_) => (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<AuthResponse>::err("Username/Email atau Password salah")),
        ),
    }
}

pub async fn get_me(
    State(pool): State<DbPool>,
    auth: AuthUser,
) -> impl IntoResponse {
    let conn = pool.lock().await;

    let mut stmt = match conn.prepare(
        "SELECT id, username, email, password_hash, display_name, role, avatar_url, coins, free_unlock_tokens, created_at
         FROM users WHERE id = ?1"
    ) {
        Ok(s) => s,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<User>::err("Database error")),
            )
        }
    };

    match stmt.query_row(params![auth.0.sub], |row| {
        Ok(User {
            id: row.get(0)?,
            username: row.get(1)?,
            email: row.get(2)?,
            password_hash: String::new(),
            display_name: row.get(4)?,
            role: row.get(5)?,
            avatar_url: row.get(6)?,
            coins: row.get(7)?,
            free_unlock_tokens: row.get(8)?,
            created_at: row.get(9)?,
        })
    }) {
        Ok(user) => (StatusCode::OK, Json(ApiResponse::ok(user))),
        Err(_) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<User>::err("User tidak ditemukan")),
        ),
    }
}

#[derive(Debug, serde::Serialize)]
pub struct NovelListResponse {
    pub novels: Vec<Novel>,
    pub categories: Vec<String>,
    pub featured: Vec<Novel>,
}

pub async fn get_novels(
    State(pool): State<DbPool>,
    Query(params): Query<HashMap<String, String>>,
) -> impl IntoResponse {
    let conn = pool.lock().await;

    let category = params.get("category").map(|s| s.as_str());
    let search = params.get("search").map(|s| s.as_str());
    let sort = params.get("sort").map(|s| s.as_str()).unwrap_or("trending");

    let mut query = String::from(
        "SELECT n.id, n.title, n.slug, n.author_id, n.author_name, n.category, n.tags, n.synopsis, n.cover_url, n.status, n.views, n.rating, n.total_ratings, n.is_featured, n.created_at, n.updated_at,
         (SELECT COUNT(*) FROM chapters c WHERE c.novel_id = n.id) as total_chapters
         FROM novels n WHERE 1=1"
    );

    let mut bind_category = String::new();
    let mut bind_search = String::new();

    if let Some(cat) = category {
        if !cat.is_empty() && cat != "Semua" && cat != "All" {
            query.push_str(" AND n.category = ?1");
            bind_category = cat.to_string();
        }
    }

    if let Some(q) = search {
        if !q.is_empty() {
            let placeholder = if !bind_category.is_empty() { "?2" } else { "?1" };
            query.push_str(&format!(" AND (n.title LIKE {p} OR n.author_name LIKE {p} OR n.synopsis LIKE {p})", p=placeholder));
            bind_search = format!("%{}%", q);
        }
    }

    match sort {
        "popular" | "views" => query.push_str(" ORDER BY n.views DESC"),
        "top" | "rating" => query.push_str(" ORDER BY n.rating DESC, n.views DESC"),
        "new" => query.push_str(" ORDER BY n.created_at DESC"),
        _ => query.push_str(" ORDER BY n.is_featured DESC, n.views DESC"),
    }

    let mut stmt = match conn.prepare(&query) {
        Ok(s) => s,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<NovelListResponse>::err(&format!("Query error: {}", e))),
            )
        }
    };

    let parse_row = |row: &rusqlite::Row| -> rusqlite::Result<Novel> {
        let tags_raw: String = row.get(6)?;
        let tags: Vec<String> = serde_json::from_str(&tags_raw).unwrap_or_default();
        let is_featured_int: i64 = row.get(13)?;

        Ok(Novel {
            id: row.get(0)?,
            title: row.get(1)?,
            slug: row.get(2)?,
            author_id: row.get(3)?,
            author_name: row.get(4)?,
            category: row.get(5)?,
            tags,
            synopsis: row.get(7)?,
            cover_url: row.get(8)?,
            status: row.get(9)?,
            views: row.get(10)?,
            rating: row.get(11)?,
            total_ratings: row.get(12)?,
            is_featured: is_featured_int == 1,
            created_at: row.get(14)?,
            updated_at: row.get(15)?,
            total_chapters: row.get(16)?,
        })
    };

    let novels: Vec<Novel> = if !bind_category.is_empty() && !bind_search.is_empty() {
        stmt.query_map(params![bind_category, bind_search], parse_row).unwrap().filter_map(|r| r.ok()).collect()
    } else if !bind_category.is_empty() {
        stmt.query_map(params![bind_category], parse_row).unwrap().filter_map(|r| r.ok()).collect()
    } else if !bind_search.is_empty() {
        stmt.query_map(params![bind_search], parse_row).unwrap().filter_map(|r| r.ok()).collect()
    } else {
        stmt.query_map([], parse_row).unwrap().filter_map(|r| r.ok()).collect()
    };

    let mut cat_stmt = conn.prepare("SELECT DISTINCT category FROM novels").unwrap();
    let categories: Vec<String> = cat_stmt.query_map([], |row| row.get(0)).unwrap().filter_map(|r| r.ok()).collect();

    let mut feat_stmt = conn.prepare(
        "SELECT n.id, n.title, n.slug, n.author_id, n.author_name, n.category, n.tags, n.synopsis, n.cover_url, n.status, n.views, n.rating, n.total_ratings, n.is_featured, n.created_at, n.updated_at,
         (SELECT COUNT(*) FROM chapters c WHERE c.novel_id = n.id) as total_chapters
         FROM novels n WHERE n.is_featured = 1 ORDER BY n.views DESC LIMIT 5"
    ).unwrap();
    let featured: Vec<Novel> = feat_stmt.query_map([], parse_row).unwrap().filter_map(|r| r.ok()).collect();

    (
        StatusCode::OK,
        Json(ApiResponse::ok(NovelListResponse {
            novels,
            categories,
            featured,
        })),
    )
}

#[derive(Debug, serde::Serialize)]
pub struct NovelDetailResponse {
    pub novel: Novel,
    pub chapters: Vec<ChapterSummary>,
    pub is_bookmarked: bool,
    pub last_read_chapter_id: Option<String>,
}

pub async fn get_novel_detail(
    State(pool): State<DbPool>,
    Path(novel_id): Path<String>,
    maybe_auth: MaybeAuthUser,
) -> impl IntoResponse {
    let conn = pool.lock().await;

    let _ = conn.execute(
        "UPDATE novels SET views = views + 1 WHERE id = ?1",
        params![novel_id],
    );

    let mut stmt = match conn.prepare(
        "SELECT n.id, n.title, n.slug, n.author_id, n.author_name, n.category, n.tags, n.synopsis, n.cover_url, n.status, n.views, n.rating, n.total_ratings, n.is_featured, n.created_at, n.updated_at,
         (SELECT COUNT(*) FROM chapters c WHERE c.novel_id = n.id) as total_chapters
         FROM novels n WHERE n.id = ?1"
    ) {
        Ok(s) => s,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<NovelDetailResponse>::err("Database error")),
            )
        }
    };

    let novel = match stmt.query_row(params![novel_id], |row| {
        let tags_raw: String = row.get(6)?;
        let tags: Vec<String> = serde_json::from_str(&tags_raw).unwrap_or_default();
        let is_featured_int: i64 = row.get(13)?;

        Ok(Novel {
            id: row.get(0)?,
            title: row.get(1)?,
            slug: row.get(2)?,
            author_id: row.get(3)?,
            author_name: row.get(4)?,
            category: row.get(5)?,
            tags,
            synopsis: row.get(7)?,
            cover_url: row.get(8)?,
            status: row.get(9)?,
            views: row.get(10)?,
            rating: row.get(11)?,
            total_ratings: row.get(12)?,
            is_featured: is_featured_int == 1,
            created_at: row.get(14)?,
            updated_at: row.get(15)?,
            total_chapters: row.get(16)?,
        })
    }) {
        Ok(n) => n,
        Err(_) => {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<NovelDetailResponse>::err("Novel tidak ditemukan")),
            )
        }
    };

    let current_user_id = maybe_auth.0.as_ref().map(|u| u.sub.as_str());

    let mut is_bookmarked = false;
    let mut last_read_chapter_id = None;
    if let Some(uid) = current_user_id {
        let mut b_stmt = conn.prepare("SELECT last_chapter_id FROM bookmarks WHERE user_id = ?1 AND novel_id = ?2").unwrap();
        if let Ok(last_ch) = b_stmt.query_row(params![uid, novel_id], |row| row.get(0)) {
            is_bookmarked = true;
            last_read_chapter_id = last_ch;
        }
    }

    let mut ch_stmt = conn.prepare(
        "SELECT id, novel_id, chapter_number, title, word_count, is_vip, created_at
         FROM chapters WHERE novel_id = ?1 ORDER BY chapter_number ASC"
    ).unwrap();

    let mut chapters = Vec::new();
    let rows = ch_stmt.query_map(params![novel_id], |row| {
        let is_vip_int: i64 = row.get(5)?;
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, i64>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, i64>(4)?,
            is_vip_int == 1,
            row.get::<_, String>(6)?,
        ))
    }).unwrap();

    for r in rows.flatten() {
        let (ch_id, n_id, ch_num, ch_title, word_count, is_vip, created_at) = r;
        let mut is_unlocked = !is_vip;

        if is_vip {
            if let Some(uid) = current_user_id {
                if novel.author_id == uid || maybe_auth.0.as_ref().map(|u| u.role.as_str()) == Some("admin") {
                    is_unlocked = true;
                } else {
                    let mut unl_stmt = conn.prepare("SELECT COUNT(*) FROM unlocked_chapters WHERE user_id = ?1 AND chapter_id = ?2").unwrap();
                    let count: i64 = unl_stmt.query_row(params![uid, ch_id], |row| row.get(0)).unwrap_or(0);
                    if count > 0 {
                        is_unlocked = true;
                    }
                }
            }
        }

        chapters.push(ChapterSummary {
            id: ch_id,
            novel_id: n_id,
            chapter_number: ch_num,
            title: ch_title,
            word_count,
            is_vip,
            is_unlocked,
            created_at,
        });
    }

    (
        StatusCode::OK,
        Json(ApiResponse::ok(NovelDetailResponse {
            novel,
            chapters,
            is_bookmarked,
            last_read_chapter_id,
        })),
    )
}

pub async fn create_novel(
    State(pool): State<DbPool>,
    auth: AuthUser,
    Json(payload): Json<CreateNovelRequest>,
) -> impl IntoResponse {
    let conn = pool.lock().await;

    let mut u_stmt = conn.prepare("SELECT display_name FROM users WHERE id = ?1").unwrap();
    let author_name: String = match u_stmt.query_row(params![auth.0.sub], |row| row.get(0)) {
        Ok(name) => name,
        Err(_) => auth.0.username.clone(),
    };

    let novel_id = format!("novel-{}", Uuid::new_v4());
    let slug = payload.title.to_lowercase().replace(' ', "-").chars().filter(|c| c.is_alphanumeric() || *c == '-').collect::<String>();
    let tags_json = serde_json::to_string(&payload.tags).unwrap_or_else(|_| "[]".to_string());
    let default_cover = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80".to_string();
    let cover_url = payload.cover_url.unwrap_or(default_cover);
    let status = payload.status.unwrap_or_else(|| "ongoing".to_string());
    let now = Utc::now().to_rfc3339();

    let res = conn.execute(
        "INSERT INTO novels (id, title, slug, author_id, author_name, category, tags, synopsis, cover_url, status, views, rating, total_ratings, is_featured, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 0, 5.0, 1, 0, ?11, ?11)",
        params![
            novel_id,
            payload.title,
            slug,
            auth.0.sub,
            author_name,
            payload.category,
            tags_json,
            payload.synopsis,
            cover_url,
            status,
            now
        ],
    );

    match res {
        Ok(_) => {
            let created_novel = Novel {
                id: novel_id,
                title: payload.title,
                slug,
                author_id: auth.0.sub,
                author_name,
                category: payload.category,
                tags: payload.tags,
                synopsis: payload.synopsis,
                cover_url,
                status,
                views: 0,
                rating: 5.0,
                total_ratings: 1,
                is_featured: false,
                total_chapters: 0,
                created_at: now.clone(),
                updated_at: now,
            };
            (
                StatusCode::CREATED,
                Json(ApiResponse::ok_msg(created_novel, "Novel berhasil diterbitkan")),
            )
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Novel>::err(&format!("Gagal membuat novel: {}", e))),
        ),
    }
}

#[derive(Debug, serde::Serialize)]
pub struct ChapterContentResponse {
    pub chapter: Chapter,
    pub novel_title: String,
    pub total_chapters: i64,
    pub prev_chapter_id: Option<String>,
    pub next_chapter_id: Option<String>,
    pub is_locked: bool,
    pub unlock_cost_tokens: i64,
    pub unlock_cost_coins: i64,
    pub user_tokens: i64,
    pub user_coins: i64,
}

pub async fn get_chapter_content(
    State(pool): State<DbPool>,
    Path((novel_id, chapter_id)): Path<(String, String)>,
    maybe_auth: MaybeAuthUser,
) -> impl IntoResponse {
    let conn = pool.lock().await;

    let mut n_stmt = conn.prepare("SELECT title, author_id FROM novels WHERE id = ?1").unwrap();
    let (novel_title, author_id) = match n_stmt.query_row(params![novel_id], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))) {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<ChapterContentResponse>::err("Novel tidak ditemukan")),
            )
        }
    };

    let mut all_ch_stmt = conn.prepare("SELECT id, chapter_number FROM chapters WHERE novel_id = ?1 ORDER BY chapter_number ASC").unwrap();
    let all_chapters: Vec<(String, i64)> = all_ch_stmt.query_map(params![novel_id], |row| Ok((row.get(0)?, row.get(1)?))).unwrap().filter_map(|r| r.ok()).collect();

    let current_idx = all_chapters.iter().position(|(id, _)| id == &chapter_id);
    if current_idx.is_none() {
        return (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<ChapterContentResponse>::err("Bab tidak ditemukan")),
        );
    }
    let idx = current_idx.unwrap();
    let prev_chapter_id = if idx > 0 { Some(all_chapters[idx - 1].0.clone()) } else { None };
    let next_chapter_id = if idx + 1 < all_chapters.len() { Some(all_chapters[idx + 1].0.clone()) } else { None };
    let total_chapters = all_chapters.len() as i64;

    let mut ch_stmt = conn.prepare(
        "SELECT id, novel_id, chapter_number, title, content, word_count, is_vip, created_at, updated_at
         FROM chapters WHERE id = ?1"
    ).unwrap();

    let mut chapter = match ch_stmt.query_row(params![chapter_id], |row| {
        let is_vip_int: i64 = row.get(6)?;
        Ok(Chapter {
            id: row.get(0)?,
            novel_id: row.get(1)?,
            chapter_number: row.get(2)?,
            title: row.get(3)?,
            content: row.get(4)?,
            word_count: row.get(5)?,
            is_vip: is_vip_int == 1,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    }) {
        Ok(c) => c,
        Err(_) => {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<ChapterContentResponse>::err("Bab tidak ditemukan")),
            )
        }
    };

    let mut is_locked = false;
    let mut user_tokens = 0;
    let mut user_coins = 0;

    let current_user = maybe_auth.0.as_ref();
    if let Some(u) = current_user {
        let mut u_stmt = conn.prepare("SELECT free_unlock_tokens, coins FROM users WHERE id = ?1").unwrap();
        if let Ok((t, c)) = u_stmt.query_row(params![u.sub], |row| Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?))) {
            user_tokens = t;
            user_coins = c;
        }
    }

    if chapter.is_vip {
        let mut has_access = false;
        if let Some(u) = current_user {
            if u.sub == author_id || u.role == "admin" {
                has_access = true;
            } else {
                let mut unl_stmt = conn.prepare("SELECT COUNT(*) FROM unlocked_chapters WHERE user_id = ?1 AND chapter_id = ?2").unwrap();
                let count: i64 = unl_stmt.query_row(params![u.sub, chapter_id], |row| row.get(0)).unwrap_or(0);
                if count > 0 {
                    has_access = true;
                }
            }
        }

        if !has_access {
            is_locked = true;
            let teaser = chapter.content.chars().take(150).collect::<String>();
            chapter.content = format!("{}\n\n🔒 [KONTEN TERKUNCI]\nBab ini adalah bab VIP. Anda dapat membukanya secara GRATIS dengan menonton 1 video iklan singkat atau menggunakan Koin!", teaser);
        }
    }

    (
        StatusCode::OK,
        Json(ApiResponse::ok(ChapterContentResponse {
            chapter,
            novel_title,
            total_chapters,
            prev_chapter_id,
            next_chapter_id,
            is_locked,
            unlock_cost_tokens: 1,
            unlock_cost_coins: 10,
            user_tokens,
            user_coins,
        })),
    )
}

pub async fn create_chapter(
    State(pool): State<DbPool>,
    Path(novel_id): Path<String>,
    auth: AuthUser,
    Json(payload): Json<CreateChapterRequest>,
) -> impl IntoResponse {
    let conn = pool.lock().await;

    let mut n_stmt = conn.prepare("SELECT author_id FROM novels WHERE id = ?1").unwrap();
    let author_id: String = match n_stmt.query_row(params![novel_id], |row| row.get(0)) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<Chapter>::err("Novel tidak ditemukan")),
            )
        }
    };

    if author_id != auth.0.sub && auth.0.role != "admin" {
        return (
            StatusCode::FORBIDDEN,
            Json(ApiResponse::<Chapter>::err("Hanya penulis novel ini yang dapat menambahkan bab")),
        );
    }

    let chapter_number = match payload.chapter_number {
        Some(n) => n,
        None => {
            let mut count_stmt = conn.prepare("SELECT IFNULL(MAX(chapter_number), 0) + 1 FROM chapters WHERE novel_id = ?1").unwrap();
            count_stmt.query_row(params![novel_id], |row| row.get(0)).unwrap_or(1)
        }
    };

    let chapter_id = format!("{}-ch-{}", novel_id, chapter_number);
    let word_count = payload.content.split_whitespace().count() as i64;
    let is_vip_int = if payload.is_vip.unwrap_or(false) { 1 } else { 0 };
    let now = Utc::now().to_rfc3339();

    let res = conn.execute(
        "INSERT INTO chapters (id, novel_id, chapter_number, title, content, word_count, is_vip, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)",
        params![
            chapter_id,
            novel_id,
            chapter_number,
            payload.title,
            payload.content,
            word_count,
            is_vip_int,
            now
        ],
    );

    match res {
        Ok(_) => {
            let _ = conn.execute("UPDATE novels SET updated_at = ?1 WHERE id = ?2", params![now, novel_id]);

            let ch = Chapter {
                id: chapter_id,
                novel_id,
                chapter_number,
                title: payload.title,
                content: payload.content,
                word_count,
                is_vip: is_vip_int == 1,
                created_at: now.clone(),
                updated_at: now,
            };
            (
                StatusCode::CREATED,
                Json(ApiResponse::ok_msg(ch, "Bab baru berhasil diterbitkan")),
            )
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Chapter>::err(&format!("Gagal menambahkan bab: {}", e))),
        ),
    }
}

pub async fn unlock_chapter(
    State(pool): State<DbPool>,
    Path(chapter_id): Path<String>,
    auth: AuthUser,
    Json(payload): Json<HashMap<String, String>>,
) -> impl IntoResponse {
    let conn = pool.lock().await;

    let method = payload.get("method").map(|s| s.as_str()).unwrap_or("token");

    let mut u_stmt = conn.prepare("SELECT free_unlock_tokens, coins FROM users WHERE id = ?1").unwrap();
    let (tokens, coins): (i64, i64) = match u_stmt.query_row(params![auth.0.sub], |row| Ok((row.get(0)?, row.get(1)?))) {
        Ok(vals) => vals,
        Err(_) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(ApiResponse::<()>::err("User tidak valid")),
            )
        }
    };

    if method == "token" {
        if tokens < 1 {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<()>::err("Token gratis Anda habis. Tonton video iklan untuk mendapatkan token gratis!")),
            );
        }
        let _ = conn.execute("UPDATE users SET free_unlock_tokens = free_unlock_tokens - 1 WHERE id = ?1", params![auth.0.sub]);
    } else {
        if coins < 10 {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<()>::err("Koin Anda tidak cukup (butuh 10 koin).")),
            );
        }
        let _ = conn.execute("UPDATE users SET coins = coins - 10 WHERE id = ?1", params![auth.0.sub]);
    }

    let unl_id = format!("unl-{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    let _ = conn.execute(
        "INSERT OR IGNORE INTO unlocked_chapters (id, user_id, chapter_id, unlocked_at, method)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![unl_id, auth.0.sub, chapter_id, now, method],
    );

    (
        StatusCode::OK,
        Json(ApiResponse::ok_msg((), "Bab VIP berhasil dibuka!")),
    )
}

pub async fn get_user_library(
    State(pool): State<DbPool>,
    auth: AuthUser,
) -> impl IntoResponse {
    let conn = pool.lock().await;

    let mut stmt = conn.prepare(
        "SELECT b.id, b.user_id, b.novel_id, n.title, n.cover_url, n.category, b.last_chapter_id, b.last_chapter_number, b.last_read_at, b.scroll_percent,
         (SELECT COUNT(*) FROM chapters c WHERE c.novel_id = n.id) as total_chapters
         FROM bookmarks b
         JOIN novels n ON b.novel_id = n.id
         WHERE b.user_id = ?1
         ORDER BY b.last_read_at DESC"
    ).unwrap();

    let bookmarks: Vec<Bookmark> = stmt.query_map(params![auth.0.sub], |row| {
        Ok(Bookmark {
            id: row.get(0)?,
            user_id: row.get(1)?,
            novel_id: row.get(2)?,
            novel_title: row.get(3)?,
            novel_cover: row.get(4)?,
            novel_category: row.get(5)?,
            last_chapter_id: row.get(6)?,
            last_chapter_number: row.get(7)?,
            last_read_at: row.get(8)?,
            scroll_percent: row.get(9)?,
            total_chapters: row.get(10)?,
        })
    }).unwrap().filter_map(|r| r.ok()).collect();

    (StatusCode::OK, Json(ApiResponse::ok(bookmarks)))
}

pub async fn toggle_bookmark(
    State(pool): State<DbPool>,
    auth: AuthUser,
    Json(payload): Json<BookmarkToggleRequest>,
) -> impl IntoResponse {
    let conn = pool.lock().await;

    let mut check_stmt = conn.prepare("SELECT id FROM bookmarks WHERE user_id = ?1 AND novel_id = ?2").unwrap();
    let existing: Result<String, _> = check_stmt.query_row(params![auth.0.sub, payload.novel_id], |row| row.get(0));

    if let Ok(b_id) = existing {
        let _ = conn.execute("DELETE FROM bookmarks WHERE id = ?1", params![b_id]);
        (
            StatusCode::OK,
            Json(ApiResponse::ok_msg(false, "Dihapus dari Rak Buku")),
        )
    } else {
        let b_id = format!("bm-{}", Uuid::new_v4());
        let now = Utc::now().to_rfc3339();
        
        let mut ch_stmt = conn.prepare("SELECT id FROM chapters WHERE novel_id = ?1 ORDER BY chapter_number ASC LIMIT 1").unwrap();
        let first_ch: Option<String> = ch_stmt.query_row(params![payload.novel_id], |row| row.get(0)).ok();

        let _ = conn.execute(
            "INSERT INTO bookmarks (id, user_id, novel_id, last_chapter_id, last_chapter_number, last_read_at, scroll_percent)
             VALUES (?1, ?2, ?3, ?4, 1, ?5, 0.0)",
            params![b_id, auth.0.sub, payload.novel_id, first_ch, now],
        );
        (
            StatusCode::OK,
            Json(ApiResponse::ok_msg(true, "Ditambahkan ke Rak Buku")),
        )
    }
}

pub async fn save_reading_progress(
    State(pool): State<DbPool>,
    auth: AuthUser,
    Json(payload): Json<ReadingProgressRequest>,
) -> impl IntoResponse {
    let conn = pool.lock().await;
    let now = Utc::now().to_rfc3339();
    let scroll = payload.scroll_percent.unwrap_or(0.0);

    let b_id = format!("bm-{}", Uuid::new_v4());
    let _ = conn.execute(
        "INSERT INTO bookmarks (id, user_id, novel_id, last_chapter_id, last_chapter_number, last_read_at, scroll_percent)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(user_id, novel_id) DO UPDATE SET
            last_chapter_id = excluded.last_chapter_id,
            last_chapter_number = excluded.last_chapter_number,
            last_read_at = excluded.last_read_at,
            scroll_percent = excluded.scroll_percent",
        params![b_id, auth.0.sub, payload.novel_id, payload.chapter_id, payload.chapter_number, now, scroll],
    );

    (StatusCode::OK, Json(ApiResponse::ok("Progress tersimpan")))
}

pub async fn get_ad_config(State(pool): State<DbPool>) -> impl IntoResponse {
    let conn = pool.lock().await;

    let mut stmt = conn.prepare(
        "SELECT id, admob_app_id, banner_ad_id, interstitial_ad_id, rewarded_ad_id, interstitial_frequency, reward_tokens_per_ad, ads_enabled, updated_at
         FROM ad_configs LIMIT 1"
    ).unwrap();

    let config = stmt.query_row([], |row| {
        let ads_enabled_int: i64 = row.get(7)?;
        Ok(AdConfig {
            id: row.get(0)?,
            admob_app_id: row.get(1)?,
            banner_ad_id: row.get(2)?,
            interstitial_ad_id: row.get(3)?,
            rewarded_ad_id: row.get(4)?,
            interstitial_frequency: row.get(5)?,
            reward_tokens_per_ad: row.get(6)?,
            ads_enabled: ads_enabled_int == 1,
            updated_at: row.get(8)?,
        })
    }).unwrap();

    (StatusCode::OK, Json(ApiResponse::ok(config)))
}

pub async fn update_ad_config(
    State(pool): State<DbPool>,
    auth: AuthUser,
    Json(payload): Json<UpdateAdConfigRequest>,
) -> impl IntoResponse {
    if auth.0.role != "admin" {
        return (
            StatusCode::FORBIDDEN,
            Json(ApiResponse::<AdConfig>::err("Hanya Admin yang dapat mengubah konfigurasi AdMob")),
        );
    }

    let conn = pool.lock().await;
    let now = Utc::now().to_rfc3339();

    let mut stmt = conn.prepare(
        "SELECT admob_app_id, banner_ad_id, interstitial_ad_id, rewarded_ad_id, interstitial_frequency, reward_tokens_per_ad, ads_enabled
         FROM ad_configs LIMIT 1"
    ).unwrap();

    let existing = stmt.query_row([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, i64>(4)?,
            row.get::<_, i64>(5)?,
            row.get::<_, i64>(6)?,
        ))
    }).unwrap();

    let app_id = payload.admob_app_id.unwrap_or(existing.0);
    let banner_id = payload.banner_ad_id.unwrap_or(existing.1);
    let inter_id = payload.interstitial_ad_id.unwrap_or(existing.2);
    let reward_id = payload.rewarded_ad_id.unwrap_or(existing.3);
    let freq = payload.interstitial_frequency.unwrap_or(existing.4);
    let tokens = payload.reward_tokens_per_ad.unwrap_or(existing.5);
    let enabled = if let Some(e) = payload.ads_enabled { if e { 1 } else { 0 } } else { existing.6 };

    let _ = conn.execute(
        "UPDATE ad_configs SET
            admob_app_id = ?1,
            banner_ad_id = ?2,
            interstitial_ad_id = ?3,
            rewarded_ad_id = ?4,
            interstitial_frequency = ?5,
            reward_tokens_per_ad = ?6,
            ads_enabled = ?7,
            updated_at = ?8
         WHERE id = 'default_config'",
        params![app_id, banner_id, inter_id, reward_id, freq, tokens, enabled, now],
    );

    let updated = AdConfig {
        id: "default_config".to_string(),
        admob_app_id: app_id,
        banner_ad_id: banner_id,
        interstitial_ad_id: inter_id,
        rewarded_ad_id: reward_id,
        interstitial_frequency: freq,
        reward_tokens_per_ad: tokens,
        ads_enabled: enabled == 1,
        updated_at: now,
    };

    (
        StatusCode::OK,
        Json(ApiResponse::ok_msg(updated, "Pengaturan AdMob berhasil diperbarui")),
    )
}

pub async fn claim_rewarded_ad_token(
    State(pool): State<DbPool>,
    auth: AuthUser,
) -> impl IntoResponse {
    let conn = pool.lock().await;

    let mut ad_stmt = conn.prepare("SELECT reward_tokens_per_ad FROM ad_configs LIMIT 1").unwrap();
    let tokens_per_ad: i64 = ad_stmt.query_row([], |row| row.get(0)).unwrap_or(1);

    let _ = conn.execute(
        "UPDATE users SET free_unlock_tokens = free_unlock_tokens + ?1 WHERE id = ?2",
        params![tokens_per_ad, auth.0.sub],
    );

    let mut u_stmt = conn.prepare("SELECT free_unlock_tokens FROM users WHERE id = ?1").unwrap();
    let new_tokens: i64 = u_stmt.query_row(params![auth.0.sub], |row| row.get(0)).unwrap_or(0);

    (
        StatusCode::OK,
        Json(ApiResponse::ok_msg(
            new_tokens,
            &format!("Selamat! Anda mendapatkan +{} Token Pembuka Bab Gratis", tokens_per_ad),
        )),
    )
}

pub async fn get_author_dashboard(
    State(pool): State<DbPool>,
    auth: AuthUser,
) -> impl IntoResponse {
    let conn = pool.lock().await;

    let mut stmt = conn.prepare(
        "SELECT n.id, n.title, n.slug, n.author_id, n.author_name, n.category, n.tags, n.synopsis, n.cover_url, n.status, n.views, n.rating, n.total_ratings, n.is_featured, n.created_at, n.updated_at,
         (SELECT COUNT(*) FROM chapters c WHERE c.novel_id = n.id) as total_chapters
         FROM novels n WHERE n.author_id = ?1
         ORDER BY n.created_at DESC"
    ).unwrap();

    let parse_novel = |row: &rusqlite::Row| -> rusqlite::Result<Novel> {
        let tags_raw: String = row.get(6)?;
        let tags: Vec<String> = serde_json::from_str(&tags_raw).unwrap_or_default();
        let is_featured_int: i64 = row.get(13)?;

        Ok(Novel {
            id: row.get(0)?,
            title: row.get(1)?,
            slug: row.get(2)?,
            author_id: row.get(3)?,
            author_name: row.get(4)?,
            category: row.get(5)?,
            tags,
            synopsis: row.get(7)?,
            cover_url: row.get(8)?,
            status: row.get(9)?,
            views: row.get(10)?,
            rating: row.get(11)?,
            total_ratings: row.get(12)?,
            is_featured: is_featured_int == 1,
            created_at: row.get(14)?,
            updated_at: row.get(15)?,
            total_chapters: row.get(16)?,
        })
    };

    let novels: Vec<Novel> = stmt.query_map(params![auth.0.sub], parse_novel).unwrap().filter_map(|r| r.ok()).collect();

    let total_novels = novels.len() as i64;
    let total_chapters: i64 = novels.iter().map(|n| n.total_chapters).sum();
    let total_views: i64 = novels.iter().map(|n| n.views).sum();
    let estimated_ad_earnings_cents = (total_views as f64 * 0.2) as i64;

    (
        StatusCode::OK,
        Json(ApiResponse::ok(AuthorDashboardStats {
            total_novels,
            total_chapters,
            total_views,
            estimated_ad_earnings_cents,
            novels,
        })),
    )
}

pub async fn get_admin_dashboard(
    State(pool): State<DbPool>,
    auth: AuthUser,
) -> impl IntoResponse {
    if auth.0.role != "admin" {
        return (
            StatusCode::FORBIDDEN,
            Json(ApiResponse::<AdminDashboardStats>::err("Hanya Admin yang dapat mengakses")),
        );
    }

    let conn = pool.lock().await;

    let total_users: i64 = conn.query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0)).unwrap_or(0);
    let total_authors: i64 = conn.query_row("SELECT COUNT(*) FROM users WHERE role = 'author'", [], |row| row.get(0)).unwrap_or(0);
    let total_novels: i64 = conn.query_row("SELECT COUNT(*) FROM novels", [], |row| row.get(0)).unwrap_or(0);
    let total_chapters: i64 = conn.query_row("SELECT COUNT(*) FROM chapters", [], |row| row.get(0)).unwrap_or(0);
    let total_reads: i64 = conn.query_row("SELECT IFNULL(SUM(views), 0) FROM novels", [], |row| row.get(0)).unwrap_or(0);

    let mut ad_stmt = conn.prepare(
        "SELECT id, admob_app_id, banner_ad_id, interstitial_ad_id, rewarded_ad_id, interstitial_frequency, reward_tokens_per_ad, ads_enabled, updated_at
         FROM ad_configs LIMIT 1"
    ).unwrap();

    let ad_config = ad_stmt.query_row([], |row| {
        let ads_enabled_int: i64 = row.get(7)?;
        Ok(AdConfig {
            id: row.get(0)?,
            admob_app_id: row.get(1)?,
            banner_ad_id: row.get(2)?,
            interstitial_ad_id: row.get(3)?,
            rewarded_ad_id: row.get(4)?,
            interstitial_frequency: row.get(5)?,
            reward_tokens_per_ad: row.get(6)?,
            ads_enabled: ads_enabled_int == 1,
            updated_at: row.get(8)?,
        })
    }).unwrap();

    (
        StatusCode::OK,
        Json(ApiResponse::ok(AdminDashboardStats {
            total_users,
            total_authors,
            total_novels,
            total_chapters,
            total_reads,
            ad_config,
        })),
    )
}

pub async fn toggle_novel_featured(
    State(pool): State<DbPool>,
    Path(novel_id): Path<String>,
    auth: AuthUser,
) -> impl IntoResponse {
    if auth.0.role != "admin" {
        return (
            StatusCode::FORBIDDEN,
            Json(ApiResponse::<bool>::err("Hanya Admin yang dapat mengubah status unggulan")),
        );
    }

    let conn = pool.lock().await;
    let _ = conn.execute(
        "UPDATE novels SET is_featured = CASE WHEN is_featured = 1 THEN 0 ELSE 1 END WHERE id = ?1",
        params![novel_id],
    );

    let mut stmt = conn.prepare("SELECT is_featured FROM novels WHERE id = ?1").unwrap();
    let is_feat: i64 = stmt.query_row(params![novel_id], |row| row.get(0)).unwrap_or(0);

    (
        StatusCode::OK,
        Json(ApiResponse::ok_msg(is_feat == 1, "Status unggulan novel berhasil diubah")),
    )
}
