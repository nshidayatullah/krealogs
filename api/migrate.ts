import { pool } from '../src/db';
import { Package, Addon } from '../src/types';

const initialPackages: Package[] = [
  {
    id: "pkg-grand-legacy",
    name: "Grand Legacy (Full Day Coverage)",
    description: "Paket premium vintage liputan seharian penuh menggunakan kamera digital vintage dan handycam camcorder klasik untuk hasil retro estetik terbaik.",
    price: 1850000,
    features: [
      "15 Instagram Story",
      "Highlight (Reels) shot on iPhone",
      "Camcorder Clips shot on Handycam",
      "Digicam Photoshoot",
      "20 Sheets Polaroid",
      "5 Trend TikTok",
      "Social Media Takeover",
      "Raw Footage via Google Drive",
      "2 Content Creator (iPhone 15/Above & Handycam)"
    ],
    type: "both",
    category: "signature"
  },
  {
    id: "pkg-visual-legacy",
    name: "Visual Legacy (8 Hours Standby)",
    description: "Paket vintage dengan durasi 8 jam standby, memadukan rekaman klip sinematik iPhone modern dengan retro handycam aesthetic.",
    price: 1450000,
    features: [
      "10 Instagram Story",
      "Highlight (Reels) shot on iPhone",
      "Camcorder Clips shot on Handycam",
      "Digicam Photoshoot",
      "10 Sheets Polaroid",
      "3 Trend TikTok",
      "Raw Footage via Google Drive",
      "2 Content Creator"
    ],
    type: "both",
    category: "signature"
  },
  {
    id: "pkg-golden-memoir",
    name: "Golden Memoir (6 Hours Cover)",
    description: "Paket vintage 6 jam yang fokus pada momen inti akad dan resepsi dengan balutan klasik handycam yang hangat dan penuh kenangan.",
    price: 1150000,
    features: [
      "8 Instagram Story",
      "Highlight (Reels) shot on iPhone",
      "Camcorder Clips shot on Handycam",
      "Digicam Photoshoot",
      "8 Sheets Polaroid",
      "2 Trend TikTok",
      "Raw Footage via Google Drive",
      "1 Content Creator"
    ],
    type: "both",
    category: "signature"
  },
  {
    id: "pkg-intimate-moments",
    name: "Intimate Moments (4 Hours Coverage)",
    description: "Paket vintage 4 jam untuk acara privat intim nan eksklusif seperti lamaran dan akad kecil dengan nuansa klasik penuh cinta.",
    price: 850000,
    features: [
      "5 Instagram Story",
      "Highlight (Reels) shot on iPhone",
      "Camcorder Clips shot on Handycam",
      "Digicam Photoshoot",
      "5 Sheets Polaroid",
      "1 Trend TikTok",
      "Raw Footage via Google Drive"
    ],
    type: "both",
    category: "signature"
  },
  {
    id: "pkg-ultimate-vibe",
    name: "Ultimate Vibe (Full Day)",
    description: "Paket reguler full day coverage dengan standar produksi sinematik modern dan hasil jernih resolusi tinggi.",
    price: 1350000,
    features: [
      "15 Instagram Story",
      "Cinematic Highlight Video",
      "Drone Aerial Shot (External)",
      "Full Day Dokumentasi Video",
      "Photo Gallery (200+ Foto)",
      "Flashdisk Eksklusif"
    ],
    type: "both",
    category: "regular"
  },
  {
    id: "pkg-insta-vibe",
    name: "Insta Vibe (8 Hours)",
    description: "Paket reguler 8 jam dengan gaya liputan modern, cocok untuk content creator dan brand event yang butuh visual kekinian.",
    price: 1000000,
    features: [
      "10 Instagram Story",
      "Cinematic Highlight Video",
      "Sameday Edit",
      "Photo Gallery (100+ Foto)",
      "Google Drive Link"
    ],
    type: "both",
    category: "regular"
  },
  {
    id: "pkg-prologue",
    name: "Prologue (4 Hours Basic)",
    description: "Paket basic 4 jam untuk dokumentasi event sederhana dengan output profesional dan harga terjangkau.",
    price: 650000,
    features: [
      "5 Instagram Story",
      "Highlight Video 2-3 Menit",
      "Photo Gallery (50+ Foto)",
      "Google Drive Link"
    ],
    type: "both",
    category: "regular"
  }
];

