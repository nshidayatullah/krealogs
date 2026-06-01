// invoices.jsx — Krealogs invoice, two design variations (A: editorial, B: corporate)
// Exports window.InvoiceA, window.InvoiceB

const INV = {
  tagline: "Wedding & Event Content Creator",
  invoiceNo: "056/INV/CC/I/2026",
  date: "Rabu, 21 Januari 2026",
  billTo: {
    name: "Delphinium",
    lines: ["(+62) 852-4886-9686", "Banjarmasin"]
  },
  from: {
    name: "Krealogs",
    lines: ["Banjarmasin, Indonesia", "(+62) 812-4198-7783", "kreatiflogs@gmail.com"]
  },
  items: [
  {
    name: "Paket: Visual Legacy",
    meta: ["Acara — Event", "Tanggal — 07 Desember 2025", "Tempat — Shavasana Banjarbaru"],
    qty: 1,
    price: 1450000
  },
  {
    name: "Add ons: 10 Trend TikTok",
    meta: [],
    qty: 1,
    price: 150000
  }],

  voucher: { code: "EARLYBIRD", label: "Early Bird Promo", pct: 10 },
  dp: 50,
  payment: { bank: "Bank BCA", rek: "0512688096", name: "Brilliant Rizky Fortuna" },
  signer: { name: "Dymas Herrnawan, S.I.Kom", role: "Tim Krealogs" }
};

const rp = (n) => "Rp" + n.toLocaleString("id-ID");
const subtotal = INV.items.reduce((s, it) => s + it.qty * it.price, 0);
const discount = Math.round(subtotal * INV.voucher.pct / 100);
const total = subtotal - discount;
const dpAmount = Math.round(total * INV.dp / 100);
const remaining = total - dpAmount;

