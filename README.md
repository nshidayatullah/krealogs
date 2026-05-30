# Krealogs — Premium Content Creator Booking Platform

Krealogs is a modern, premium web application designed for booking and managing creative social media content creators, professional videographers, and vintage cinematography services. The platform features an intuitive customer checkout experience with multi-day scheduling, add-on upsells, and an advanced administrative panel with live transaction audit recap and PDF invoice/receipt generation.

---

## 🚀 Key Features

* **🎨 Premium Light-Theme Interface:** Modern, responsive, and distraction-free user interface styled with custom Vanilla CSS and Tailwind CSS.
* **📅 Multi-Day Production Booking:** Customers can schedule content production across multiple days, assigning dates and custom venues for each day.
* **🏷️ Dual-Catalog System:** 
  * **🏆 Signature Section (Vintage Look):** Retro cinematography featuring Handycam/Camcorder video clips, physical Polaroid sheet photoshoots, and vintage digital camera photography.
  * **⚡ Regular Section (Modern Look):** Premium social media iPhone-focused coverage (Reels, TikTok, Instagram Stories, and takeovers).
* **🧾 Dynamic Invoice & Receipt Engine:** Generates official billing documents locally using custom HTML print layouts:
  * **Approved Booking:** Generates an *Invoice Resmi Belum Bayar*.
  * **DP Paid Booking:** Generates an *Invoice Resmi* with a circular vintage-style **`DP TERBAYAR`** stamp watermark behind text.
  * **Paid Booking:** Generates an official **`LUNAS`** stamped *Kwitansi Resmi Pelunasan*.
* **📊 Administrative Dashboard (`/admin`):** 
  * Manage and transition bookings through their complete lifecycle: `Pending` ➔ `Approved` ➔ `DP Paid` ➔ `Paid` / `Rejected`.
  * Track metrics: Total bookings, pending reviews, active contracts, and estimated revenue totals.
  * Manage package catalogs and add-on services directly (Full CRUD).
  * **Recap Exporting:** Download complete transaction histories as CSV files with UTF-8 BOM encoding for perfect Excel rendering.

---

## 🛠️ Technology Stack

* **Frontend:** React 19 (TypeScript), Lucide Icons, Framer Motion (`motion/react`).
* **Styling:** Tailwind CSS v4 (incorporating modern HSL custom theme tokens).
* **Backend:** Node.js, Express.js (supporting REST API endpoints for bookings and catalog management).
* **Database:** PostgreSQL (integrated pool connections for reliable data storage).
* **Bundler:** Vite, Esbuild, Tsx.

---

## 💻 Running Locally

### 1. Prerequisites
Ensure you have **Node.js** and a local **PostgreSQL** instance installed.

### 2. Database Configuration
1. Create a PostgreSQL database named `krealogs`.
2. Duplicate `.env.example` as `.env` and set your credentials:
   ```env
   PGHOST=localhost
   PGUSER=your_postgres_username
   PGPASSWORD=your_postgres_password
   PGDATABASE=krealogs
   PGPORT=5432
   ```

### 3. Setup and Migration
Install all standard dependencies and seed the package catalog to your PostgreSQL database:
```bash
# Install dependencies
npm install

# Run database schema migration and seed Content Creator catalogs
npx tsx src/db/migrate.ts
```

### 4. Run Development Server
Launch the Express API backend and Vite client bundler together:
```bash
npm run dev
# Server will run live at http://localhost:3000
```

### 5. Build for Production
To bundle the frontend resources and compile the Express backend into a CJS module for deployment:
```bash
npm run build
```

---

## 📂 Project Structure

```text
├── src/
│   ├── components/            # React UI components
│   │   ├── base/              # Base primitive components (Buttons, Inputs, Tooltips)
│   │   ├── application/       # Advanced application components (Date Pickers, Calendars)
│   │   ├── CustomerPage.tsx   # Checkout booking flow with segmented category card grid
│   │   ├── AdminPage.tsx      # Admin dashboard panel & CRUD manager
│   │   └── InvoiceModal.tsx   # Printable PDF Invoice & Kwitansi engine
│   ├── db/
│   │   └── migrate.ts         # PostgreSQL database migrator & CC catalog seed data
│   ├── utils/                 # General utility scripts (Excel Exporter, Date Formatter)
│   ├── types.ts               # Core TypeScript definitions (Booking, Package, Addon)
│   ├── index.css              # Custom Vanilla CSS overrides & Tailwind Theme variables
│   └── main.tsx               # Main entry point
├── server.ts                  # Express.js backend API server
├── vite.config.ts             # Vite configurations and path aliases
├── Dockerfile                 # Multi-stage production container instructions
└── package.json               # Package scripts and dependencies
```

---

## 📄 License
This project is proprietary and custom-coded for **Krealogs.com**. All rights reserved.
