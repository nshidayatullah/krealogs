import dotenv from "dotenv";
dotenv.config();

import { pool } from '../db';
import { Package, Addon } from '../types';

const initialPackages: Package[] = [
  // SIGNATURE SECTION — Vintage Look
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
      "15 Sheets Polaroid",
      "3 Trend TikTok",
      "Social Media Takeover",
      "Raw Footage via Google Drive",
      "2 Content Creator (iPhone 15/Above & Handycam)"
    ],
    type: "both",
    category: "signature"
  },
  {
    id: "pkg-golden-memoir",
    name: "Golden Memoir (8 Hours Standby)",
    description: "Paket memoir premium durasi 8 jam standby dilengkapi cetak polaroid fisik dan digicam retro aesthetic.",
    price: 1250000,
    features: [
      "10 Instagram Story",
      "Highlight (Reels) shot on iPhone",
      "Camcorder Clips shot on Handycam",
      "Digicam Photoshoot",
      "5 Sheets Polaroid",
      "1 Trend TikTok",
      "Social Media Takeover",
      "Raw Footage via Google Drive",
      "2 Content Creator (iPhone 15/Above & Handycam)"
    ],
    type: "both",
    category: "signature"
  },
  {
    id: "pkg-intimate-moments",
    name: "Intimate Moments (6 Hours Standby)",
    description: "Paket minimalis intim durasi 6 jam standby, berfokus pada klip handycam retro sinematik dan story real-time.",
    price: 850000,
    features: [
      "5 Instagram Story",
      "Highlight (Reels) shot on iPhone",
      "Camcorder Clips shot on Handycam",
      "Social Media Takeover",
      "Raw Footage via Google Drive",
      "2 Content Creator (iPhone 15/Above & Handycam)"
    ],
    type: "both",
    category: "signature"
  },
  // REGULAR SECTION — Modern Look
  {
    id: "pkg-ultimate-vibe",
    name: "Ultimate Vibe (Full Day Coverage)",
    description: "Paket liputan modern seharian penuh untuk menangkap setiap momen berharga Anda secara estetik, modern, dan instan.",
    price: 950000,
    features: [
      "15 Instagram Story",
      "Highlight (Reels) shot on iPhone",
      "3 Trend TikTok",
      "Social Media Takeover",
      "Raw Footage via Google Drive",
      "1 Content Creator (iPhone 15/Above)"
    ],
    type: "both",
    category: "regular"
  },
  {
    id: "pkg-insta-vibe",
    name: "Insta Vibe (8 Hours Standby)",
    description: "Paket liputan modern 8 jam standby, sangat ideal untuk mengabadikan inti rangkaian acara Anda secara kreatif.",
    price: 650000,
    features: [
      "10 Instagram Story",
      "Highlight (Reels) shot on iPhone",
      "1 Trend TikTok",
      "Social Media Takeover",
      "Raw Footage via Google Drive",
      "1 Content Creator (iPhone 15/Above)"
    ],
    type: "both",
    category: "regular"
  },
  {
    id: "pkg-prologue",
    name: "Prologue (6 Hours Standby)",
    description: "Paket ringkas liputan modern 6 jam standby, pas untuk acara minimalis atau syukuran sederhana.",
    price: 400000,
    features: [
      "5 Instagram Story",
      "Highlight (Reels) shot on iPhone",
      "Social Media Takeover",
      "Raw Footage via Google Drive",
      "1 Content Creator (iPhone 15/Above)"
    ],
    type: "both",
    category: "regular"
  }
];

const initialAddons: Addon[] = [
  {
    id: "add-ig-story",
    name: "Extra Instagram Story",
    description: "Tambahan postingan story Instagram per item.",
    price: 15000
  },
  {
    id: "add-polaroid",
    name: "Polaroid Sheets",
    description: "Cetak foto fisik Polaroid per lembar.",
    price: 25000
  },
  {
    id: "add-tiktok",
    name: "Extra Trend TikTok",
    description: "Tambahan pembuatan video trend TikTok per konten.",
    price: 15000
  },
  {
    id: "add-digicam",
    name: "Digicam Photoshoot",
    description: "Photoshoot aesthetic menggunakan kamera digital vintage.",
    price: 150000
  },
  {
    id: "add-camcorder",
    name: "Camcorder Clips",
    description: "Klip video bergaya retro dengan Handycam/Camcorder klasik.",
    price: 450000
  },
  {
    id: "add-extra-creator",
    name: "Extra Content Creator (3 Hours)",
    description: "Tambahan 1 Content Creator pendukung untuk 3 jam.",
    price: 200000
  },
  {
    id: "add-extra-hour",
    name: "Extra Hour",
    description: "Tambahan durasi standby content creator per jam.",
    price: 75000
  }
];

