import { Request, Response } from 'express';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS packages (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price INT NOT NULL,
      features TEXT[],
      type VARCHAR(50) NOT NULL DEFAULT 'both',
      category VARCHAR(50) NOT NULL DEFAULT 'regular'
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS addons (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price INT NOT NULL
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(100) PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_city VARCHAR(100) NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      wedding_type VARCHAR(100),
      event_date VARCHAR(50) NOT NULL,
      venue_location TEXT NOT NULL,
      package_id VARCHAR(100) REFERENCES packages(id),
      package_name VARCHAR(255) NOT NULL,
      package_price INT NOT NULL,
      addons VARCHAR(100)[] NOT NULL,
      addon_details JSONB NOT NULL,
      days JSONB,
      payment_method VARCHAR(50) NOT NULL,
      total_price INT NOT NULL,
      amount_paid INT NOT NULL,
      remaining_payment INT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      approved_at TIMESTAMP WITH TIME ZONE,
      rejected_at TIMESTAMP WITH TIME ZONE,
      coupon_code VARCHAR(50),
      discount_amount INT DEFAULT 0,
      coupon_discount INT DEFAULT 0
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS spreadsheet_config (
      id INT PRIMARY KEY DEFAULT 1,
      spreadsheet_id VARCHAR(255),
      spreadsheet_url TEXT,
      last_synced_at TIMESTAMP WITH TIME ZONE,
      CONSTRAINT single_row CHECK (id = 1)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS coupons (
      code VARCHAR(100) PRIMARY KEY,
      discount_percent INT NOT NULL,
      valid_until DATE NOT NULL,
      is_active BOOLEAN DEFAULT TRUE
    )`);

    const { rows: pkgs } = await pool.query("SELECT COUNT(*) FROM packages");
    if (parseInt(pkgs[0].count, 10) === 0) {
      const packages = [
        ["pkg-grand-legacy", "Grand Legacy (Full Day Coverage)", "Paket premium vintage liputan seharian penuh menggunakan kamera digital vintage dan handycam camcorder klasik untuk hasil retro estetik terbaik.", 1850000, ["15 Instagram Story", "Highlight (Reels) shot on iPhone", "Camcorder Clips shot on Handycam", "Digicam Photoshoot", "20 Sheets Polaroid", "5 Trend TikTok", "Social Media Takeover", "Raw Footage via Google Drive", "2 Content Creator (iPhone 15/Above & Handycam)"], "both", "signature"],
        ["pkg-visual-legacy", "Visual Legacy (8 Hours Standby)", "Paket vintage dengan durasi 8 jam standby, memadukan rekaman klip sinematik iPhone modern dengan retro handycam aesthetic.", 1450000, ["10 Instagram Story", "Highlight (Reels) shot on iPhone", "Camcorder Clips shot on Handycam", "Digicam Photoshoot", "10 Sheets Polaroid", "3 Trend TikTok", "Raw Footage via Google Drive", "2 Content Creator"], "both", "signature"],
        ["pkg-golden-memoir", "Golden Memoir (6 Hours Cover)", "Paket vintage 6 jam yang fokus pada momen inti akad dan resepsi dengan balutan klasik handycam yang hangat dan penuh kenangan.", 1150000, ["8 Instagram Story", "Highlight (Reels) shot on iPhone", "Camcorder Clips shot on Handycam", "Digicam Photoshoot", "8 Sheets Polaroid", "2 Trend TikTok", "Raw Footage via Google Drive", "1 Content Creator"], "both", "signature"],
        ["pkg-intimate-moments", "Intimate Moments (4 Hours Coverage)", "Paket vintage 4 jam untuk acara privat intim nan eksklusif seperti lamaran dan akad kecil dengan nuansa klasik penuh cinta.", 850000, ["5 Instagram Story", "Highlight (Reels) shot on iPhone", "Camcorder Clips shot on Handycam", "Digicam Photoshoot", "5 Sheets Polaroid", "1 Trend TikTok", "Raw Footage via Google Drive"], "both", "signature"],
        ["pkg-ultimate-vibe", "Ultimate Vibe (Full Day)", "Paket reguler full day coverage dengan standar produksi sinematik modern dan hasil jernih resolusi tinggi.", 1350000, ["15 Instagram Story", "Cinematic Highlight Video", "Drone Aerial Shot (External)", "Full Day Dokumentasi Video", "Photo Gallery (200+ Foto)", "Flashdisk Eksklusif"], "both", "regular"],
        ["pkg-insta-vibe", "Insta Vibe (8 Hours)", "Paket reguler 8 jam dengan gaya liputan modern, cocok untuk content creator dan brand event yang butuh visual kekinian.", 1000000, ["10 Instagram Story", "Cinematic Highlight Video", "Sameday Edit", "Photo Gallery (100+ Foto)", "Google Drive Link"], "both", "regular"],
        ["pkg-prologue", "Prologue (4 Hours Basic)", "Paket basic 4 jam untuk dokumentasi event sederhana dengan output profesional dan harga terjangkau.", 650000, ["5 Instagram Story", "Highlight Video 2-3 Menit", "Photo Gallery (50+ Foto)", "Google Drive Link"], "both", "regular"]
      ];
      for (const p of packages) {
        await pool.query("INSERT INTO packages (id, name, description, price, features, type, category) VALUES ($1, $2, $3, $4, $5, $6, $7)", p);
      }
    }

    const { rows: ads } = await pool.query("SELECT COUNT(*) FROM addons");
    if (parseInt(ads[0].count, 10) === 0) {
      const addons = [
        ["addon-extra-ig-story", "Extra IG Story", "Penambahan instagram story tambahan.", 50000],
        ["addon-polaroid", "Extra Sheets Polaroid", "Lembar polaroid vintage tambahan.", 25000],
        ["addon-extra-tiktok", "Extra Trend TikTok", "Penambahan konten tiktok.", 75000],
        ["addon-digicam", "Digicam Photoshoot", "Sesi photoshoot vintage kamera digital.", 100000],
        ["addon-camcorder", "Camcorder Clips", "Rekaman video handycam retro.", 100000],
        ["addon-extra-creator", "Extra Content Creator", "Tambahan kru content creator.", 250000],
        ["addon-extra-hour", "Extra Hour", "Tambahan durasi 1 jam.", 100000]
      ];
      for (const a of addons) {
        await pool.query("INSERT INTO addons (id, name, description, price) VALUES ($1, $2, $3, $4)", a);
      }
    }

    const { rows: config } = await pool.query("SELECT COUNT(*) FROM spreadsheet_config");
    if (parseInt(config[0].count, 10) === 0) {
      await pool.query("INSERT INTO spreadsheet_config (id, spreadsheet_id, spreadsheet_url, last_synced_at) VALUES (1, NULL, NULL, NULL)");
    }

    const { rows: cpns } = await pool.query("SELECT COUNT(*) FROM coupons");
    if (parseInt(cpns[0].count, 10) === 0) {
      await pool.query("INSERT INTO coupons (code, discount_percent, valid_until, is_active) VALUES ('KREALOVE10', 10, '2027-12-31', TRUE)");
    }

    res.json({ success: true, message: "Migration completed successfully" });
  } catch (error: any) {
    console.error("Migration failed:", error);
    res.status(500).json({ error: "Migration failed", message: error.message });
  }
};
