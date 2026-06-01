import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import pg from "pg";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

const { Pool } = pg;

const sslConfig = process.env.NODE_ENV === "production"
  ? { ca: fs.existsSync("/etc/ssl/certs/ca-certificates.crt") ? fs.readFileSync("/etc/ssl/certs/ca-certificates.crt").toString() : undefined, rejectUnauthorized: true }
  : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret";
const CSRF_SECRET = process.env.JWT_SECRET || "csrf-fallback-secret";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

function mapBookingRow(b: any) {
  const s = (b.status || "pending").toLowerCase();
  const approvalStatus = ["pending", "approved", "rejected"].includes(s) ? s : s === "dp_paid" || s === "paid" ? "approved" : "pending";
  const paymentStatus = s === "paid" ? "paid" : s === "dp_paid" ? "dp_paid" : "unpaid";
  return {
    id: b.id,
    customerName: b.customer_name,
    customerPhone: b.customer_phone,
    customerCity: b.customer_city,
    eventType: b.event_type,
    weddingType: b.wedding_type || undefined,
    eventDate: b.event_date,
    venueLocation: b.venue_location,
    packageId: b.package_id,
    packageName: b.package_name,
    packagePrice: Number(b.package_price),
    addons: b.addons || [],
    addonDetails: Array.isArray(b.addon_details) ? b.addon_details : JSON.parse(JSON.stringify(b.addon_details || [])),
    days: b.days ? (Array.isArray(b.days) ? b.days : JSON.parse(JSON.stringify(b.days))) : undefined,
    paymentMethod: b.payment_method,
    totalPrice: Number(b.total_price),
    amountPaid: Number(b.amount_paid),
    remainingPayment: Number(b.remaining_payment),
    approvalStatus,
    paymentStatus,
    createdAt: b.created_at,
    approvedAt: b.approved_at || undefined,
    rejectedAt: b.rejected_at || undefined,
    couponCode: b.coupon_code || undefined,
    discountAmount: b.discount_amount ? Number(b.discount_amount) : undefined
  };
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }
  const headerToken = req.headers["x-csrf-token"] as string;
  const cookieToken = req.cookies?.csrf_token;
  if (!headerToken || !cookieToken) {
    return res.status(403).json({ error: "CSRF token missing" });
  }
  try {
    const decoded = jwt.verify(cookieToken, CSRF_SECRET) as { csrf: string };
    if (decoded.csrf !== headerToken) {
      return res.status(403).json({ error: "CSRF token mismatch" });
    }
    next();
  } catch {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
}

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/auth/csrf", (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");
  const csrfCookie = jwt.sign({ csrf: token }, CSRF_SECRET, { expiresIn: "24h" });
  res.cookie("csrf_token", csrfCookie, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400000 });
  res.json({ csrfToken: token });
});

app.get("/api/favicon.ico", (req, res) => res.status(204).end());
app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/api/invoice-config", (req, res) => {
  res.json({
    bankName: process.env.BANK_NAME || "BCA",
    bankAccount: process.env.BANK_ACCOUNT || "0512688096",
    bankAccountName: process.env.BANK_ACCOUNT_NAME || "Brilliant Rizky Fortuna",
    contactPhone: process.env.CONTACT_PHONE || "(+62) 812 4198 7783",
    contactEmail: process.env.CONTACT_EMAIL || "kreatiflogs@gmail.com",
    signatureName: process.env.SIGNATURE_NAME || "Dymas Herrnawan, S.I.Kom",
    signatureTitle: process.env.SIGNATURE_TITLE || "Tim Krealogs",
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username dan password wajib diisi" });
  if (username.toLowerCase() !== ADMIN_USERNAME.toLowerCase()) return res.status(401).json({ error: "Kombinasi Username dan Password tidak cocok" });
  const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!valid) return res.status(401).json({ error: "Kombinasi Username dan Password tidak cocok" });
  const token = jwt.sign({ username: ADMIN_USERNAME }, JWT_SECRET, { expiresIn: "24h" });
  res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400000 });
  res.json({ success: true });
});