/* ============================== VARIATION A ============================== */
function InvoiceA() {
  return (
    <div className="invA">
      <div className="invA-top">
        <div>
          <img className="invA-logo" src="assets/krealogs-logo.png" alt="Krealogs" />
          <div className="invA-tagline">{INV.tagline}</div>
        </div>
        <div className="invA-meta">
          <div className="invA-word">Invoice</div>
          <div className="invA-meta-rows">
            <div className="invA-meta-row">
              <span className="invA-meta-k">No.</span>
              <span className="invA-meta-v num">{INV.invoiceNo}</span>
            </div>
            <div className="invA-meta-row">
              <span className="invA-meta-k">Tanggal</span>
              <span className="invA-meta-v">{INV.date}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="invA-rule"></div>

      <div className="invA-parties">
        <div>
          <div className="invA-plabel">Ditagihkan Kepada</div>
          <div className="invA-pname">{INV.billTo.name}</div>
          {INV.billTo.lines.map((l, i) =>
          <div className="invA-pline" key={i}>{l}</div>
          )}
        </div>
        <div>
          <div className="invA-plabel">Dari</div>
          <div className="invA-pname">{INV.from.name}</div>
          {INV.from.lines.map((l, i) =>
          <div className="invA-pline" key={i}>{l}</div>
          )}
        </div>
      </div>

      <div>
        <div className="invA-thead">
          <div className="invA-th">Deskripsi</div>
          <div className="invA-th c">Qty</div>
          <div className="invA-th r">Harga</div>
          <div className="invA-th r">Jumlah</div>
        </div>
        {INV.items.map((it, i) =>
        <div className="invA-row" key={i}>
            <div>
              <div className="invA-iname">{it.name}</div>
              {it.meta.length > 0 &&
            <div className="invA-imeta">
                  {it.meta.map((m, j) =>
              <div key={j}>{m}</div>
              )}
                </div>
            }
            </div>
            <div className="invA-cell c num">{it.qty}</div>
            <div className="invA-cell r num">{rp(it.price)}</div>
            <div className="invA-cell r b num">{rp(it.qty * it.price)}</div>
          </div>
        )}
      </div>

      <div className="invA-foot">
        <div className="invA-totals">
          <div className="invA-voucher">
            <div className="invA-voucher-label">Voucher Diterapkan</div>
            <div className="invA-voucher-ticket">
              <span className="invA-voucher-code">{INV.voucher.code}</span>
            </div>
            <div className="invA-voucher-desc">{INV.voucher.label}</div>
          </div>
          <div className="invA-totals-inner">
            <div className="invA-trow">
              <span>Subtotal</span>
              <span className="v num">{rp(subtotal)}</span>
            </div>
            <div className="invA-trow">
              <span>Diskon ({INV.voucher.pct}%)</span>
              <span className="v disc num">&minus;{rp(discount)}</span>
            </div>
            <div className="invA-ttotal">
              <span className="k">Total</span>
              <span className="v num">{rp(total)}</span>
            </div>
            <div className="invA-dp">
              <div className="invA-dp-due">
                <span className="invA-dp-lbl">DP Harus Dibayar ({INV.dp}%)</span>
                <span className="invA-dp-amt num">{rp(dpAmount)}</span>
              </div>
              <div className="invA-dp-rest">
                <span>Sisa Pelunasan</span>
                <span className="num">{rp(remaining)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="invA-bottom">
          <div>
            <div className="invA-pay-label">Metode Pembayaran</div>
            <div className="invA-pay-grid">
              <span className="invA-pay-k">Bank</span>
              <span className="invA-pay-v">{INV.payment.bank}</span>
              <span className="invA-pay-k">No. Rekening</span>
              <span className="invA-pay-v num">{INV.payment.rek}</span>
              <span className="invA-pay-k">Atas Nama</span>
              <span className="invA-pay-v">{INV.payment.name}</span>
            </div>
          </div>
          <div className="invA-sign">
            <div className="invA-sign-name">{INV.signer.name}</div>
            <div className="invA-sign-rule"></div>
            <div className="invA-sign-role">{INV.signer.role}</div>
          </div>
        </div>
      </div>

      <div className="invA-thanks">Terima Kasih</div>
    </div>);

}

/* ============================== VARIATION B ============================== */
function InvoiceB() {
  return (
    <div className="invB">
      <div className="invB-band" style={{ height: "216px", padding: "36px 60px 20px" }}>
        <div className="invB-band-top">
          <div>
            <img className="invB-logo" src="assets/krealogs-logo-white.png" alt="Krealogs" />
            <div className="invB-tag">{INV.tagline}</div>
          </div>
          <div className="invB-word" style={{ fontSize: "32px" }}>INVOICE</div>
        </div>
        <div className="invB-band-meta">
          <div className="invB-bm">
            <div className="invB-bm-k">Invoice No.</div>
            <div className="invB-bm-v num">{INV.invoiceNo}</div>
          </div>
          <div className="invB-bm">
            <div className="invB-bm-k">Tanggal</div>
            <div className="invB-bm-v">{INV.date}</div>
          </div>
        </div>
      </div>

      <div className="invB-body">
        <div className="invB-parties">
          <div className="invB-card dark" style={{ borderRadius: "10px" }}>
            <div className="invB-plabel" style={{ fontSize: "10px" }}>Ditagihkan Kepada</div>
            <div className="invB-pname">{INV.billTo.name}</div>
            {INV.billTo.lines.map((l, i) =>
            <div className="invB-pline" key={i}>{l}</div>
            )}
          </div>
          <div className="invB-card" style={{ borderRadius: "10px" }}>
            <div className="invB-plabel" style={{ fontSize: "10px" }}>Dari</div>
            <div className="invB-pname">{INV.from.name}</div>
            {INV.from.lines.map((l, i) =>
            <div className="invB-pline" key={i}>{l}</div>
            )}
          </div>
        </div>

        <div>
          <div className="invB-thead">
            <div className="invB-th" style={{ fontSize: "10px" }}>Deskripsi</div>
            <div className="invB-th c" style={{ fontSize: "10px" }}>Qty</div>
            <div className="invB-th r" style={{ fontSize: "10px" }}>Harga</div>
            <div className="invB-th r" style={{ fontSize: "10px" }}>Jumlah</div>
          </div>
          {INV.items.map((it, i) =>
          <div className="invB-row" key={i}>
              <div>
                <div className="invB-iname">{it.name}</div>
                {it.meta.length > 0 &&
              <div className="invB-imeta">
                    {it.meta.map((m, j) =>
                <div key={j}>{m}</div>
                )}
                  </div>
              }
              </div>
              <div className="invB-cell c num">{it.qty}</div>
              <div className="invB-cell r num">{rp(it.price)}</div>
              <div className="invB-cell r b num">{rp(it.qty * it.price)}</div>
            </div>
          )}
        </div>

        <div className="invB-totals">
          <div className="invB-voucher">
            <div className="invB-voucher-stub">
              <span className="invB-voucher-pct">{INV.voucher.pct}%</span>
              <span className="invB-voucher-off">OFF</span>
            </div>
            <div className="invB-voucher-body">
              <span className="invB-voucher-tag">Kode Voucher</span>
              <span className="invB-voucher-code">{INV.voucher.code}</span>
              <span className="invB-voucher-note">{INV.voucher.label}</span>
            </div>
          </div>
          <div className="invB-totals-inner">
            <div className="invB-trow">
              <span>Subtotal</span>
              <span className="v num">{rp(subtotal)}</span>
            </div>
            <div className="invB-trow">
              <span>Diskon &middot; {INV.voucher.code} ({INV.voucher.pct}%)</span>
              <span className="v disc num">&minus;{rp(discount)}</span>
            </div>
            <div className="invB-tbox" style={{ padding: "3px 20px", margin: "8px 0px 0px" }}>
              <span className="k">Total</span>
              <span className="v num" style={{ textAlign: "right", fontSize: "16px" }}>{rp(total)}</span>
            </div>
            <div className="invB-dp">
              <div className="invB-dp-due">
                <span className="invB-dp-lbl">DP Harus Dibayar ({INV.dp}%)</span>
                <span className="invB-dp-amt num">{rp(dpAmount)}</span>
              </div>
              <div className="invB-dp-rest">
                <span>Sisa Pelunasan</span>
                <span className="num">{rp(remaining)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="invB-foot">
          <div className="invB-pay">
            <div className="invB-pay-label">Metode Pembayaran</div>
            <div className="invB-pay-grid">
              <span className="invB-pay-k">Bank</span>
              <span className="invB-pay-v plain">{INV.payment.bank}</span>
              <span className="invB-pay-k">No. Rekening</span>
              <span className="invB-pay-v">{INV.payment.rek}</span>
              <span className="invB-pay-k">Atas Nama</span>
              <span className="invB-pay-v plain">{INV.payment.name}</span>
            </div>
          </div>
          <div className="invB-sign">
            <div className="invB-sign-name" style={{ fontFamily: "\"Hanken Grotesk\"", fontSize: "15px", fontWeight: 400, fontStyle: "normal" }}>{INV.signer.name}</div>
            <div className="invB-sign-rule"></div>
            <div className="invB-sign-role">{INV.signer.role}</div>
          </div>
        </div>
      </div>
    </div>);

}

Object.assign(window, { InvoiceA, InvoiceB });