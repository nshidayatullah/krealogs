# PRD - Krealogs

## 1. Ringkasan
Aplikasi booking dan manajemen jasa fotografi/videografi vintage estetik. Pelanggan bisa memilih paket, addon, melakukan booking, dan admin dapat mengelola pesanan.

## 2. Stack
- **Frontend**: React 19, Vite 6, Tailwind CSS v4, React Router v7, React Aria Components
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL 16
- **Build**: esbuild (server), Vite (frontend)
- **Deploy**: Docker (multi-stage), Dokploy, Traefik (SSL auto)

## 3. Struktur Folder
```
krealogs/
├── api/                  # Serverless entry (Vercel)
│   ├── index.ts          # Serverless handler
│   ├── migrate.ts        # Serverless migration handler
│   └── health.ts         # Health check handler
├── assets/               # Asset statis (gambar, ikon)
├── dist/                 # Hasil build (auto-generated)
├── node_modules/         # Dependencies
├── public/               # Public assets
├── src/                  # Source code utama
│   ├── components/       # Komponen React
│   ├── db/               # Database migration
│   │   └── migrate.ts    # Migration dan seeding
│   ├── hooks/            # React hooks
│   ├── lib/              # Library/utilitas
│   ├── pages/            # Halaman React
│   ├── types/            # Type definitions
│   ├── utils/            # Fungsi utilitas
│   ├── db.ts             # Koneksi database (Pool)
│   └── types.ts          # Tipe data utama
├── .env                  # Environment lokal
├── .env.example          # Contoh environment
├── .gitignore
├── Dockerfile            # Multi-stage Docker build
├── PRD.md                # Dokumen ini
├── package.json
├── server.ts             # Entry point Express.js
├── tsconfig.json
├── vercel.json           # Konfigurasi Vercel
└── vite.config.ts        # Konfigurasi Vite
```

## 4. API Endpoints

### Public
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/packages` | Daftar paket |
| GET | `/api/addons` | Daftar addon |
| GET | `/api/coupons/validate/:code` | Validasi kupon |
| POST | `/api/bookings` | Buat booking baru |
| GET | `/api/bookings/search?whatsapp=` | Cari booking via WA |
| GET | `/api/invoice-config` | Konfigurasi invoice |

### Admin (dilindungi cookie JWT)
| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/api/auth/login` | Login admin |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/check` | Cek status login |
| GET | `/api/auth/csrf` | Dapatkan CSRF token |
| GET | `/api/db` | Data dashboard (paket, addon, booking, kupon, config) |
| POST | `/api/packages` | Tambah paket |
| PUT | `/api/packages/:id` | Update paket |
| DELETE | `/api/packages/:id` | Hapus paket |
| POST | `/api/addons` | Tambah addon |
| PUT | `/api/addons/:id` | Update addon |
| DELETE | `/api/addons/:id` | Hapus addon |
| GET | `/api/bookings` | Daftar semua booking |
| POST | `/api/bookings/:id/status` | Update status booking |
| POST | `/api/coupons` | Tambah kupon |
| PUT | `/api/coupons/:code` | Update kupon |
| DELETE | `/api/coupons/:code` | Hapus kupon |
| POST | `/api/spreadsheet/config` | Update konfigurasi spreadsheet |
| POST | `/api/migrate` | Run migration & seeding |

## 5. Database Schema

### packages
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | VARCHAR(100) PK | ID unik paket |
| name | VARCHAR(255) | Nama paket |
| description | TEXT | Deskripsi |
| price | INT | Harga (Rupiah) |
| features | TEXT[] | Fitur-fitur |
| type | VARCHAR(50) | both |
| category | VARCHAR(50) | regular / signature |

### addons
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | VARCHAR(100) PK | ID unik addon |
| name | VARCHAR(255) | Nama addon |
| description | TEXT | Deskripsi |
| price | INT | Harga (Rupiah) |

### bookings
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | VARCHAR(100) PK | ID booking |
| customer_name | VARCHAR(255) | Nama pelanggan |
| customer_phone | VARCHAR(50) | No WA |
| customer_city | VARCHAR(100) | Kota |
| event_type | VARCHAR(50) | Jenis acara |
| wedding_type | VARCHAR(100) | Tipe pernikahan (opsional) |
| event_date | VARCHAR(50) | Tanggal acara |
| venue_location | TEXT | Lokasi |
| package_id | VARCHAR(100) FK | Referensi paket |
| package_name | VARCHAR(255) | Nama paket (denormalized) |
| package_price | INT | Harga paket |
| addons | VARCHAR(100)[] | ID addon terpilih |
| addon_details | JSONB | Detail addon |
| days | JSONB | Hari (opsional) |
| payment_method | VARCHAR(50) | Metode bayar |
| total_price | INT | Total harga |
| amount_paid | INT | Dibayar |
| remaining_payment | INT | Sisa bayar |
| status | VARCHAR(50) | pending/approved/rejected/paid/dp_paid |
| created_at | TIMESTAMPTZ | Dibuat |
| approved_at | TIMESTAMPTZ | Disetujui |
| rejected_at | TIMESTAMPTZ | Ditolak |
| coupon_code | VARCHAR(50) | Kode kupon (opsional) |
| discount_amount | INT | Diskon (default 0) |

### coupons
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| code | VARCHAR(100) PK | Kode kupon |
| discount_percent | INT | Diskon persen |
| valid_until | DATE | Masa berlaku |
| is_active | BOOLEAN | Aktif/tidak |

### spreadsheet_config
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT PK DEFAULT 1 | Single row |
| spreadsheet_id | VARCHAR(255) | ID Google Spreadsheet |
| spreadsheet_url | TEXT | URL spreadsheet |
| last_synced_at | TIMESTAMPTZ | Sinkronisasi terakhir |

## 6. Environment Variables

| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| DATABASE_URL | Ya | - | `postgresql://user:pass@host:5432/db` |
| APP_URL | Ya | - | URL aplikasi |
| ADMIN_USERNAME | Ya | admin | Username admin |
| ADMIN_PASSWORD_HASH | Ya | - | Bcrypt hash password admin |
| JWT_SECRET | Ya | - | Random 32+ chars |
| NODE_ENV | Tidak | production | production/development |
| PORT | Tidak | 3000 | Port container |
| BANK_NAME | Tidak | BCA | Nama bank invoice |
| BANK_ACCOUNT | Tidak | 0512688096 | No rekening invoice |
| BANK_ACCOUNT_NAME | Tidak | - | Nama pemilik rekening |
| CONTACT_PHONE | Tidak | - | No kontak |
| CONTACT_EMAIL | Tidak | - | Email kontak |
| SIGNATURE_NAME | Tidak | - | Nama penandatangan |
| SIGNATURE_TITLE | Tidak | - | Jabatan penandatangan |

## 7. Deploy

### Docker Build
```bash
docker build -t krealogs .
docker run -p 3001:3000 --env-file .env krealogs
```

### Dokploy
1. Push ke GitHub
2. Build type: Dockerfile
3. Set env variables
4. Domain: tambah di settings
5. Port: 3001 (host) -> 3000 (container)

### Vercel
```bash
npm run vercel-build
vercel deploy
```

## 8. Admin Login
- URL: `https://domain/admin/login`
- Username: `admin`
- Password: (sesuai hash yang diset di ADMIN_PASSWORD_HASH)