app.post("/api/auth/logout", (req, res) => { res.clearCookie("token"); res.json({ success: true }); });

app.get("/api/auth/check", (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.json({ authenticated: false });
  try { jwt.verify(token, JWT_SECRET); res.json({ authenticated: true }); }
  catch { res.json({ authenticated: false }); }
});

app.get("/api/packages", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM packages");
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed to fetch packages" }); }
});

app.get("/api/addons", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM addons");
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed to fetch addons" }); }
});

app.get("/api/coupons/validate/:code", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) AND is_active = TRUE", [req.params.code]);
    if (rows.length === 0) return res.status(404).json({ valid: false, error: "Kode kupon tidak ditemukan atau tidak aktif" });
    const coupon = { code: rows[0].code, discountPercent: Number(rows[0].discount_percent), validUntil: rows[0].valid_until, isActive: rows[0].is_active };
    if (coupon.validUntil < new Date().toISOString().split("T")[0]) return res.status(400).json({ valid: false, error: "Kode kupon telah kadaluarsa" });
    res.json({ valid: true, coupon });
  } catch { res.status(500).json({ error: "Gagal memvalidasi kupon" }); }
});

app.post("/api/bookings", async (req, res) => {
  const d = req.body;
  if (!d.customerName || !d.customerPhone || !d.customerCity || !d.eventType || !d.eventDate || !d.venueLocation || !d.packageId)
    return res.status(400).json({ error: "Mohon lengkapi semua data pesanan" });
  const cleanPhone = d.customerPhone.trim().replace(/[^0-9+]/g, "");
  const id = `BOOK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  try {
    await pool.query(
      `INSERT INTO bookings (id, customer_name, customer_phone, customer_city, event_type, wedding_type, event_date, venue_location, package_id, package_name, package_price, addons, addon_details, days, payment_method, total_price, amount_paid, remaining_payment, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [id, d.customerName, cleanPhone, d.customerCity, d.eventType, d.weddingType || null, d.eventDate, d.venueLocation, d.packageId, d.packageName, d.packagePrice, d.addons, JSON.stringify(d.addonDetails), d.days ? JSON.stringify(d.days) : null, d.paymentMethod, d.totalPrice, d.amountPaid, d.remainingPayment, "pending", new Date().toISOString()]
    );
    res.json({ success: true, booking: { ...d, id, customerPhone: cleanPhone, status: "pending", createdAt: new Date().toISOString() } });
  } catch { res.status(500).json({ error: "Gagal menyimpan pesanan" }); }
});

app.get("/api/bookings/search", async (req, res) => {
  const w = String(req.query.whatsapp || "").trim().replace(/[^0-9]/g, "");
  if (!w) return res.json([]);
  try {
    const { rows } = await pool.query(
      "SELECT * FROM bookings WHERE regexp_replace(customer_phone, '[^0-9]', '', 'g') LIKE $1 LIMIT 10",
      [`%${w}%`]
    );
    res.json(rows.map(mapBookingRow));
  } catch { res.status(500).json({ error: "Error searching bookings" }); }
});

app.get("/api/db", requireAdmin, async (req, res) => {
  try {
    const [p, a, b, c, cfg] = await Promise.all([
      pool.query("SELECT * FROM packages"),
      pool.query("SELECT * FROM addons"),
      pool.query("SELECT * FROM bookings ORDER BY created_at DESC"),
      pool.query("SELECT * FROM coupons ORDER BY code ASC"),
      pool.query("SELECT * FROM spreadsheet_config WHERE id = 1"),
    ]);
    res.json({
      packages: p.rows, addons: a.rows,
      bookings: b.rows.map(mapBookingRow),
      coupons: c.rows.map((r: any) => ({ code: r.code, discountPercent: Number(r.discount_percent), validUntil: r.valid_until, isActive: r.is_active })),
      spreadsheetConfig: cfg.rows[0] ? { spreadsheetId: cfg.rows[0].spreadsheet_id, spreadsheetUrl: cfg.rows[0].spreadsheet_url, lastSyncedAt: cfg.rows[0].last_synced_at } : { spreadsheetId: null, spreadsheetUrl: null, lastSyncedAt: null }
    });
  } catch { res.status(500).json({ error: "Terjadi kesalahan internal server" }); }
});

