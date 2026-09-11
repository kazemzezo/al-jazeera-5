import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGuestPrompt } from "../context/GuestPromptContext";
import { canReserve as canReserveRole } from "../lib/roles";
import { TON_CATEGORIES, LOCATIONS, SITE_MAINTENANCE_FEE } from "../lib/catalog";
import { EQUIPMENT, TOTAL_WORKERS } from "../lib/equipment";
import { DEMO_TON_PRICES } from "../lib/demoData";
import { subscribeTonPrices, subscribeEquipmentPrices } from "../lib/listings";

// سعر تحميل الطن الواحد (للعامل أو أكثر) — عدّله من هنا لو حبيت
const LOADING_PRICE_PER_TON = 30;

function fmt(n) {
  return Number(n || 0).toLocaleString("ar-EG") + "ج";
}

export default function Calculator() {
  const { user, profile, role } = useAuth();
  const { promptLogin, promptVerification } = useGuestPrompt();

  const [location, setLocation] = useState(LOCATIONS.DOCK);
  const [rows, setRows] = useState([{ category: TON_CATEGORIES[0], tons: 1 }]);
  const [equipmentHours, setEquipmentHours] = useState({});
  const [workerCount, setWorkerCount] = useState(0);
  const [loadingTons, setLoadingTons] = useState(1);
  const [carCount, setCarCount] = useState(1);
  const [confirmedInvoice, setConfirmedInvoice] = useState(null);

  const [liveTonPrices, setLiveTonPrices] = useState({});
  const [liveEquipmentPrices, setLiveEquipmentPrices] = useState({});

  useEffect(() => {
    const unsub = subscribeTonPrices(setLiveTonPrices);
    return () => unsub();
  }, []);
  useEffect(() => {
    const unsub = subscribeEquipmentPrices(setLiveEquipmentPrices);
    return () => unsub();
  }, []);

  const tonPrices = Object.keys(liveTonPrices).length > 0 ? liveTonPrices : DEMO_TON_PRICES;
  const equipmentList = EQUIPMENT.map((eq) => ({
    ...eq,
    pricePerHour: liveEquipmentPrices[eq.id]?.pricePerHour ?? eq.pricePerHour,
  }));

  function addRow() {
    setRows([...rows, { category: TON_CATEGORIES[0], tons: 1 }]);
  }
  function removeRow(idx) {
    setRows(rows.filter((_, i) => i !== idx));
  }
  function updateRow(idx, field, value) {
    setRows(rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  const scrapRows = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        price: tonPrices[r.category]?.pricePerTon || 0,
        total: (tonPrices[r.category]?.pricePerTon || 0) * Number(r.tons || 0),
      })),
    [rows, tonPrices]
  );
  const scrapTotal = scrapRows.reduce((s, r) => s + r.total, 0);

  const equipmentRows = useMemo(
    () =>
      equipmentList
        .map((eq) => ({
          ...eq,
          hours: Number(equipmentHours[eq.id] || 0),
          total: Number(equipmentHours[eq.id] || 0) * eq.pricePerHour,
        }))
        .filter((eq) => eq.hours > 0),
    [equipmentHours, liveEquipmentPrices]
  );
  const equipmentTotal = equipmentRows.reduce((s, r) => s + r.total, 0);

  // سعر التحميل: عدد الأطنان × 30ج (لا يعتمد على عدد العمال)
  const loadingTotal = Number(loadingTons || 0) * LOADING_PRICE_PER_TON;

  const maintenanceFee = SITE_MAINTENANCE_FEE[location];
  const maintenanceTotal = Number(carCount || 0) * maintenanceFee;

  const grandTotal = scrapTotal + equipmentTotal + loadingTotal + maintenanceTotal;
  const canConfirm = canReserveRole(role);

  function handleConfirm() {
    if (!user) {
      promptLogin("لازم تسجل دخولك الأول عشان تقدر تأكد الحجز");
      return;
    }
    if (!canConfirm) {
      promptVerification("لإتمام الحجز، لازم توثق حسابك أولاً.");
      return;
    }
    setConfirmedInvoice({
      invoiceId: "AJ5-" + Date.now().toString().slice(-8),
      date: new Date().toLocaleDateString("ar-EG"),
      traderName: profile?.name || user.email,
      location,
      scrapRows: scrapRows.filter((r) => r.tons > 0),
      equipmentRows,
      workerCount,
      loadingTons: Number(loadingTons || 0),
      loadingPricePerTon: LOADING_PRICE_PER_TON,
      loadingTotal,
      carCount,
      maintenanceFee,
      maintenanceTotal,
      scrapTotal,
      equipmentTotal,
      grandTotal,
    });
  }

  if (confirmedInvoice) {
    return <InvoiceView invoice={confirmedInvoice} onBack={() => setConfirmedInvoice(null)} />;
  }

  return (
    <div className="calc-page">
      <h1 className="calc-title">أداة الحساب</h1>
      <p className="calc-subtitle">الأسعار تُحدّث تلقائيًا حسب ما يضعه الأدمن.</p>

      <div className="calc-location-tabs">
        {[LOCATIONS.DOCK, LOCATIONS.YARD].map((loc) => (
          <button
            key={loc}
            className={"location-tab" + (location === loc ? " active" : "")}
            onClick={() => setLocation(loc)}
          >
            {loc === LOCATIONS.DOCK ? "الرصيف البحري" : "ساحة الجزيره"}
          </button>
        ))}
      </div>

      <Section title="ميزان بيسكول">
        {rows.map((r, idx) => {
          const price = tonPrices[r.category]?.pricePerTon || 0;
          return (
            <div key={idx} className="calc-row calc-row--scrap">
              <select
                className="calc-input"
                value={r.category}
                onChange={(e) => updateRow(idx, "category", e.target.value)}
              >
                {TON_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                className="calc-input"
                type="number"
                min="0"
                value={r.tons}
                onChange={(e) => updateRow(idx, "tons", e.target.value)}
              />
              <span className="unit">طن</span>
              <span className="rp">{fmt(price * Number(r.tons || 0))}</span>
              <span className="actions">
                {rows.length > 1 && (
                  <button
                    className="btn-remove"
                    onClick={() => removeRow(idx)}
                    title="حذف الصنف"
                    aria-label="حذف"
                  >
                    ✕
                  </button>
                )}
              </span>
            </div>
          );
        })}
        <button className="btn" style={{ marginTop: 12, fontSize: 13 }} onClick={addRow}>
          + إضافة صنف
        </button>
      </Section>

      <Section title="المعدات والعمال">
        {equipmentList.map((eq) => (
          <div key={eq.id} className="calc-row">
            <span className="label">{eq.name}</span>
            <input
              className="calc-input"
              type="number"
              min="0"
              value={equipmentHours[eq.id] || ""}
              onChange={(e) => setEquipmentHours({ ...equipmentHours, [eq.id]: e.target.value })}
              placeholder="0"
            />
            <span className="unit">ساعة</span>
            <span className="rp">{fmt(Number(equipmentHours[eq.id] || 0) * eq.pricePerHour)}</span>
          </div>
        ))}

        <div className="calc-row">
          <span className="label">عمال (من أصل {TOTAL_WORKERS})</span>
          <input
            className="calc-input"
            type="number"
            min="0"
            max={TOTAL_WORKERS}
            value={workerCount || ""}
            onChange={(e) => setWorkerCount(e.target.value)}
            placeholder="0"
          />
          <span className="unit">عامل</span>
          <span className="rp" />
        </div>

        <div className="calc-row">
          <span className="label">التحميل بالطن</span>
          <input
            className="calc-input"
            type="number"
            min="0"
            value={loadingTons || ""}
            onChange={(e) => setLoadingTons(e.target.value)}
            placeholder="0"
          />
          <span className="unit">طن</span>
          <span className="rp">{fmt(loadingTotal)}</span>
        </div>

        <div className="calc-row">
          <span className="label">عدد السيارات (صيانة الرصيف)</span>
          <input
            className="calc-input"
            type="number"
            min="0"
            value={carCount}
            onChange={(e) => setCarCount(e.target.value)}
          />
          <span className="unit">سيارة</span>
          <span className="rp">{fmt(maintenanceTotal)}</span>
        </div>

        <p className="calc-note">
          سعر تحميل الطن: {fmt(LOADING_PRICE_PER_TON)} · سعر صيانة السيارة: {fmt(maintenanceFee)}
        </p>
      </Section>

      <Section title="الفاتورة الإجمالية">
        <Line label="أصناف الخردة" value={scrapTotal} />
        <Line label="إيجار المعدات" value={equipmentTotal} />
        <Line label="أجور التحميل" value={loadingTotal} />
        <Line label="صيانة الرصيف" value={maintenanceTotal} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <span style={{ fontSize: 15, color: "var(--steel)" }}>الإجمالي</span>
          <span style={{ fontSize: 22, fontWeight: 900 }}>{fmt(grandTotal)}</span>
        </div>

        {user && !canConfirm && (
          <p style={{ fontSize: 12.5, color: "var(--danger)", marginTop: 10, lineHeight: 1.7 }}>
            حسابك غير موثق حاليًا، لذلك لا يمكنك تأكيد الحجز. أرسل طلب توثيق وستتمكن من التأكيد بعد الموافقة.
          </p>
        )}

        {user && !canConfirm ? (
          <button
            className="btn"
            style={{ width: "100%", marginTop: 14, borderColor: "var(--kabbash)", color: "var(--kabbash)" }}
            onClick={() => promptVerification("لإتمام الحجز، لازم توثق حسابك أولاً.")}
          >
            أرسل طلب توثيق
          </button>
        ) : (
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 14 }}
            onClick={handleConfirm}
          >
            {user ? "تأكيد الحجز وعرض الفاتورة" : "سجّل دخولك لتأكيد الحجز"}
          </button>
        )}
      </Section>

      <style>{`
        .calc-title { font-size: 22px; font-weight: 900; margin: 0 0 4px; }
        .calc-subtitle { font-size: 13px; color: var(--steel); margin: 0 0 20px; }

        .calc-location-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
        .location-tab {
          flex: 1;
          padding: 10px 14px;
          border-radius: var(--radius);
          border: 1.5px solid var(--line-strong);
          background: var(--paper-raised);
          color: var(--ink);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: background .2s, color .2s, border-color .2s;
        }
        .location-tab:hover { border-color: var(--ink); }
        .location-tab.active {
          background: var(--kabbash);
          border-color: var(--kabbash);
          color: #fff;
        }

        .calc-row {
          display: grid;
          grid-template-columns: minmax(110px, 1fr) 90px 60px 110px;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--line);
          font-size: 13px;
        }
        .calc-row--scrap {
          grid-template-columns: minmax(110px, 1fr) 90px 60px 110px 32px;
        }
        .calc-row:last-child { border-bottom: none; }
        .calc-row .label { color: var(--ink); font-weight: 600; }
        .calc-row .unit { color: var(--steel-light); font-size: 12px; white-space: nowrap; text-align: center; }
        .calc-row .rp { text-align: end; font-weight: 700; color: var(--ink); }

        .calc-input {
          width: 100%;
          min-width: 0;
          padding: 8px 10px;
          border: 1.5px solid var(--line-strong);
          border-radius: 8px;
          background: var(--paper-raised);
          color: var(--ink);
          font-family: inherit;
          font-size: 13px;
          text-align: center;
          transition: border-color .2s, box-shadow .2s;
        }
        .calc-input:focus {
          outline: none;
          border-color: var(--kabbash);
          box-shadow: 0 0 0 3px var(--kabbash-light);
        }
        select.calc-input { text-align: start; padding-inline: 10px; }

        .btn-remove {
          width: 28px; height: 28px;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 8px;
          border: 1.5px solid var(--line-strong);
          background: transparent;
          color: var(--danger);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background .2s, border-color .2s;
        }
        .btn-remove:hover {
          background: var(--danger-light);
          border-color: var(--danger);
        }

        .calc-note {
          font-size: 12px;
          color: var(--steel);
          margin: 12px 0 0;
          padding-top: 10px;
          border-top: 1px dashed var(--line);
        }

        @media (max-width: 480px) {
          .calc-row {
            grid-template-columns: minmax(90px, 1fr) 64px 48px 80px;
            gap: 8px;
            font-size: 12px;
          }
          .calc-row--scrap {
            grid-template-columns: minmax(90px, 1fr) 64px 48px 80px 28px;
          }
          .calc-row .unit { font-size: 11px; }
          .calc-input { padding: 6px 8px; font-size: 12px; }
        }
      `}</style>
    </div>
  );
}