async function runMigration() {
  console.log("Starting PostgreSQL migration...");

  try {
    // 1. Create Packages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS packages (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INT NOT NULL,
        features TEXT[] NOT NULL,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'regular'
      );
    `);
    console.log("Table 'packages' ready.");

    // 2. Create Addons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS addons (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INT NOT NULL
      );
    `);
    console.log("Table 'addons' ready.");

    // 3. Create Bookings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
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
        rejected_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log("Table 'bookings' ready.");

    // 4. Create Spreadsheet Config table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS spreadsheet_config (
        id INT PRIMARY KEY DEFAULT 1,
        spreadsheet_id VARCHAR(255),
        spreadsheet_url TEXT,
        last_synced_at TIMESTAMP WITH TIME ZONE,
        CONSTRAINT single_row CHECK (id = 1)
      );
    `);
    console.log("Table 'spreadsheet_config' ready.");

    // 5. Create Coupons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        code VARCHAR(100) PRIMARY KEY,
        discount_percent INT NOT NULL,
        valid_until DATE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);
    console.log("Table 'coupons' ready.");

    // 6. Add new columns to bookings if not exist
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50)`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount INT DEFAULT 0`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) NOT NULL DEFAULT 'pending'`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid'`);
    console.log("Booking columns ready.");

    // 7. Seed Packages if empty
    const { rows: pkgs } = await pool.query("SELECT COUNT(*) FROM packages");
    if (parseInt(pkgs[0].count, 10) === 0) {
      console.log("Seeding initial packages...");
      for (const pkg of initialPackages) {
        await pool.query(
          "INSERT INTO packages (id, name, description, price, features, type, category) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [pkg.id, pkg.name, pkg.description, pkg.price, pkg.features, pkg.type, pkg.category || 'regular']
        );
      }
      console.log("Seeding packages complete.");
    } else {
      console.log("Packages table already has data, skipping seeding.");
    }

    // 8. Seed Addons if empty
    const { rows: ads } = await pool.query("SELECT COUNT(*) FROM addons");
    if (parseInt(ads[0].count, 10) === 0) {
      console.log("Seeding initial addons...");
      for (const addon of initialAddons) {
        await pool.query(
          "INSERT INTO addons (id, name, description, price) VALUES ($1, $2, $3, $4)",
          [addon.id, addon.name, addon.description, addon.price]
        );
      }
      console.log("Seeding addons complete.");
    } else {
      console.log("Addons table already has data, skipping seeding.");
    }

    // 9. Seed initial spreadsheet config if empty

    // 10. Seed default coupon if empty
    const { rows: cpns } = await pool.query("SELECT COUNT(*) FROM coupons");
    if (parseInt(cpns[0].count, 10) === 0) {
      console.log("Seeding default coupon...");
      await pool.query(
        "INSERT INTO coupons (code, discount_percent, valid_until, is_active) VALUES ($1, $2, $3, $4)",
        ["KREALOVE10", 10, "2027-12-31", true]
      );
      console.log("Default coupon seeded.");
    }
    const { rows: config } = await pool.query("SELECT COUNT(*) FROM spreadsheet_config");
    if (parseInt(config[0].count, 10) === 0) {
      console.log("Initializing spreadsheet config...");
      await pool.query(
        "INSERT INTO spreadsheet_config (id, spreadsheet_id, spreadsheet_url, last_synced_at) VALUES (1, NULL, NULL, NULL)"
      );
      console.log("Spreadsheet config initialized.");
    }

    console.log("PostgreSQL database migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

if (process.env.VERCEL !== "1" && !process.env.VERCEL) {
  runMigration();
} else {
  console.log("VERCEL env detected, skipping automatic migration.");
}
