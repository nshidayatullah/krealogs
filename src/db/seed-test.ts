import dotenv from "dotenv";
dotenv.config();

import { pool } from "../db";

const PACKAGES = [
  { id: "pkg-grand-legacy", name: "Grand Legacy (Full Day Coverage)", price: 1850000 },
  { id: "pkg-visual-legacy", name: "Visual Legacy (8 Hours Standby)", price: 1450000 },
  { id: "pkg-golden-memoir", name: "Golden Memoir (8 Hours Standby)", price: 1250000 },
  { id: "pkg-intimate-moments", name: "Intimate Moments (6 Hours Standby)", price: 850000 },
  { id: "pkg-ultimate-vibe", name: "Ultimate Vibe (Full Day Coverage)", price: 950000 },
  { id: "pkg-insta-vibe", name: "Insta Vibe (8 Hours Standby)", price: 650000 },
  { id: "pkg-prologue", name: "Prologue (6 Hours Standby)", price: 400000 },
];

const ADDONS = [
  { id: "add-ig-story", name: "Extra Instagram Story", price: 15000 },
  { id: "add-polaroid", name: "Polaroid Sheets", price: 25000 },
  { id: "add-tiktok", name: "Extra Trend TikTok", price: 15000 },
  { id: "add-digicam", name: "Digicam Photoshoot", price: 150000 },
  { id: "add-camcorder", name: "Camcorder Clips", price: 450000 },
  { id: "add-extra-creator", name: "Extra Content Creator (3 Hours)", price: 200000 },
  { id: "add-extra-hour", name: "Extra Hour", price: 75000 },
];

const CITIES = [
  "Jakarta Pusat", "Jakarta Selatan", "Jakarta Barat", "Jakarta Timur", "Jakarta Utara",
  "Bandung", "Bekasi", "Tangerang", "Depok", "Bogor",
  "Surabaya", "Semarang", "Yogyakarta", "Solo", "Malang",
  "Medan", "Makassar", "Denpasar", "Palembang", "Balikpapan",
];

const NAMES = [
  "Ahmad Fauzi", "Siti Nurhaliza", "Budi Santoso", "Dewi Lestari", "Rizky Pratama",
  "Fitri Handayani", "Andi Saputra", "Maya Anggraini", "Doni Firmansyah", "Rina Melati",
  "Hendra Gunawan", "Intan Permata", "Agus Wijaya", "Ratna Sari", "Bayu Pamungkas",
  "Citra Dewi", "Eko Prasetyo", "Wulan Puspita", "Gilang Ramadhan", "Indah Cahyani",
  "Fajar Nugroho", "Lilis Sulistiawati", "Taufik Hidayat", "Nina Marlin", "Irfan Hakim",
  "Putri Ayu", "Dede Supriyadi", "Mega Sari", "Yusuf Maulana", "Tari Lestari",
  "Reza Alfian", "Nadia Safira", "Hari Setiawan", "Shelly Anggraini", "Dimas Ardiansyah",
];

const VENUES: Record<string, string[]> = {
  "Jakarta Pusat": ["Hotel Indonesia Kempinski", "Fairmont Jakarta", "Pullman Jakarta"],
  "Jakarta Selatan": ["The Ritz-Carlton Pacific Place", "The Grove Suites", "Balai Sidang Jakarta Convention Center"],
  "Jakarta Barat": ["Central Park Jakarta", "Neo Soho"],
  "Jakarta Timur": ["Jakarta International Velodrome"],
  "Jakarta Utara": ["Pantai Indah Kapuk", "Ancol Marina"],
  "Bandung": ["Trans Luxury Hotel", "The Papandayan", "Sabuga Convention Center"],
  "Bekasi": ["Grand Metropolitan Mall", "Bekasi Convention Center"],
  "Tangerang": ["ICE BSD", "AEON Mall BSD"],
  "Depok": ["Margocity Depok"],
  "Bogor": ["Bogor Convention Center", "Royal Safari Garden"],
  "Surabaya": ["Hotel Majapahit", "JW Marriott Surabaya"],
  "Semarang": ["Hotel Ciputra Semarang", "Padma Hotel Semarang"],
  "Yogyakarta": ["Hotel Royal Ambarrukmo", "Tentrem Hotel"],
  "Solo": ["Alila Solo", "The Sunan Hotel"],
  "Malang": ["Hotel Tugu Malang"],
  "Medan": ["Grand Aston Medan"],
  "Makassar": ["Claro Hotel Makassar"],
  "Denpasar": ["Bali International Convention Center"],
  "Palembang": ["Hotel Aryaduta Palembang"],
  "Balikpapan": ["Hotel Benakutai"],
};

