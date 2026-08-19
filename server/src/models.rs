#![allow(dead_code)]
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub display_name: String,
    pub role: String, // reader, author, admin
    pub avatar_url: Option<String>,
    pub coins: i64,
    pub free_unlock_tokens: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserClaims {
    pub sub: String, // user id
    pub username: String,
    pub role: String,
    pub exp: usize,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub display_name: Option<String>,
    pub role: Option<String>, // default "reader", or "author"
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username_or_email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: User,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Novel {
    pub id: String,
    pub title: String,
    pub slug: String,
    pub author_id: String,
    pub author_name: String,
    pub category: String,
    pub tags: Vec<String>,
    pub synopsis: String,
    pub cover_url: String,
    pub status: String, // ongoing, completed
    pub views: i64,
    pub rating: f64,
    pub total_ratings: i64,
    pub is_featured: bool,
    pub total_chapters: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateNovelRequest {
    pub title: String,
    pub category: String,
    pub tags: Vec<String>,
    pub synopsis: String,
    pub cover_url: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNovelRequest {
    pub title: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub synopsis: Option<String>,
    pub cover_url: Option<String>,
    pub status: Option<String>,
    pub is_featured: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chapter {
    pub id: String,
    pub novel_id: String,
    pub chapter_number: i64,
    pub title: String,
    pub content: String,
    pub word_count: i64,
    pub is_vip: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChapterSummary {
    pub id: String,
    pub novel_id: String,
    pub chapter_number: i64,
    pub title: String,
    pub word_count: i64,
    pub is_vip: bool,
    pub is_unlocked: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateChapterRequest {
    pub chapter_number: Option<i64>,
    pub title: String,
    pub content: String,
    pub is_vip: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateChapterRequest {
    pub chapter_number: Option<i64>,
    pub title: Option<String>,
    pub content: Option<String>,
    pub is_vip: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    pub id: String,
    pub user_id: String,
    pub novel_id: String,
    pub novel_title: String,
    pub novel_cover: String,
    pub novel_category: String,
    pub last_chapter_id: Option<String>,
    pub last_chapter_number: Option<i64>,
    pub last_read_at: String,
    pub scroll_percent: f64,
    pub total_chapters: i64,
}

#[derive(Debug, Deserialize)]
pub struct BookmarkToggleRequest {
    pub novel_id: String,
}

#[derive(Debug, Deserialize)]
pub struct ReadingProgressRequest {
    pub novel_id: String,
    pub chapter_id: String,
    pub chapter_number: i64,
    pub scroll_percent: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdConfig {
    pub id: String,
    pub admob_app_id: String,
    pub banner_ad_id: String,
    pub interstitial_ad_id: String,
    pub rewarded_ad_id: String,
    pub interstitial_frequency: i64, // e.g. every 3 chapters
    pub reward_tokens_per_ad: i64,
    pub ads_enabled: bool,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAdConfigRequest {
    pub admob_app_id: Option<String>,
    pub banner_ad_id: Option<String>,
    pub interstitial_ad_id: Option<String>,
    pub rewarded_ad_id: Option<String>,
    pub interstitial_frequency: Option<i64>,
    pub reward_tokens_per_ad: Option<i64>,
    pub ads_enabled: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct AuthorDashboardStats {
    pub total_novels: i64,
    pub total_chapters: i64,
    pub total_views: i64,
    pub estimated_ad_earnings_cents: i64,
    pub novels: Vec<Novel>,
}

#[derive(Debug, Serialize)]
pub struct AdminDashboardStats {
    pub total_users: i64,
    pub total_authors: i64,
    pub total_novels: i64,
    pub total_chapters: i64,
    pub total_reads: i64,
    pub ad_config: AdConfig,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: Option<String>,
    pub data: Option<T>,
}

impl<T> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            message: None,
            data: Some(data),
        }
    }

    pub fn ok_msg(data: T, message: &str) -> Self {
        Self {
            success: true,
            message: Some(message.to_string()),
            data: Some(data),
        }
    }

    pub fn err(message: &str) -> Self {
        Self {
            success: false,
            message: Some(message.to_string()),
            data: None,
        }
    }
}