app.post("/api/packages", requireAdmin, requireCsrf, async (req, res) => {
  const p = req.body;
  if (!p.id || !p.name || p.price === undefined) return res.status(400).json({ error: "Missing required properties" });
  try {
    await pool.query("INSERT INTO packages (id, name, description, price, features, type, category) VALUES ($1,$2,$3,$4,$5,$6,$7)", [p.id, p.name, p.description, p.price, p.features, p.type, p.category || 'regular']);
    res.json({ success: true, package: p });
  } catch { res.status(500).json({ error: "Failed to create package" }); }
});

app.put("/api/packages/:id", requireAdmin, requireCsrf, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM packages WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Package not found" });
    const u = { ...rows[0], ...req.body };
    await pool.query("UPDATE packages SET name=$1, description=$2, price=$3, features=$4, type=$5, category=$6 WHERE id=$7", [u.name, u.description, u.price, u.features, u.type, u.category || 'regular', req.params.id]);
    res.json({ success: true, package: u });
  } catch { res.status(500).json({ error: "Failed to update package" }); }
});

app.delete("/api/packages/:id", requireAdmin, requireCsrf, async (req, res) => {
  try {
    const r = await pool.query("DELETE FROM packages WHERE id = $1", [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Package not found" });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete package" }); }
});

app.post("/api/addons", requireAdmin, requireCsrf, async (req, res) => {
  const a = req.body;
  if (!a.id || !a.name || a.price === undefined) return res.status(400).json({ error: "Missing required properties" });
  try {
    await pool.query("INSERT INTO addons (id, name, description, price) VALUES ($1,$2,$3,$4)", [a.id, a.name, a.description, a.price]);
    res.json({ success: true, addon: a });
  } catch { res.status(500).json({ error: "Failed to create addon" }); }
});

app.put("/api/addons/:id", requireAdmin, requireCsrf, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM addons WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Add-on not found" });
    const u = { ...rows[0], ...req.body };
    await pool.query("UPDATE addons SET name=$1, description=$2, price=$3 WHERE id=$4", [u.name, u.description, u.price, req.params.id]);
    res.json({ success: true, addon: u });
  } catch { res.status(500).json({ error: "Failed to update addon" }); }
});

app.delete("/api/addons/:id", requireAdmin, requireCsrf, async (req, res) => {
  try {
    const r = await pool.query("DELETE FROM addons WHERE id = $1", [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Add-on not found" });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete addon" }); }
});

app.post("/api/coupons", requireAdmin, requireCsrf, async (req, res) => {
  const { code, discountPercent, validUntil, isActive } = req.body;
  if (!code || discountPercent === undefined || !validUntil) return res.status(400).json({ error: "Missing required properties" });
  const dp = Number(discountPercent);
  if (dp < 0 || dp > 100) return res.status(400).json({ error: "discountPercent must be between 0 and 100" });
  try {
    await pool.query("INSERT INTO coupons (code, discount_percent, valid_until, is_active) VALUES ($1,$2,$3,$4)", [code.toUpperCase().trim(), dp, validUntil, isActive !== undefined ? isActive : true]);
    res.json({ success: true, coupon: { code: code.toUpperCase().trim(), discountPercent: dp, validUntil, isActive: isActive !== undefined ? isActive : true } });
  } catch { res.status(500).json({ error: "Gagal membuat kupon baru" }); }
});