const WEDDING_TYPES = ["Lamaran", "Akad", "Resepsi", "Akad & Resepsi Sameday"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString();
}

function randomEventDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * 180) + 1);
  return d.toISOString().split("T")[0];
}

interface BookingSeed {
  customerName: string;
  customerPhone: string;
  customerCity: string;
  eventType: "wedding" | "event";
  weddingType?: string;
  eventDate: string;
  venueLocation: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  addons: string[];
  addonDetails: { id: string; name: string; price: number }[];
  days: {
    date: string;
    packageId: string;
    packageName: string;
    packagePrice: number;
    addons: string[];
    addonDetails: { id: string; name: string; price: number }[];
  }[];
  paymentMethod: "full" | "dp_50" | "dp_custom";
  totalPrice: number;
  amountPaid: number;
  remainingPayment: number;
  approvalStatus: "pending" | "approved" | "rejected";
  paymentStatus: "unpaid" | "dp_paid" | "paid";
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  couponCode?: string;
  discountAmount?: number;
}

function buildSingleDayBooking(overrides?: Partial<BookingSeed>): BookingSeed {
  const city = pick(CITIES);
  const pkg = pick(PACKAGES);
  const numAddons = Math.floor(Math.random() * 4);
  const selectedAddons = pickN(ADDONS, numAddons);
  const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const basePrice = pkg.price + addonTotal;
  const isWedding = Math.random() > 0.3;
  const withCoupon = Math.random() > 0.8;
  const discountPercent = withCoupon ? 10 : 0;
  const discountAmount = withCoupon ? Math.round(basePrice * discountPercent / 100) : 0;
  const totalPrice = basePrice - discountAmount;
  const paymentMethod = pick(["full", "dp_50", "dp_custom"] as const);
  const dpPercent = paymentMethod === "dp_50" ? 50 : paymentMethod === "dp_custom" ? Math.floor(Math.random() * 31) + 50 : 100;
  const amountPaid = paymentMethod === "full" ? totalPrice : Math.round(totalPrice * dpPercent / 100);
  const remaining = totalPrice - amountPaid;

  return {
    customerName: pick(NAMES),
    customerPhone: `+628${Math.floor(10000000 + Math.random() * 89999999)}`,
    customerCity: city,
    eventType: isWedding ? "wedding" : "event",
    weddingType: isWedding ? pick(WEDDING_TYPES) : undefined,
    eventDate: randomEventDate(),
    venueLocation: pick(VENUES[city] || [city]),
    packageId: pkg.id,
    packageName: pkg.name,
    packagePrice: pkg.price,
    addons: selectedAddons.map(a => a.id),
    addonDetails: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
    days: [],
    paymentMethod,
    totalPrice,
    amountPaid,
    remainingPayment: remaining,
    approvalStatus: "pending",
    paymentStatus: "unpaid",
    createdAt: randomDate(60),
    couponCode: withCoupon ? "KREALOVE10" : undefined,
    discountAmount: withCoupon ? discountAmount : undefined,
    ...overrides,
  };
}

