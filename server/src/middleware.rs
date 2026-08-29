use crate::models::{ApiResponse, UserClaims};
use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};

static JWT_SECRET_CELL: OnceLock<Vec<u8>> = OnceLock::new();

/// Reads the JWT signing secret from the `JWT_SECRET` environment variable.
/// Falls back to a development-only default so `cargo run` still works locally,
/// but this MUST be overridden via env var in any real/production deployment.
fn jwt_secret() -> &'static [u8] {
    JWT_SECRET_CELL
        .get_or_init(|| {
            std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| {
                    eprintln!("[WARNING] JWT_SECRET env var not set — using an insecure development default. Set JWT_SECRET before deploying to production!");
                    "novel_secret_key_super_secure_2026".to_string()
                })
                .into_bytes()
        })
        .as_slice()
}

pub fn create_jwt(
    user_id: &str,
    username: &str,
    role: &str,
) -> Result<String, jsonwebtoken::errors::Error> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let exp = now + 60 * 60 * 24 * 30; // 30 days expiration

    let claims = UserClaims {
        sub: user_id.to_string(),
        username: username.to_string(),
        role: role.to_string(),
        exp: exp as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret()),
    )
}

pub fn verify_jwt(token: &str) -> Result<UserClaims, jsonwebtoken::errors::Error> {
    let validation = Validation::default();
    let token_data =
        decode::<UserClaims>(token, &DecodingKey::from_secret(jwt_secret()), &validation)?;
    Ok(token_data.claims)
}

// Extractor for required authenticated user
pub struct AuthUser(pub UserClaims);

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok());

        if let Some(auth_str) = auth_header {
            if let Some(token) = auth_str.strip_prefix("Bearer ") {
                if let Ok(claims) = verify_jwt(token) {
                    return Ok(AuthUser(claims));
                }
            }
        }

        let resp = (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::err(
                "Unauthorized: Token tidak valid atau telah kedaluwarsa",
            )),
        )
            .into_response();
        Err(resp)
    }
}

// Extractor for optional authenticated user (for public endpoints that customize output when logged in)
pub struct MaybeAuthUser(pub Option<UserClaims>);

#[async_trait]
impl<S> FromRequestParts<S> for MaybeAuthUser
where
    S: Send + Sync,
{
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok());

        if let Some(auth_str) = auth_header {
            if let Some(token) = auth_str.strip_prefix("Bearer ") {
                if let Ok(claims) = verify_jwt(token) {
                    return Ok(MaybeAuthUser(Some(claims)));
                }
            }
        }

        Ok(MaybeAuthUser(None))
    }
}
