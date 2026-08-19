use rusqlite::{params, Connection, Result};
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::Utc;
use sha2::{Sha256, Digest};

pub type DbPool = Arc<Mutex<Connection>>;

pub fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub fn init_db(db_path: &str) -> Result<DbPool> {
    let mut conn = Connection::open(db_path)?;

    conn.execute_batch(r#"
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'reader',
            avatar_url TEXT,
            coins INTEGER NOT NULL DEFAULT 0,
            free_unlock_tokens INTEGER NOT NULL DEFAULT 3,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS novels (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            slug TEXT NOT NULL,
            author_id TEXT NOT NULL,
            author_name TEXT NOT NULL,
            category TEXT NOT NULL,
            tags TEXT NOT NULL,
            synopsis TEXT NOT NULL,
            cover_url TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ongoing',
            views INTEGER NOT NULL DEFAULT 0,
            rating REAL NOT NULL DEFAULT 4.8,
            total_ratings INTEGER NOT NULL DEFAULT 0,
            is_featured INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS chapters (
            id TEXT PRIMARY KEY,
            novel_id TEXT NOT NULL,
            chapter_number INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            word_count INTEGER NOT NULL,
            is_vip INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS bookmarks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            novel_id TEXT NOT NULL,
            last_chapter_id TEXT,
            last_chapter_number INTEGER DEFAULT 1,
            last_read_at TEXT NOT NULL,
            scroll_percent REAL DEFAULT 0.0,
            UNIQUE(user_id, novel_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS unlocked_chapters (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            chapter_id TEXT NOT NULL,
            unlocked_at TEXT NOT NULL,
            method TEXT NOT NULL DEFAULT 'ad_reward',
            UNIQUE(user_id, chapter_id)
        );

        CREATE TABLE IF NOT EXISTS ad_configs (
            id TEXT PRIMARY KEY,
            admob_app_id TEXT NOT NULL,
            banner_ad_id TEXT NOT NULL,
            interstitial_ad_id TEXT NOT NULL,
            rewarded_ad_id TEXT NOT NULL,
            interstitial_frequency INTEGER NOT NULL DEFAULT 3,
            reward_tokens_per_ad INTEGER NOT NULL DEFAULT 1,
            ads_enabled INTEGER NOT NULL DEFAULT 1,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS author_earnings (
            id TEXT PRIMARY KEY,
            author_id TEXT NOT NULL,
            novel_id TEXT NOT NULL,
            ad_impressions INTEGER NOT NULL DEFAULT 0,
            reads INTEGER NOT NULL DEFAULT 0,
            estimated_income_cents INTEGER NOT NULL DEFAULT 0,
            date TEXT NOT NULL
        );
    "#)?;

    seed_initial_data(&mut conn)?;

    Ok(Arc::new(Mutex::new(conn)))
}

fn seed_initial_data(conn: &mut Connection) -> Result<()> {
    let count: i64 = {
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM ad_configs")?;
        stmt.query_row([], |row| row.get(0))?
    };

    if count == 0 {
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO ad_configs (id, admob_app_id, banner_ad_id, interstitial_ad_id, rewarded_ad_id, interstitial_frequency, reward_tokens_per_ad, ads_enabled, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                "default_config",
                "ca-app-pub-3940256099942544~3347511713",
                "ca-app-pub-3940256099942544/6300978111",
                "ca-app-pub-3940256099942544/1033173712",
                "ca-app-pub-3940256099942544/5224354917",
                3,
                1,
                1,
                now
            ],
        )?;
    }

    let user_count: i64 = {
        let mut user_stmt = conn.prepare("SELECT COUNT(*) FROM users")?;
        user_stmt.query_row([], |row| row.get(0))?
    };

    if user_count == 0 {
        let now = Utc::now().to_rfc3339();
        let pass_hash = hash_password("admin123");
        
        conn.execute(
            "INSERT INTO users (id, username, email, password_hash, display_name, role, coins, free_unlock_tokens, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                "admin-1",
                "admin",
                "admin@naratika.com",
                pass_hash,
                "Head Editor & Admin",
                "admin",
                9999,
                99,
                now
            ],
        )?;

        let author1_id = "author-1";
        conn.execute(
            "INSERT INTO users (id, username, email, password_hash, display_name, role, coins, free_unlock_tokens, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                author1_id,
                "penulis_hebat",
                "author@naratika.com",
                hash_password("author123"),
                "Rian Dirgantara",
                "author",
                100,
                10,
                now
            ],
        )?;

        let author2_id = "author-2";
        conn.execute(
            "INSERT INTO users (id, username, email, password_hash, display_name, role, coins, free_unlock_tokens, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                author2_id,
                "nona_romansa",
                "romance@naratika.com",
                hash_password("author123"),
                "Alya Maharani",
                "author",
                150,
                10,
                now
            ],
        )?;

        seed_sample_novels(conn, author1_id, author2_id, &now)?;
    }

    Ok(())
}

fn seed_sample_novels(conn: &mut Connection, author1: &str, author2: &str, now: &str) -> Result<()> {
    struct SeedNovel<'a> {
        id: &'a str,
        title: &'a str,
        slug: &'a str,
        author_id: &'a str,
        author_name: &'a str,
        category: &'a str,
        tags: &'a str,
        synopsis: &'a str,
        cover_url: &'a str,
        views: i64,
        rating: f64,
        total_ratings: i64,
        is_featured: i64,
        chapters: Vec<(&'a str, &'a str, bool)>,
    }

    let novels = vec![
        SeedNovel {
            id: "novel-1",
            title: "Sang Pewaris Tahta Konglomerat yang Tersembunyi",
            slug: "sang-pewaris-tahta-konglomerat-yang-tersembunyi",
            author_id: author1,
            author_name: "Rian Dirgantara",
            category: "Urban & CEO",
            tags: r#"["CEO", "Billionaire", "Balas Dendam", "Action", "Romance"]"#,
            synopsis: r#"Selama tiga tahun menjadi menantu yang dihina dan dianggap pecundang oleh keluarga istrinya, Kenzo Pratama memilih diam. Namun ketika identitas aslinya sebagai pewaris tunggal konglomerasi Dirgantara Group terungkap, semua orang yang pernah menginjaknya kini berlutut memohon ampun!"#,
            cover_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
            views: 128400,
            rating: 4.9,
            total_ratings: 3420,
            is_featured: 1,
            chapters: vec![
                (
                    "Bab 1: Menantu yang Dihina",
                    r#"Hujan deras mengguyur kota Megapolitan saat Kenzo berdiri di depan gerbang megah kediaman keluarga Wijaya. Di tangannya, ia memegang kotak kue ulang tahun murah yang telah basah terkena cipratan air.

"Kenzo! Masih berani kau menginjakkan kaki di sini?" bentak Hendra, kakak iparnya, dengan tatapan penuh jijik. "Tiga tahun menikah dengan adikku Sarah, kau hanya menjadi beban tidak berguna yang bekerja sebagai kurir pengantar barang!"

Kenzo hanya tersenyum tipis. Tidak ada yang tahu, di balik mantel usangnya, sebuah telepon satelit terenkripsi bergetar. Sebuah pesan singkat masuk dari Swiss: 'Tuan Muda, masa hukuman 3 tahun Anda telah berakhir. Aset senilai 500 Triliun Rupiah telah diaktifkan kembali atas nama Anda.'"#,
                    false
                ),
                (
                    "Bab 2: Tamparan Tunai di Pesta Mewah",
                    r#"Pesta ulang tahun Nenek Wijaya berlangsung mewah di Hotel Grand Palace. Semua tamu adalah pengusaha terkemuka kota.

Sarah, istri Kenzo, menatap suaminya dengan tatapan rumit. "Kenzo, jika kau tidak punya hadiah yang pantas, sebaiknya kau tunggu di luar saja."

Saat itulah, Tuan Raymond, pemilik bank terbesar di ibu kota, melangkah masuk ke aula. Semua orang berdiri memberi hormat, mengira Tuan Raymond datang untuk memberi selamat pada Nenek Wijaya. Namun yang mengejutkan, Tuan Raymond langsung berlutut di hadapan Kenzo!

"Hormat saya kepada Tuan Muda Dirgantara! Bank kami siap melayani seluruh instruksi penarikan Anda hari ini!"

Seluruh ruangan hening seketika. Hendra menjatuhkan gelas anggurnya hingga pecah berantakan."#,
                    false
                ),
                (
                    "Bab 3: Siapa yang Sebenarnya Berkuasa?",
                    r#"Nenek Wijaya terperanjat hingga tongkat berkepala naganya bergetar. "Tuan Raymond... Anda pasti salah orang! Pemuda ini hanyalah menantu miskin keluarga kami!"

Tuan Raymond menoleh dengan pandangan sedingin es. "Salah orang? Seluruh gedung perhotelan ini, dan 80% saham perusahaan keluarga Wijaya Anda, berada di bawah naungan Dirgantara Capital. Dan pemilik mutlaknya adalah pemuda di depan Anda ini!"

Kenzo melangkah maju, sorot matanya tajam dan berwibawa. Aura kepemimpinan yang selama tiga tahun ia sembunyikan kini meledak keluar."#,
                    false
                ),
                (
                    "Bab 4: Penyesalan yang Terlambat (VIP)",
                    r#"Sarah menatap Kenzo dengan mata berkaca-kaca. "Kenzo... kenapa kau tidak pernah memberitahuku sejak awal?"

Kenzo menatap Sarah dengan tatapan datar. "Tiga tahun lalu, kakekmu menyelamatkan nyawaku, dan aku berjanji melindungimu. Namun setiap kali keluargamu merendahkanku, kau selalu memilih diam dan meragukanku. Sekarang, mari kita selesaikan perjanjian pernikahan ini."

Di saat yang sama, pengawal berkulit hitam dengan lencana emas masuk ke aula, membawa dokumen pembatalan seluruh kontrak bisnis keluarga Wijaya."#,
                    true
                ),
                (
                    "Bab 5: Kebangkitan Raja Bisnis (VIP)",
                    r#"Keesokan paginya, seluruh media nasional diguncang berita pengambilalihan konsorsium terbesar di Asia Tenggara. Foto siluet Kenzo terpampang di halaman depan setiap surat kabar ekonomi.

Sementara itu, musuh bebuyutan keluarga Dirgantara mulai bergerak dalam bayang-bayang..."#,
                    true
                ),
            ]
        },
        SeedNovel {
            id: "novel-2",
            title: "Pesona Sang Miliarder Dingin",
            slug: "pesona-sang-miliarder-dingin",
            author_id: author2,
            author_name: "Alya Maharani",
            category: "Romance",
            tags: r#"["Romance", "Contract Marriage", "Billionaire", "Drama", "Sweet"]"#,
            synopsis: r#"Demi membiayai operasi adiknya, Maya terpaksa menandatangani kontrak pernikahan satu tahun dengan Damian Arkan, CEO berdarah dingin yang paling ditakuti. Damian menetapkan tiga aturan ketat: Jangan sentuh dia, jangan jatuh cinta padanya, dan jangan pernah bertanya masa lalunya. Tapi mengapa Damian sendiri yang melanggar semua aturan itu?"#,
            cover_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
            views: 96200,
            rating: 4.8,
            total_ratings: 2150,
            is_featured: 1,
            chapters: vec![
                (
                    "Bab 1: Kontrak Satu Malam",
                    r#"Maya meremas gaun putih sederhananya saat memasuki ruang kerja bernuansa marmer hitam di lantai 45 Arkan Tower. Pria yang duduk di balik meja kaca itu memiliki paras setajam pahatan dewa Yunani, namun sorot matanya dingin seperti salju abadi.

"Tanda tangani di sini," suara Damian berat dan tanpa emosi. "Dua miliar rupiah akan masuk ke rekening rumah sakit adikmu malam ini juga. Sebagai gantinya, kau menjadi Nyonya Arkan di depan publik selama 365 hari.""#,
                    false
                ),
                (
                    "Bab 2: Kehidupan di Villa Mawar",
                    r#"Hari pertama tinggal di kediaman Damian, Maya menyadari bahwa pria itu hidup seperti robot yang terisolasi dari dunia luar. Namun saat malam tiba dan badai petir melanda, Maya menemukan Damian terkunci di sudut kamar dengan nafas tersengal akibat trauma masa kecilnya."#,
                    false
                ),
                (
                    "Bab 3: Tatapan yang Menghangat (VIP)",
                    r#"Damian menatap Maya yang dengan lembut membalut luka di tangannya. Untuk pertama kalinya dalam sepuluh tahun, detak jantung sang CEO dingin berdegup kencang hanya karena sentuhan seorang wanita."#,
                    true
                ),
            ]
        },
        SeedNovel {
            id: "novel-3",
            title: "Kelahiran Kembali Sang Dewa Pedang",
            slug: "kelahiran-kembali-sang-dewa-pedang",
            author_id: author1,
            author_name: "Rian Dirgantara",
            category: "Fantasy & Cultivation",
            tags: r#"["Cultivation", "Reincarnation", "Overpowered", "Action", "Martial Arts"]"#,
            synopsis: r#"Dikhianati oleh tujuh kaisar langit saat hampir menembus batas keabadian, Dewa Pedang Ye Chen terlahir kembali ke tubuh seorang pemuda cacat dari klan rendahan di Benua Tianxuan. Berbekal memori sembilan kitab suci kuno, ia kembali menapaki jalan pedang untuk membelah langit dan membalas dendam!"#,
            cover_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
            views: 184500,
            rating: 5.0,
            total_ratings: 5120,
            is_featured: 1,
            chapters: vec![
                (
                    "Bab 1: Jiwa Pedang yang Terbakar",
                    r#"Petir ungu menyambar puncak Gunung Naga Surgawi. Ye Chen membuka matanya, merasakan kepedihan di meridian tubuh barunya yang hancur. "Tujuh Kaisar Pengkhianat... tunggu saat aku kembali dengan Pedang Pembelah Langit!""#,
                    false
                ),
                (
                    "Bab 2: Membuka Sembilan Meridian Naga",
                    r#"Hanya dalam satu malam meditasi, Ye Chen membalikkan takdir tubuh yang dianggap sampah menjadi Fisik Tubuh Pedang Primordial yang hanya muncul sekali dalam sejuta tahun."#,
                    false
                ),
                (
                    "Bab 3: Pembuktian di Arena Klan (VIP)",
                    r#"Seluruh tetua klan ternganga ketika Ye Chen hanya mengibaskan dua jari untuk mematahkan jurus jenius terhebat klan Ye dalam satu detik!"#,
                    true
                ),
            ]
        },
        SeedNovel {
            id: "novel-4",
            title: "Sistem Terkuat di Dunia Kiamat",
            slug: "sistem-terkuat-di-dunia-kiamat",
            author_id: author1,
            author_name: "Rian Dirgantara",
            category: "Sci-Fi & System",
            tags: r#"["System", "Apocalypse", "Zombies", "Survival", "Superpowers"]"#,
            synopsis: r#"Saat kabut merah menyelimuti bumi dan jutaan manusia berubah menjadi mutan zombi yang haus darah, Alex terbangun dengan antarmuka futuristik di depan matanya: [Sistem Pangkalan Kiamat Tak Terbatas Diaktifkan!]. Setiap kali membunuh zombi, ia mendapatkan poin untuk membeli senjata mutakhir dan membangun benteng terkuat di bumi!"#,
            cover_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
            views: 75300,
            rating: 4.7,
            total_ratings: 1890,
            is_featured: 0,
            chapters: vec![
                (
                    "Bab 1: Hari Pertama Akhir Dunia",
                    r#"Sirene darurat melolong di seluruh penjuru kota. Alex memegang pipa besi dengan nafas terengah-engah saat jendela apartemennya dihantam oleh makhluk bertaring mengerikan.

[Ding! Membunuh 1 Mutan Tingkat 1. Poin Survival +50. Toko Dimensi Terbuka!]"#,
                    false
                ),
                (
                    "Bab 2: Toko Senjata Dimensi",
                    r#"Dengan poin pertamanya, Alex menukarkan katana plasma dan paket nutrisi tingkat militer. Perjalanan bertahan hidup baru saja dimulai."#,
                    false
                ),
                (
                    "Bab 3: Menyelamatkan Sang Dokter Cantik (VIP)",
                    r#"Di tengah reruntuhan rumah sakit pusat, Alex menemukan ilmuwan penting yang memegang rahasia asal mula virus kabut merah."#,
                    true
                ),
            ]
        },
        SeedNovel {
            id: "novel-5",
            title: "Misteri Villa Angker di Puncak Kabut",
            slug: "misteri-villa-angker-di-puncak-kabut",
            author_id: author2,
            author_name: "Alya Maharani",
            category: "Mystery & Thriller",
            tags: r#"["Horror", "Mystery", "Detective", "Supernatural", "Suspense"]"#,
            synopsis: r#"Detektif swasta Danu menerima amplop hitam berisi kunci kuno dan bayaran fantastis untuk menyelidiki hilangnya tujuh pemuda di Villa Puncak Kabut sepuluh tahun lalu. Semakin dalam ia menyelidiki, semakin nyata bahwa waktu di dalam villa tersebut berjalan mundur setiap tengah malam."#,
            cover_url: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=600&auto=format&fit=crop&q=80",
            views: 52100,
            rating: 4.8,
            total_ratings: 1420,
            is_featured: 0,
            chapters: vec![
                (
                    "Bab 1: Undangan Berdarah",
                    r#"Surat itu ditulis dengan tinta merah yang memiliki aroma karat besi. Danu menyalakan pemantik apinya, menerangi foto hitam putih sebuah keluarga bangsawan tahun 1920 yang semuanya tersenyum tanpa mata."#,
                    false
                ),
                (
                    "Bab 2: Lonceng Jam Tengah Malam",
                    r#"Tepat pukul 00:00, jarum jam antik di ruang tengah berputar berlawanan arah. Suara langkah kaki bergaun sutra terdengar dari lantai dua yang telah runtuh."#,
                    false
                ),
                (
                    "Bab 3: Kamar Rahasia yang Terbuka (VIP)",
                    r#"Di balik cermin rias berdebu, Danu menemukan lorong bawah tanah yang tidak tercatat di cetak biru bangunan manapun."#,
                    true
                ),
            ]
        }
    ];

    for n in novels {
        let now_str = Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO novels (id, title, slug, author_id, author_name, category, tags, synopsis, cover_url, status, views, rating, total_ratings, is_featured, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'ongoing', ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                n.id,
                n.title,
                n.slug,
                n.author_id,
                n.author_name,
                n.category,
                n.tags,
                n.synopsis,
                n.cover_url,
                n.views,
                n.rating,
                n.total_ratings,
                n.is_featured,
                now,
                now_str
            ],
        )?;

        for (idx, ch) in n.chapters.iter().enumerate() {
            let ch_id = format!("{}-ch-{}", n.id, idx + 1);
            let words = ch.1.split_whitespace().count() as i64;
            let is_vip_int = if ch.2 { 1 } else { 0 };
            
            conn.execute(
                "INSERT INTO chapters (id, novel_id, chapter_number, title, content, word_count, is_vip, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    ch_id,
                    n.id,
                    (idx + 1) as i64,
                    ch.0,
                    ch.1,
                    words,
                    is_vip_int,
                    now,
                    now
                ],
            )?;
        }
    }

    Ok(())
}
