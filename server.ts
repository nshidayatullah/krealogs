import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { Package, Addon, Booking } from "./src/types";
import { pool } from "./src/db";

// Load environment variables
dotenv.config();

// Helper to map DB booking row to frontend camelCase camelCase interface
function mapBookingRow(b: any): Booking {
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
    status: b.status,
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // ------------------------------------
  // API Endpoints
  // ------------------------------------

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get full DB structure
  app.get("/api/db", async (req, res) => {
    try {
      console.log("Database connection ping to URL: ", process.env.DATABASE_URL ? "URL is defined (starts with " + process.env.DATABASE_URL.substring(0, 15) + ")" : "URL is UNDEFINED");
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
      res.status(500).json({ error: "Terjadi kesalahan internal server", details: error.message, stack: error.stack });
    }
  });

  // Packages CRUD
  app.get("/api/packages", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM packages");
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch packages" });
    }
  });

  app.post("/api/packages", async (req, res) => {
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

  app.put("/api/packages/:id", async (req, res) => {
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

  app.delete("/api/packages/:id", async (req, res) => {
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

  // Add-ons CRUD
  app.get("/api/addons", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM addons");
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch addons" });
    }
  });

  app.post("/api/addons", async (req, res) => {
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

  app.put("/api/addons/:id", async (req, res) => {
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

  app.delete("/api/addons/:id", async (req, res) => {
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

  // Coupons CRUD & Validation APIs
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

  app.post("/api/coupons", async (req, res) => {
    const { code, discountPercent, validUntil, isActive } = req.body;
    if (!code || discountPercent === undefined || !validUntil) {
      return res.status(400).json({ error: "Missing required properties" });
    }
    try {
      await pool.query(
        "INSERT INTO coupons (code, discount_percent, valid_until, is_active) VALUES ($1, $2, $3, $4)",
        [code.toUpperCase().trim(), Number(discountPercent), validUntil, isActive !== undefined ? isActive : true]
      );
      res.json({ success: true, coupon: { code: code.toUpperCase().trim(), discountPercent, validUntil, isActive: isActive !== undefined ? isActive : true } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal membuat kupon baru" });
    }
  });

  app.put("/api/coupons/:code", async (req, res) => {
    const { code } = req.params;
    const { discountPercent, validUntil, isActive } = req.body;
    try {
      await pool.query(
        "UPDATE coupons SET discount_percent = $1, valid_until = $2, is_active = $3 WHERE UPPER(code) = UPPER($4)",
        [Number(discountPercent), validUntil, isActive, code.toUpperCase().trim()]
      );
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal memperbarui kupon" });
    }
  });

  app.delete("/api/coupons/:code", async (req, res) => {
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

  // Bookings APIS
  app.get("/api/bookings", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
      res.json(rows.map(mapBookingRow));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch bookings" });
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

    // Format WA number to clean digits (no whitespaces/symbols)
    const cleanPhone = bookingData.customerPhone.trim().replace(/[^0-9+]/g, "");

    const newBooking: Booking = {
      ...bookingData,
      customerPhone: cleanPhone,
      id: `BOOK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      status: "pending"
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
          newBooking.remainingPayment, newBooking.status, newBooking.createdAt,
          newBooking.couponCode || null, newBooking.discountAmount || 0
        ]
      );
      res.json({ success: true, booking: newBooking });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: "Gagal menyimpan pesanan" });
    }
  });

  // Searching status by WhatsApp number
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
      // Find all bookings with matched phone using standard regex replace in PG
      const { rows } = await pool.query(
        `SELECT * FROM bookings 
         WHERE regexp_replace(customer_phone, '[^0-9]', '', 'g') LIKE $1 
         OR $2 LIKE '%' || regexp_replace(customer_phone, '[^0-9]', '', 'g') || '%'`,
        [`%${searchNum}%`, searchNum]
      );
      res.json(rows.map(mapBookingRow));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error searching bookings" });
    }
  });

  // Accept/Reject Booking (Admin)
  app.post("/api/bookings/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected'

    if (!status || !["approved", "rejected", "pending", "paid", "dp_paid"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    try {
      const { rows } = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Booking tidak ditemukan" });
      }

      let approvedAt = rows[0].approved_at;
      let rejectedAt = rows[0].rejected_at;
      const now = new Date().toISOString();

      if (status === "approved") {
        approvedAt = now;
      } else if (status === "rejected") {
        rejectedAt = now;
      }

      await pool.query(
        "UPDATE bookings SET status = $1, approved_at = $2, rejected_at = $3 WHERE id = $4",
        [status, approvedAt, rejectedAt, id]
      );

      const { rows: updated } = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
      res.json({ success: true, booking: mapBookingRow(updated[0]) });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update booking status" });
    }
  });

  // Save spreadsheet connection credentials / config
  app.post("/api/spreadsheet/config", async (req, res) => {
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

  // ------------------------------------
  // Front-end Asset serving / Vite Setup
  // ------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if we are NOT in a serverless environment
  if (process.env.VERCEL !== "1" && !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  return app;
}

export const appPromise = startServer();
export default appPromise;
