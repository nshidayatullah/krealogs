import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import dotenv from "dotenv";
import { Package, Addon, Booking, ApprovalStatus, PaymentStatus } from "./src/types";
import { pool } from "./src/db";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const CSRF_SECRET = process.env.JWT_SECRET || "csrf-fallback-secret";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

function mapBookingRow(b: any): Booking {
  const s = (b.status || "pending").toLowerCase();
  const approvalStatus: ApprovalStatus = ["pending", "approved", "rejected"].includes(s) ? s : s === "dp_paid" || s === "paid" ? "approved" : "pending";
  const paymentStatus: PaymentStatus = s === "paid" ? "paid" : s === "dp_paid" ? "dp_paid" : "unpaid";
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

function mapCouponRow(c: any) {
  return {
    code: c.code,
    discountPercent: Number(c.discount_percent),
    validUntil: c.valid_until,
    isActive: c.is_active
  };
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

function requireCsrf(req: express.Request, res: express.Response, next: express.NextFunction) {
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

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(cookieParser());

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/api/auth/csrf", (req, res) => {
    const token = crypto.randomBytes(32).toString("hex");
    const csrfCookie = jwt.sign({ csrf: token }, CSRF_SECRET, { expiresIn: "24h" });
    res.cookie("csrf_token", csrfCookie, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ csrfToken: token });
  });

  // ------------------------------------
  // Auth Endpoints
  // ------------------------------------

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi" });
    }
    if (username.toLowerCase() !== ADMIN_USERNAME.toLowerCase()) {
      return res.status(401).json({ error: "Kombinasi Username dan Password tidak cocok" });
    }
    const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!valid) {
      return res.status(401).json({ error: "Kombinasi Username dan Password tidak cocok" });
    }
    const token = jwt.sign({ username: ADMIN_USERNAME }, JWT_SECRET, { expiresIn: "24h" });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ success: true });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/check", (req, res) => {
    const token = req.cookies?.token;
    if (!token) {
      return res.json({ authenticated: false });
    }
    try {
      jwt.verify(token, JWT_SECRET);
      res.json({ authenticated: true });
    } catch {
      res.json({ authenticated: false });
    }
  });

  // ------------------------------------
  // Public API Endpoints
  // ------------------------------------

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/packages", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM packages");
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch packages" });
    }
  });

  app.get("/api/addons", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM addons");
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch addons" });
    }
  });

  app.get("/api/coupons/validate/:code", async (req, res) => {
    const { code } = req.params;
    try {
      const { rows } = await pool.query(
        "SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) AND is_active = TRUE",
        [code]
      );
      if (rows.length === 0) {
        return res.status(404).json({ valid: false, error: "Kode kupon tidak ditemukan atau tidak aktif" });
      }
      const coupon = mapCouponRow(rows[0]);
      const today = new Date().toISOString().split("T")[0];
      if (coupon.validUntil < today) {
        return res.status(400).json({ valid: false, error: "Kode kupon telah kadaluarsa" });
      }
      res.json({ valid: true, coupon });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal memvalidasi kupon" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    const bookingData: Omit<Booking, "id" | "createdAt" | "status"> = req.body;
    
    if (
      !bookingData.customerName ||
      !bookingData.customerPhone ||
      !bookingData.customerCity ||
      !bookingData.eventType ||
      !bookingData.eventDate ||
      !bookingData.venueLocation ||
      !bookingData.packageId
    ) {
      return res.status(400).json({ error: "Mohon lengkapi semua data pesanan" });
    }

    const cleanPhone = bookingData.customerPhone.trim().replace(/[^0-9+]/g, "");

    const newBooking: Booking = {
      ...bookingData,
      customerPhone: cleanPhone,
      id: `BOOK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      approvalStatus: "pending",
      paymentStatus: "unpaid"
    };

    try {
      await pool.query(
        `INSERT INTO bookings (
          id, customer_name, customer_phone, customer_city, event_type, wedding_type, 
          event_date, venue_location, package_id, package_name, package_price, 
          addons, addon_details, days, payment_method, total_price, amount_paid, 
          remaining_payment, status, created_at, coupon_code, discount_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
        [
          newBooking.id, newBooking.customerName, newBooking.customerPhone, newBooking.customerCity,
          newBooking.eventType, newBooking.weddingType || null, newBooking.eventDate, newBooking.venueLocation,
          newBooking.packageId, newBooking.packageName, newBooking.packagePrice,
          newBooking.addons, JSON.stringify(newBooking.addonDetails), newBooking.days ? JSON.stringify(newBooking.days) : null,
          newBooking.paymentMethod, newBooking.totalPrice, newBooking.amountPaid,
          newBooking.remainingPayment, "pending", newBooking.createdAt,
          newBooking.couponCode || null, newBooking.discountAmount || 0
        ]
      );
      res.json({ success: true, booking: newBooking });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: "Gagal menyimpan pesanan" });
    }
  });

  app.get("/api/bookings/search", async (req, res) => {
    const { whatsapp } = req.query;
    if (!whatsapp) {
      return res.status(400).json({ error: "whatsapp parameter is required" });
    }

    const cleanInput = String(whatsapp).trim().replace(/[^0-9+]/g, "");
    if (!cleanInput) {
      return res.json([]);
    }

    const searchNum = cleanInput.replace(/[^0-9]/g, "");

    try {
      const { rows } = await pool.query(
        `SELECT * FROM bookings 
         WHERE regexp_replace(customer_phone, '[^0-9]', '', 'g') LIKE $1 
         OR $2 LIKE '%' || regexp_replace(customer_phone, '[^0-9]', '', 'g') || '%'`,
        [`%${searchNum}%`, searchNum]
      );
      res.json(rows.map(mapBookingRow).slice(0, 10));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error searching bookings" });
    }
  });

  // ------------------------------------
  // Admin-Protected API Endpoints
  // ------------------------------------

  app.get("/api/db", requireAdmin, async (req, res) => {
    try {
      const { rows: packages } = await pool.query("SELECT * FROM packages");
      const { rows: addons } = await pool.query("SELECT * FROM addons");
      const { rows: bookingsRows } = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
      const { rows: couponsRows } = await pool.query("SELECT * FROM coupons ORDER BY code ASC");
      const { rows: configRows } = await pool.query("SELECT * FROM spreadsheet_config WHERE id = 1");

      const bookings = bookingsRows.map(mapBookingRow);
      const coupons = couponsRows.map(mapCouponRow);
      const spreadsheetConfig = configRows[0] ? {
        spreadsheetId: configRows[0].spreadsheet_id,
        spreadsheetUrl: configRows[0].spreadsheet_url,
        lastSyncedAt: configRows[0].last_synced_at
      } : {
        spreadsheetId: null,
        spreadsheetUrl: null,
        lastSyncedAt: null
      };

      res.json({ packages, addons, bookings, coupons, spreadsheetConfig });
    } catch (error: any) {
      console.error("CRITICAL error fetching database status:", error);
      res.status(500).json({ error: "Terjadi kesalahan internal server" });
    }
  });

  app.post("/api/packages", requireAdmin, requireCsrf, async (req, res) => {
    const newPkg: Package = req.body;
    if (!newPkg.id || !newPkg.name || newPkg.price === undefined) {
      return res.status(400).json({ error: "Missing required properties" });
    }
    try {
      await pool.query(
        "INSERT INTO packages (id, name, description, price, features, type, category) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [newPkg.id, newPkg.name, newPkg.description, newPkg.price, newPkg.features, newPkg.type, newPkg.category || 'regular']
      );
      res.json({ success: true, package: newPkg });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create package" });
    }
  });

  app.put("/api/packages/:id", requireAdmin, requireCsrf, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, features, type, category } = req.body;
    try {
      const { rows } = await pool.query("SELECT * FROM packages WHERE id = $1", [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Package not found" });
      }
      const updatedPkg = { ...rows[0], ...req.body };
      await pool.query(
        "UPDATE packages SET name = $1, description = $2, price = $3, features = $4, type = $5, category = $6 WHERE id = $7",
        [updatedPkg.name, updatedPkg.description, updatedPkg.price, updatedPkg.features, updatedPkg.type, updatedPkg.category || 'regular', id]
      );
      res.json({ success: true, package: updatedPkg });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update package" });
    }
  });

  app.delete("/api/packages/:id", requireAdmin, requireCsrf, async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("DELETE FROM packages WHERE id = $1", [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Package not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete package" });
    }
  });

  app.post("/api/addons", requireAdmin, requireCsrf, async (req, res) => {
    const newAddon: Addon = req.body;
    if (!newAddon.id || !newAddon.name || newAddon.price === undefined) {
      return res.status(400).json({ error: "Missing required properties" });
    }
    try {
      await pool.query(
        "INSERT INTO addons (id, name, description, price) VALUES ($1, $2, $3, $4)",
        [newAddon.id, newAddon.name, newAddon.description, newAddon.price]
      );
      res.json({ success: true, addon: newAddon });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create addon" });
    }
  });

  app.put("/api/addons/:id", requireAdmin, requireCsrf, async (req, res) => {
    const { id } = req.params;
    try {
      const { rows } = await pool.query("SELECT * FROM addons WHERE id = $1", [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Add-on not found" });
      }
      const updatedAddon = { ...rows[0], ...req.body };
      await pool.query(
        "UPDATE addons SET name = $1, description = $2, price = $3 WHERE id = $4",
        [updatedAddon.name, updatedAddon.description, updatedAddon.price, id]
      );
      res.json({ success: true, addon: updatedAddon });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update addon" });
    }
  });

  app.delete("/api/addons/:id", requireAdmin, requireCsrf, async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("DELETE FROM addons WHERE id = $1", [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Add-on not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete addon" });
    }
  });

  app.post("/api/coupons", requireAdmin, requireCsrf, async (req, res) => {
    const { code, discountPercent, validUntil, isActive } = req.body;
    if (!code || discountPercent === undefined || !validUntil) {
      return res.status(400).json({ error: "Missing required properties" });
    }
    const dp = Number(discountPercent);
    if (dp < 0 || dp > 100) {
      return res.status(400).json({ error: "discountPercent must be between 0 and 100" });
    }
    try {
      await pool.query(
        "INSERT INTO coupons (code, discount_percent, valid_until, is_active) VALUES ($1, $2, $3, $4)",
        [code.toUpperCase().trim(), dp, validUntil, isActive !== undefined ? isActive : true]
      );
      res.json({ success: true, coupon: { code: code.toUpperCase().trim(), discountPercent: dp, validUntil, isActive: isActive !== undefined ? isActive : true } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal membuat kupon baru" });
    }
  });

  app.put("/api/coupons/:code", requireAdmin, requireCsrf, async (req, res) => {
    const { code } = req.params;
    const { discountPercent, validUntil, isActive } = req.body;
    const dp = Number(discountPercent);
    if (dp < 0 || dp > 100) {
      return res.status(400).json({ error: "discountPercent must be between 0 and 100" });
    }
    try {
      await pool.query(
        "UPDATE coupons SET discount_percent = $1, valid_until = $2, is_active = $3 WHERE UPPER(code) = UPPER($4)",
        [dp, validUntil, isActive, code.toUpperCase().trim()]
      );
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal memperbarui kupon" });
    }
  });

  app.delete("/api/coupons/:code", requireAdmin, requireCsrf, async (req, res) => {
    const { code } = req.params;
    try {
      const result = await pool.query("DELETE FROM coupons WHERE UPPER(code) = UPPER($1)", [code.toUpperCase().trim()]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Kupon tidak ditemukan" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal menghapus kupon" });
    }
  });

  app.get("/api/bookings", requireAdmin, async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
      res.json(rows.map(mapBookingRow));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings/:id/approval", requireAdmin, requireCsrf, async (req, res) => {
    const { id } = req.params;
    const { approvalStatus } = req.body;

    if (!approvalStatus || !["approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json({ error: "Invalid approvalStatus. Must be 'approved' or 'rejected'" });
    }

    try {
      const { rows } = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Booking tidak ditemukan" });
      }

      const now = new Date().toISOString();
      const approvedAt = approvalStatus === "approved" ? now : rows[0].approved_at;
      const rejectedAt = approvalStatus === "rejected" ? now : rows[0].rejected_at;
      const dbStatus = approvalStatus === "rejected" ? "rejected" : (rows[0].payment_status || "unpaid") === "paid" ? "paid" : (rows[0].payment_status || "unpaid") === "dp_paid" ? "dp_paid" : "approved";

      await pool.query(
        "UPDATE bookings SET status = $1, approval_status = $2, approved_at = $3, rejected_at = $4 WHERE id = $5",
        [dbStatus, approvalStatus, approvedAt, rejectedAt, id]
      );

      const { rows: updated } = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
      res.json({ success: true, booking: mapBookingRow(updated[0]) });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal memperbarui status persetujuan" });
    }
  });

  app.post("/api/bookings/:id/payment", requireAdmin, requireCsrf, async (req, res) => {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus || !["dp_paid", "paid"].includes(paymentStatus)) {
      return res.status(400).json({ error: "Invalid paymentStatus. Must be 'dp_paid' or 'paid'" });
    }

    try {
      const { rows } = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Booking tidak ditemukan" });
      }

      if (rows[0].approval_status !== "approved") {
        return res.status(400).json({ error: "Booking harus disetujui terlebih dahulu sebelum konfirmasi pembayaran" });
      }

      const dbStatus = paymentStatus;
      let amountPaid = Number(rows[0].amount_paid);
      let remainingPayment = Number(rows[0].remaining_payment);
      const totalPrice = Number(rows[0].total_price);

      if (paymentStatus === "paid") {
        amountPaid = totalPrice;
        remainingPayment = 0;
      }

      await pool.query(
        "UPDATE bookings SET status = $1, payment_status = $2, amount_paid = $3, remaining_payment = $4 WHERE id = $5",
        [dbStatus, paymentStatus, amountPaid, remainingPayment, id]
      );

      const { rows: updated } = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
      res.json({ success: true, booking: mapBookingRow(updated[0]) });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal memperbarui status pembayaran" });
    }
  });

  app.post("/api/spreadsheet/config", requireAdmin, requireCsrf, async (req, res) => {
    const { spreadsheetId, spreadsheetUrl, lastSyncedAt } = req.body;
    try {
      const { rows } = await pool.query("SELECT * FROM spreadsheet_config WHERE id = 1");
      if (rows.length === 0) {
        await pool.query(
          "INSERT INTO spreadsheet_config (id, spreadsheet_id, spreadsheet_url, last_synced_at) VALUES (1, $1, $2, $3)",
          [spreadsheetId || null, spreadsheetUrl || null, lastSyncedAt || null]
        );
      } else {
        await pool.query(
          `UPDATE spreadsheet_config 
           SET spreadsheet_id = COALESCE($1, spreadsheet_id), 
               spreadsheet_url = COALESCE($2, spreadsheet_url), 
               last_synced_at = COALESCE($3, last_synced_at) 
           WHERE id = 1`,
          [
            spreadsheetId !== undefined ? spreadsheetId : null,
            spreadsheetUrl !== undefined ? spreadsheetUrl : null,
            lastSyncedAt !== undefined ? lastSyncedAt : null
          ]
        );
      }

      const { rows: updated } = await pool.query("SELECT * FROM spreadsheet_config WHERE id = 1");
      res.json({
        success: true,
        spreadsheetConfig: {
          spreadsheetId: updated[0].spreadsheet_id,
          spreadsheetUrl: updated[0].spreadsheet_url,
          lastSyncedAt: updated[0].last_synced_at
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update spreadsheet config" });
    }
  });

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

  app.get("/favicon.ico", (req, res) => res.status(204).end());

  // ------------------------------------
  // Front-end Asset serving / Vite Setup
  // ------------------------------------
  const isVercel = process.env.VERCEL === "1";
  if (!isVercel) {
    if (process.env.NODE_ENV !== "production") {
      const viteModuleName = "vite";
      const { createServer: createViteServer } = await import(viteModuleName);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  if (process.env.VERCEL !== "1" && !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  return app;
}

export const appPromise = startServer();
export default appPromise;