app.put("/api/coupons/:code", requireAdmin, requireCsrf, async (req, res) => {
  const { discountPercent, validUntil, isActive } = req.body;
  const dp = Number(discountPercent);
  if (dp < 0 || dp > 100) return res.status(400).json({ error: "discountPercent must be between 0 and 100" });
  try {
    await pool.query("UPDATE coupons SET discount_percent=$1, valid_until=$2, is_active=$3 WHERE UPPER(code)=UPPER($4)", [dp, validUntil, isActive, req.params.code.toUpperCase().trim()]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Gagal memperbarui kupon" }); }
});

app.delete("/api/coupons/:code", requireAdmin, requireCsrf, async (req, res) => {
  try {
    const r = await pool.query("DELETE FROM coupons WHERE UPPER(code)=UPPER($1)", [req.params.code.toUpperCase().trim()]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Kupon tidak ditemukan" });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Gagal menghapus kupon" }); }
});

app.get("/api/bookings", requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
    res.json(rows.map(mapBookingRow));
  } catch { res.status(500).json({ error: "Failed to fetch bookings" }); }
});

app.post("/api/bookings/:id/approval", requireAdmin, requireCsrf, async (req, res) => {
  const { approvalStatus } = req.body;
  if (!approvalStatus || !["approved", "rejected"].includes(approvalStatus)) return res.status(400).json({ error: "Invalid approvalStatus" });
  try {
    const { rows } = await pool.query("SELECT * FROM bookings WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Booking tidak ditemukan" });
    const now = new Date().toISOString();
    const approvedAt = approvalStatus === "approved" ? now : rows[0].approved_at;
    const rejectedAt = approvalStatus === "rejected" ? now : rows[0].rejected_at;
    const dbStatus = approvalStatus === "rejected" ? "rejected" : (rows[0].payment_status || "unpaid") === "paid" ? "paid" : (rows[0].payment_status || "unpaid") === "dp_paid" ? "dp_paid" : "approved";
    await pool.query("UPDATE bookings SET status=$1, approval_status=$2, approved_at=$3, rejected_at=$4 WHERE id=$5", [dbStatus, approvalStatus, approvedAt, rejectedAt, req.params.id]);
    const { rows: updated } = await pool.query("SELECT * FROM bookings WHERE id = $1", [req.params.id]);
    res.json({ success: true, booking: mapBookingRow(updated[0]) });
  } catch { res.status(500).json({ error: "Gagal memperbarui status persetujuan" }); }
});

app.post("/api/bookings/:id/payment", requireAdmin, requireCsrf, async (req, res) => {
  const { paymentStatus } = req.body;
  if (!paymentStatus || !["dp_paid", "paid"].includes(paymentStatus)) return res.status(400).json({ error: "Invalid paymentStatus" });
  try {
    const { rows } = await pool.query("SELECT * FROM bookings WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Booking tidak ditemukan" });
    if (rows[0].approval_status !== "approved") return res.status(400).json({ error: "Booking harus disetujui terlebih dahulu" });
    const amountPaid = paymentStatus === "paid" ? Number(rows[0].total_price) : Number(rows[0].amount_paid);
    const remainingPayment = paymentStatus === "paid" ? 0 : Number(rows[0].remaining_payment);
    await pool.query("UPDATE bookings SET status=$1, payment_status=$2, amount_paid=$3, remaining_payment=$4 WHERE id=$5", [paymentStatus, paymentStatus, amountPaid, remainingPayment, req.params.id]);
    const { rows: updated } = await pool.query("SELECT * FROM bookings WHERE id = $1", [req.params.id]);
    res.json({ success: true, booking: mapBookingRow(updated[0]) });
  } catch { res.status(500).json({ error: "Gagal memperbarui status pembayaran" }); }
});