function InvoiceView({ invoice, onBack }) {
  return (
    <div>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <button className="btn" onClick={onBack}>عودة للأداة</button>
        <button className="btn btn-primary" onClick={() => window.print()}>طباعة / حفظ PDF</button>
      </div>

      <div id="invoice-print" style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 20, borderBottom: "2px solid var(--ink)", paddingBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>فاتورة الجزيره خمسه</h1>
          <p style={{ fontSize: 12, color: "var(--steel)", margin: 0 }}>
            رقم الفاتورة: {invoice.invoiceId} · التاريخ: {invoice.date}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, fontSize: 13 }}>
          <span><b>اسم التاجر:</b> {invoice.traderName}</span>
          <span><b>الموقع:</b> {invoice.location === LOCATIONS.DOCK ? "الرصيف البحري" : "ساحة الجزيره"}</span>
        </div>

        {invoice.scrapRows.length > 0 && (
          <InvoiceGroup title="أسعار الأصناف">
            {invoice.scrapRows.map((r, i) => (
              <InvoiceLine key={i} label={`${r.category} - ${r.tons} طن`} value={r.total} />
            ))}
          </InvoiceGroup>
        )}

        {(invoice.equipmentRows.length > 0 || invoice.loadingTotal > 0) && (
          <InvoiceGroup title="الرسوم الإيجارية للمعدات والعمالة">
            {invoice.equipmentRows.map((r, i) => (
              <InvoiceLine key={i} label={`${r.name} - ${r.hours} ساعة`} value={r.total} />
            ))}
            {invoice.loadingTotal > 0 && (
              <InvoiceLine
                label={`تحميل ${invoice.loadingTons} طن × ${fmt(invoice.loadingPricePerTon)}${invoice.workerCount > 0 ? ` (${invoice.workerCount} عامل)` : ""}`}
                value={invoice.loadingTotal}
              />
            )}
          </InvoiceGroup>
        )}

        <InvoiceGroup title="رسوم الرصيف">
          <InvoiceLine label={`صيانة الرصيف (${invoice.carCount} سيارة × ${fmt(invoice.maintenanceFee)})`} value={invoice.maintenanceTotal} />
        </InvoiceGroup>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: "2px solid var(--ink)" }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>الإجمالي الكلي</span>
          <span style={{ fontSize: 24, fontWeight: 900 }}>{fmt(invoice.grandTotal)}</span>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, header, nav { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; }
          #invoice-print { border: none !important; }
        }
      `}</style>
    </div>
  );
}

function InvoiceGroup({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--steel)", borderBottom: "1px solid var(--line)", paddingBottom: 6, marginBottom: 8 }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function InvoiceLine({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>{fmt(value)}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16, marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--steel)", margin: "0 0 10px" }}>{title}</p>
      {children}
    </div>
  );
}

function Line({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
      <span style={{ color: "var(--steel)" }}>{label}</span>
      <span>{fmt(value)}</span>
    </div>
  );
}