function buildMultiDayBooking(numDays: number, overrides?: Partial<BookingSeed>): BookingSeed {
  const base = buildSingleDayBooking();
  const city = base.customerCity;
  const days: BookingSeed["days"] = [];

  for (let i = 0; i < numDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() + 1 + i);
    const pkg = pick(PACKAGES);
    const numAddons = Math.floor(Math.random() * 3);
    const selectedAddons = pickN(ADDONS, numAddons);
    days.push({
      date: d.toISOString().split("T")[0],
      packageId: pkg.id,
      packageName: pkg.name,
      packagePrice: pkg.price,
      addons: selectedAddons.map(a => a.id),
      addonDetails: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
    });
  }

  const isWedding = base.eventType === "wedding";
  const paymentMethod = pick(["full", "dp_50", "dp_custom"] as const);
  const totalPrice = days.reduce((sum, d) => {
    const addonSum = d.addonDetails.reduce((s, a) => s + a.price, 0);
    return sum + d.packagePrice + addonSum;
  }, 0);
  const withCoupon = Math.random() > 0.8;
  const discountPercent = withCoupon ? 10 : 0;
  const discountAmount = withCoupon ? Math.round(totalPrice * discountPercent / 100) : 0;
  const finalPrice = totalPrice - discountAmount;
  const dpPercent = paymentMethod === "dp_50" ? 50 : paymentMethod === "dp_custom" ? Math.floor(Math.random() * 31) + 50 : 100;
  const amountPaid = paymentMethod === "full" ? finalPrice : Math.round(finalPrice * dpPercent / 100);
  const remaining = finalPrice - amountPaid;

  return {
    customerName: base.customerName,
    customerPhone: base.customerPhone,
    customerCity: city,
    eventType: isWedding ? "wedding" : "event",
    weddingType: isWedding ? pick(WEDDING_TYPES) : undefined,
    eventDate: days[0].date,
    venueLocation: pick(VENUES[city] || [city]),
    packageId: days[0].packageId,
    packageName: days[0].packageName,
    packagePrice: days[0].packagePrice,
    addons: days[0].addons,
    addonDetails: days[0].addonDetails,
    days,
    paymentMethod,
    totalPrice: finalPrice,
    amountPaid,
    remainingPayment: remaining,
    approvalStatus: "pending",
    paymentStatus: "unpaid",
    createdAt: randomDate(60),
    couponCode: withCoupon ? "KREALOVE10" : undefined,
    discountAmount: withCoupon ? discountAmount : undefined,
    ...overrides,
  };
}

function assignApproval(s: BookingSeed, approvalStatus: "pending" | "approved" | "rejected"): BookingSeed {
  const now = new Date().toISOString();
  return {
    ...s,
    approvalStatus,
    paymentStatus: approvalStatus === "rejected" ? "unpaid" : s.paymentStatus,
    approvedAt: approvalStatus === "approved" ? now : undefined,
    rejectedAt: approvalStatus === "rejected" ? now : undefined,
  };
}

function assignPayment(s: BookingSeed, paymentStatus: "unpaid" | "dp_paid" | "paid"): BookingSeed {
  const now = new Date().toISOString();
  const amountPaid = paymentStatus === "paid" ? s.totalPrice : paymentStatus === "dp_paid" ? s.amountPaid : 0;
  const remainingPayment = s.totalPrice - amountPaid;
  return {
    ...s,
    paymentStatus,
    approvalStatus: s.approvalStatus === "pending" ? "approved" : s.approvalStatus,
    amountPaid,
    remainingPayment,
    approvedAt: s.approvedAt || now,
  };
}