app.post("/api/spreadsheet/config", requireAdmin, requireCsrf, async (req, res) => {
  const { spreadsheetId, spreadsheetUrl, lastSyncedAt } = req.body;
  try {
    const { rows } = await pool.query("SELECT * FROM spreadsheet_config WHERE id = 1");
    if (rows.length === 0) {
      await pool.query("INSERT INTO spreadsheet_config (id, spreadsheet_id, spreadsheet_url, last_synced_at) VALUES (1,$1,$2,$3)", [spreadsheetId||null, spreadsheetUrl||null, lastSyncedAt||null]);
    } else {
      await pool.query("UPDATE spreadsheet_config SET spreadsheet_id=COALESCE($1,spreadsheet_id), spreadsheet_url=COALESCE($2,spreadsheet_url), last_synced_at=COALESCE($3,last_synced_at) WHERE id=1", [spreadsheetId!==undefined?spreadsheetId:null, spreadsheetUrl!==undefined?spreadsheetUrl:null, lastSyncedAt!==undefined?lastSyncedAt:null]);
    }
    const { rows: u } = await pool.query("SELECT * FROM spreadsheet_config WHERE id = 1");
    res.json({ success: true, spreadsheetConfig: { spreadsheetId: u[0].spreadsheet_id, spreadsheetUrl: u[0].spreadsheet_url, lastSyncedAt: u[0].last_synced_at } });
  } catch { res.status(500).json({ error: "Failed to update spreadsheet config" }); }
});