const initialAddons: Addon[] = [
  { id: "addon-extra-ig-story", name: "Extra IG Story", description: "Penambahan instagram story tambahan.", price: 50000 },
  { id: "addon-polaroid", name: "Extra Sheets Polaroid", description: "Lembar polaroid vintage tambahan.", price: 25000 },
  { id: "addon-extra-tiktok", name: "Extra Trend TikTok", description: "Penambahan konten tiktok.", price: 75000 },
  { id: "addon-digicam", name: "Digicam Photoshoot", description: "Sesi photoshoot vintage kamera digital.", price: 100000 },
  { id: "addon-camcorder", name: "Camcorder Clips", description: "Rekaman video handycam retro.", price: 100000 },
  { id: "addon-extra-creator", name: "Extra Content Creator", description: "Tambahan kru content creator.", price: 250000 },
  { id: "addon-extra-hour", name: "Extra Hour", description: "Tambahan durasi 1 jam.", price: 100000 }
];

export default async (req: any, res: any) => {
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
    console.log("Table 'packages' ready.");

    await pool.query(`CREATE TABLE IF NOT EXISTS addons (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price INT NOT NULL
    )`);
    console.log("Table 'addons' ready.");

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
      discount_amount INT DEFAULT 0
    )`);
    console.log("Table 'bookings' ready.");

    await pool.query(`CREATE TABLE IF NOT EXISTS spreadsheet_config (
      id INT PRIMARY KEY DEFAULT 1,
      spreadsheet_id VARCHAR(255),
      spreadsheet_url TEXT,
      last_synced_at TIMESTAMP WITH TIME ZONE,
      CONSTRAINT single_row CHECK (id = 1)
    )`);
    console.log("Table 'spreadsheet_config' ready.");

    await pool.query(`CREATE TABLE IF NOT EXISTS coupons (
      code VARCHAR(100) PRIMARY KEY,
      discount_percent INT NOT NULL,
      valid_until DATE NOT NULL,
      is_active BOOLEAN DEFAULT TRUE
    )`);
    console.log("Table 'coupons' ready.");

    const { rows: pkgs } = await pool.query("SELECT COUNT(*) FROM packages");
    if (parseInt(pkgs[0].count, 10) === 0) {
      for (const pkg of initialPackages) {
        await pool.query(
          "INSERT INTO packages (id, name, description, price, features, type, category) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [pkg.id, pkg.name, pkg.description, pkg.price, pkg.features, pkg.type, pkg.category || 'regular']
        );
      }
    }

    const { rows: ads } = await pool.query("SELECT COUNT(*) FROM addons");
    if (parseInt(ads[0].count, 10) === 0) {
      for (const addon of initialAddons) {
        await pool.query(
          "INSERT INTO addons (id, name, description, price) VALUES ($1, $2, $3, $4)",
          [addon.id, addon.name, addon.description, addon.price]
        );
      }
    }

    const { rows: config } = await pool.query("SELECT COUNT(*) FROM spreadsheet_config");
    if (parseInt(config[0].count, 10) === 0) {
      await pool.query(
        "INSERT INTO spreadsheet_config (id, spreadsheet_id, spreadsheet_url, last_synced_at) VALUES (1, NULL, NULL, NULL)"
      );
    }

    const { rows: cpns } = await pool.query("SELECT COUNT(*) FROM coupons");
    if (parseInt(cpns[0].count, 10) === 0) {
      await pool.query(
        "INSERT INTO coupons (code, discount_percent, valid_until, is_active) VALUES ('KREALOVE10', 10, '2027-12-31', TRUE)"
      );
    }

    res.json({ success: true, message: "Migration completed successfully" });
  } catch (error: any) {
    console.error("Migration failed:", error);
    res.status(500).json({ error: "Migration failed", message: error.message });
  }
};