async function insertBooking(b: BookingSeed) {
  const id = `TEST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const dbStatus = b.approvalStatus === "rejected" ? "rejected" : b.paymentStatus === "paid" ? "paid" : b.paymentStatus === "dp_paid" ? "dp_paid" : b.approvalStatus === "approved" ? "approved" : "pending";
  try {
    await pool.query(
      `INSERT INTO bookings (
        id, customer_name, customer_phone, customer_city, event_type, wedding_type,
        event_date, venue_location, package_id, package_name, package_price,
        addons, addon_details, days, payment_method, total_price, amount_paid,
        remaining_payment, status, approval_status, payment_status, created_at, approved_at, rejected_at,
        coupon_code, discount_amount
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)`,
      [
        id, b.customerName, b.customerPhone, b.customerCity, b.eventType,
        b.weddingType || null, b.eventDate, b.venueLocation,
        b.packageId, b.packageName, b.packagePrice,
        b.addons, JSON.stringify(b.addonDetails), b.days.length > 0 ? JSON.stringify(b.days) : null,
        b.paymentMethod, b.totalPrice, b.amountPaid, b.remainingPayment,
        dbStatus, b.approvalStatus, b.paymentStatus,
        b.createdAt, b.approvedAt || null, b.rejectedAt || null,
        b.couponCode || null, b.discountAmount || 0,
      ]
    );
    return id;
  } catch (err) {
    console.error("Insert failed:", err);
    return null;
  }
}

/*
 * ==============================
 *  FACTORY PRESETS
 * ==============================
 */

/** 15 bookings: mix of pending, approved, dp_paid, paid, rejected */
async function seedStandardMix() {
  const results: string[] = [];
  const scenarios = [
    ...Array(3).fill(null).map(() => buildSingleDayBooking()), // pending
    ...Array(3).fill(null).map(() => assignPayment(assignApproval(buildSingleDayBooking(), "approved"), "unpaid")),
    ...Array(3).fill(null).map(() => assignPayment(assignApproval(buildSingleDayBooking(), "approved"), "dp_paid")),
    ...Array(3).fill(null).map(() => assignPayment(assignApproval(buildSingleDayBooking(), "approved"), "paid")),
    ...Array(3).fill(null).map(() => assignApproval(buildSingleDayBooking(), "rejected")),
  ];
  for (const s of scenarios) {
    const id = await insertBooking(s);
    if (id) results.push(id);
  }
  return results;
}

/** bookings with coupon applied, at various statuses */
async function seedWithCoupon() {
  const results: string[] = [];
  const configs: { approval: "pending" | "approved"; payment: "unpaid" | "dp_paid" | "paid" }[] = [
    { approval: "pending", payment: "unpaid" },
    { approval: "approved", payment: "unpaid" },
    { approval: "approved", payment: "dp_paid" },
    { approval: "approved", payment: "paid" },
  ];
  for (const cfg of configs) {
    let s = buildSingleDayBooking();
    s.couponCode = "KREALOVE10";
    s.discountAmount = Math.round(s.totalPrice * 0.1);
    s.totalPrice = s.totalPrice - s.discountAmount;
    s.amountPaid = cfg.payment === "paid" ? s.totalPrice : cfg.payment === "dp_paid" ? Math.round(s.totalPrice * 0.5) : 0;
    s.remainingPayment = s.totalPrice - s.amountPaid;
    s = assignPayment(assignApproval(s, cfg.approval === "approved" ? "approved" : "pending"), cfg.payment);
    const id = await insertBooking(s);
    if (id) results.push(id);
  }
  return results;
}

/** multi-day bookings (2-3 days) */
async function seedMultiDay() {
  const results: string[] = [];
  const configs: { approval: "pending" | "approved"; payment: "unpaid" | "dp_paid" | "paid" }[] = [
    { approval: "pending", payment: "unpaid" },
    { approval: "approved", payment: "unpaid" },
    { approval: "approved", payment: "dp_paid" },
    { approval: "approved", payment: "paid" },
  ];
  for (const cfg of configs) {
    const numDays = 2 + Math.floor(Math.random() * 2);
    let s = buildMultiDayBooking(numDays);
    s.amountPaid = cfg.payment === "paid" ? s.totalPrice : cfg.payment === "dp_paid" ? Math.round(s.totalPrice * 0.5) : 0;
    s.remainingPayment = s.totalPrice - s.amountPaid;
    s = assignPayment(assignApproval(s, cfg.approval), cfg.payment);
    const id = await insertBooking(s);
    if (id) results.push(id);
  }
  return results;
}

/** bookings with various payment methods */
async function seedPaymentVariants() {
  const results: string[] = [];
  const configs: { method: "full" | "dp_50" | "dp_custom"; payment: "paid" | "dp_paid" | "unpaid" }[] = [
    { method: "full", payment: "paid" },
    { method: "dp_50", payment: "dp_paid" },
    { method: "dp_50", payment: "paid" },
    { method: "dp_custom", payment: "dp_paid" },
    { method: "dp_custom", payment: "paid" },
    { method: "full", payment: "unpaid" },
  ];
  for (const cfg of configs) {
    const s = buildSingleDayBooking({ paymentMethod: cfg.method });
    s.amountPaid = cfg.method === "full" ? s.totalPrice : cfg.payment === "paid" ? s.totalPrice : cfg.payment === "dp_paid" ? Math.round(s.totalPrice * 0.5) : 0;
    s.remainingPayment = s.totalPrice - s.amountPaid;
    const r = assignPayment(assignApproval(s, "approved"), cfg.payment);
    const id = await insertBooking(r);
    if (id) results.push(id);
  }
  return results;
}

/** edge cases: extreme values */
async function seedEdgeCases() {
  const scenarios: BookingSeed[] = [
    // Free booking (Rp 0 — possible if coupon covers all)
    assignPayment(assignApproval(buildSingleDayBooking({
      totalPrice: 0,
      amountPaid: 0,
      remainingPayment: 0,
      paymentMethod: "full",
    }), "approved"), "paid"),

    // Very expensive (max package + all addons)
    assignApproval(buildSingleDayBooking({
      packageId: "pkg-grand-legacy",
      packageName: "Grand Legacy (Full Day Coverage)",
      packagePrice: 1850000,
      addons: ADDONS.map(a => a.id),
      addonDetails: ADDONS.map(a => ({ id: a.id, name: a.name, price: a.price })),
      totalPrice: 1850000 + ADDONS.reduce((s, a) => s + a.price, 0),
    }), "pending"),

    // Event type (not wedding)
    assignApproval(buildSingleDayBooking({ eventType: "event", weddingType: undefined }), "pending"),

    // Just now created (same timestamp)
    assignApproval(buildSingleDayBooking({ createdAt: new Date().toISOString() }), "pending"),

    // Old booking (90 days ago)
    assignApproval(buildSingleDayBooking({ createdAt: new Date(Date.now() - 90 * 86400000).toISOString() }), "rejected"),
  ];

  // Fix amounts for the expensive one
  const expensiveAddonSum = ADDONS.reduce((s, a) => s + a.price, 0);
  scenarios[1].totalPrice = 1850000 + expensiveAddonSum;
  scenarios[1].amountPaid = Math.round(scenarios[1].totalPrice * 0.5);
  scenarios[1].remainingPayment = scenarios[1].totalPrice - scenarios[1].amountPaid;
  scenarios[1].paymentMethod = "dp_50";

  const results: string[] = [];
  for (const s of scenarios) {
    const id = await insertBooking(s);
    if (id) results.push(id);
  }
  return results;
}

/** Bulk insert a large number of pending bookings to test pagination */
async function seedBulkPending(count: number = 50) {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    const id = await insertBooking(buildSingleDayBooking());
    if (id) results.push(id);
  }
  return results;
}

async function main() {
  const mode = process.argv[2] || "all";

  const runners: Record<string, () => Promise<string[]>> = {
    "standard": seedStandardMix,
    "coupon": seedWithCoupon,
    "multi-day": seedMultiDay,
    "payment": seedPaymentVariants,
    "edge": seedEdgeCases,
    "bulk": () => seedBulkPending(50),
  };

  if (mode === "all") {
    console.log("Seeding all test scenarios...\n");
    let total = 0;
    for (const [name, fn] of Object.entries(runners)) {
      const ids = await fn();
      console.log(`  ${name}: ${ids.length} bookings seeded`);
      total += ids.length;
    }
    console.log(`\nTotal: ${total} test bookings inserted.`);
  } else if (mode in runners) {
    const ids = await runners[mode]();
    console.log(`Seeded ${ids.length} bookings (${mode})`);
  } else if (mode === "help") {
    console.log(`
Usage: npx tsx src/db/seed-test.ts [mode]

Modes:
  all        Seed all scenarios (default)
  standard   15 bookings: mix of pending/approved/dp_paid/paid/rejected
  coupon     Bookings with KREALOVE10 coupon applied
  multi-day  Bookings with 2-3 event days
  payment    Various payment methods (full, dp_50, dp_custom)
  edge       Edge cases (free, expensive, old, event-only)
  bulk       50 pending bookings (for pagination testing)
  help       Show this help
`);
  } else {
    console.error(`Unknown mode: ${mode}. Use "help" for available modes.`);
    process.exit(1);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