app.post("/api/migrate", requireAdmin, async (req: Request, res: Response) => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS packages (id VARCHAR(100) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price INT NOT NULL, features TEXT[], type VARCHAR(50) NOT NULL DEFAULT 'both', category VARCHAR(50) NOT NULL DEFAULT 'regular')`);
    await pool.query(`CREATE TABLE IF NOT EXISTS addons (id VARCHAR(100) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price INT NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS bookings (id VARCHAR(100) PRIMARY KEY, customer_name VARCHAR(255) NOT NULL, customer_phone VARCHAR(50) NOT NULL, customer_city VARCHAR(100) NOT NULL, event_type VARCHAR(50) NOT NULL, wedding_type VARCHAR(100), event_date VARCHAR(50) NOT NULL, venue_location TEXT NOT NULL, package_id VARCHAR(100) REFERENCES packages(id), package_name VARCHAR(255) NOT NULL, package_price INT NOT NULL, addons VARCHAR(100)[] NOT NULL, addon_details JSONB NOT NULL, days JSONB, payment_method VARCHAR(50) NOT NULL, total_price INT NOT NULL, amount_paid INT NOT NULL, remaining_payment INT NOT NULL, status VARCHAR(50) NOT NULL DEFAULT 'pending', created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, approved_at TIMESTAMP WITH TIME ZONE, rejected_at TIMESTAMP WITH TIME ZONE)`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50)`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount INT DEFAULT 0`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) NOT NULL DEFAULT 'pending'`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid'`);
    await pool.query(`CREATE TABLE IF NOT EXISTS spreadsheet_config (id INT PRIMARY KEY DEFAULT 1, spreadsheet_id VARCHAR(255), spreadsheet_url TEXT, last_synced_at TIMESTAMP WITH TIME ZONE, CONSTRAINT single_row CHECK (id = 1))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS coupons (code VARCHAR(100) PRIMARY KEY, discount_percent INT NOT NULL, valid_until DATE NOT NULL, is_active BOOLEAN DEFAULT TRUE)`);

    const { rows: pkgs } = await pool.query("SELECT COUNT(*) FROM packages");
    if (parseInt(pkgs[0].count, 10) === 0) {
      const packages = [
        ["pkg-grand-legacy","Grand Legacy (Full Day Coverage)","Paket premium vintage liputan seharian penuh",1850000,["15 Instagram Story","Highlight (Reels) shot on iPhone","Camcorder Clips shot on Handycam","Digicam Photoshoot","20 Sheets Polaroid","5 Trend TikTok","Social Media Takeover","Raw Footage via Google Drive","2 Content Creator (iPhone 15/Above & Handycam)"],"both","signature"],
        ["pkg-visual-legacy","Visual Legacy (8 Hours Standby)","Paket vintage dengan durasi 8 jam standby",1450000,["10 Instagram Story","Highlight (Reels) shot on iPhone","Camcorder Clips shot on Handycam","Digicam Photoshoot","10 Sheets Polaroid","3 Trend TikTok","Raw Footage via Google Drive","2 Content Creator"],"both","signature"],
        ["pkg-golden-memoir","Golden Memoir (6 Hours Cover)","Paket vintage 6 jam fokus momen inti",1150000,["8 Instagram Story","Highlight (Reels) shot on iPhone","Camcorder Clips shot on Handycam","Digicam Photoshoot","8 Sheets Polaroid","2 Trend TikTok","Raw Footage via Google Drive","1 Content Creator"],"both","signature"],
        ["pkg-intimate-moments","Intimate Moments (4 Hours Coverage)","Paket vintage 4 jam untuk acara privat",850000,["5 Instagram Story","Highlight (Reels) shot on iPhone","Camcorder Clips shot on Handycam","Digicam Photoshoot","5 Sheets Polaroid","1 Trend TikTok","Raw Footage via Google Drive"],"both","signature"],
        ["pkg-ultimate-vibe","Ultimate Vibe (Full Day)","Paket reguler full day coverage",1350000,["15 Instagram Story","Cinematic Highlight Video","Drone Aerial Shot (External)","Full Day Dokumentasi Video","Photo Gallery (200+ Foto)","Flashdisk Eksklusif"],"both","regular"],
        ["pkg-insta-vibe","Insta Vibe (8 Hours)","Paket reguler 8 jam gaya liputan modern",1000000,["10 Instagram Story","Cinematic Highlight Video","Sameday Edit","Photo Gallery (100+ Foto)","Google Drive Link"],"both","regular"],
        ["pkg-prologue","Prologue (4 Hours Basic)","Paket basic 4 jam dokumentasi event",650000,["5 Instagram Story","Highlight Video 2-3 Menit","Photo Gallery (50+ Foto)","Google Drive Link"],"both","regular"]
      ];
      for (const p of packages) await pool.query("INSERT INTO packages (id,name,description,price,features,type,category) VALUES ($1,$2,$3,$4,$5,$6,$7)", p);
    }

    const { rows: ads } = await pool.query("SELECT COUNT(*) FROM addons");
    if (parseInt(ads[0].count, 10) === 0) {
      const addons = [
        ["addon-extra-ig-story","Extra IG Story","Penambahan instagram story",50000],
        ["addon-polaroid","Extra Sheets Polaroid","Lembar polaroid vintage tambahan",25000],
        ["addon-extra-tiktok","Extra Trend TikTok","Penambahan konten tiktok",75000],
        ["addon-digicam","Digicam Photoshoot","Sesi photoshoot vintage kamera digital",100000],
        ["addon-camcorder","Camcorder Clips","Rekaman video handycam retro",100000],
        ["addon-extra-creator","Extra Content Creator","Tambahan kru content creator",250000],
        ["addon-extra-hour","Extra Hour","Tambahan durasi 1 jam",100000]
      ];
      for (const a of addons) await pool.query("INSERT INTO addons (id,name,description,price) VALUES ($1,$2,$3,$4)", a);
    }

    const { rows: config } = await pool.query("SELECT COUNT(*) FROM spreadsheet_config");
    if (parseInt(config[0].count, 10) === 0) await pool.query("INSERT INTO spreadsheet_config (id,spreadsheet_id,spreadsheet_url,last_synced_at) VALUES (1,NULL,NULL,NULL)");

    const { rows: cpns } = await pool.query("SELECT COUNT(*) FROM coupons");
    if (parseInt(cpns[0].count, 10) === 0) await pool.query("INSERT INTO coupons (code,discount_percent,valid_until,is_active) VALUES ('KREALOVE10',10,'2027-12-31',TRUE)");

    res.json({ success: true, message: "Migration completed successfully" });
  } catch (error: any) {
    console.error("Migration failed:", error);
    res.status(500).json({ error: "Migration failed", message: error.message });
  }
});

export default app;
