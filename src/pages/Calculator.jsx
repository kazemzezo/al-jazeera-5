import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGuestPrompt } from "../context/GuestPromptContext";
import { canReserve as canReserveRole } from "../lib/roles";
import { TON_CATEGORIES, LOCATIONS, SITE_MAINTENANCE_FEE } from "../lib/catalog";
import { EQUIPMENT, WORKER_PRICE_PER_CAR, TOTAL_WORKERS } from "../lib/equipment";
import { DEMO_TON_PRICES } from "../lib/demoData";
import { subscribeTonPrices, subscribeEquipmentPrices } from "../lib/listings";

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
  const [workerHours, setWorkerHours] = useState(1);
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

  const workersTotal = Number(workerCount || 0) * Number(workerHours || 0) * WORKER_PRICE_PER_CAR;

  const maintenanceFee = SITE_MAINTENANCE_FEE[location];
  const maintenanceTotal = Number(carCount || 0) * maintenanceFee;

  const grandTotal = scrapTotal + equipmentTotal + workersTotal + maintenanceTotal;
  const canConfirm = canReserveRole(role);

  function handleConfirm() {
    if (!user) {
      promptLogin("لازم تسجل دخولك الأول عشان تقدر تأكد الحجز");
      return;
    }
    if (!canConfirm) {
      promptVerification("لا يمكنك الحجز بدون توثيق حسابك كتاجر أولاً. تواصل مع إدارة الموقع للتوثيق.");
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
      workerHours,
      workersTotal,
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
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>أداة الحساب</h1>
      <p style={{ fontSize: 13, color: "var(--steel)", marginBottom: 20 }}>
        الأسعار تُحدّث تلقائيًا حسب ما يضعه الأدمن.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[LOCATIONS.DOCK, LOCATIONS.YARD].map((loc) => (
          <button
            key={loc}
            className="btn"
            style={{
              background: location === loc ? "var(--kabbash)" : "transparent",
              color: location === loc ? "#fff" : "var(--ink)",
              borderColor: location === loc ? "var(--kabbash)" : "var(--ink)",
            }}
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
            <div key={idx} className="calc-row">
              <select value={r.category} onChange={(e) => updateRow(idx, "category", e.target.value)}>
                {TON_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input type="number" min="0" value={r.tons} onChange={(e) => updateRow(idx, "tons", e.target.value)} style={{ width: 70 }} />
              <span className="unit">طن</span>
              <span className="rp">{fmt(price * Number(r.tons || 0))}</span>
              {rows.length > 1 && (
                <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => removeRow(idx)}>حذف</button>
              )}
            </div>
          );
        })}
        <button className="btn" style={{ marginTop: 10, fontSize: 13 }} onClick={addRow}>+ إضافة صنف</button>
      </Section>

      <Section title="المعدات والعمال">
        {equipmentList.map((eq) => (
          <div key={eq.id} className="calc-row">
            <span style={{ flex: 1 }}>{eq.name}</span>
            <input
              type="number"
              min="0"
              value={equipmentHours[eq.id] || ""}
              onChange={(e) => setEquipmentHours({ ...equipmentHours, [eq.id]: e.target.value })}
              placeholder="0"
              style={{ width: 70 }}
            />
            <span className="unit">ساعة</span>
            <span className="rp">{fmt(Number(equipmentHours[eq.id] || 0) * eq.pricePerHour)}</span>
          </div>
        ))}

        <div className="calc-row">
          <span style={{ flex: 1 }}>عمال (من أصل {TOTAL_WORKERS})</span>
          <input type="number" min="0" max={TOTAL_WORKERS} value={workerCount || ""} onChange={(e) => setWorkerCount(e.target.value)} placeholder="0" style={{ width: 70 }} />
          <span className="unit">عامل</span>
        </div>
        <div className="calc-row">
          <span style={{ flex: 1 }}>عدد ساعات العمال</span>
          <input type="number" min="0" value={workerHours} onChange={(e) => setWorkerHours(e.target.value)} style={{ width: 70 }} />
          <span className="unit">ساعة</span>
          <span className="rp">{fmt(workersTotal)}</span>
        </div>

        <div className="calc-row" style={{ marginTop: 8 }}>
          <span style={{ flex: 1 }}>عدد السيارات (صيانة الرصيف)</span>
          <input type="number" min="0" value={carCount} onChange={(e) => setCarCount(e.target.value)} style={{ width: 70 }} />
          <span className="unit">سيارة × {fmt(maintenanceFee)}</span>
          <span className="rp">{fmt(maintenanceTotal)}</span>
        </div>
      </Section>

      <Section title="الفاتورة الإجمالية">
        <Line label="أصناف الخردة" value={scrapTotal} />
        <Line label="إيجار المعدات" value={equipmentTotal} />
        <Line label="أجور العمال" value={workersTotal} />
        <Line label="صيانة الرصيف" value={maintenanceTotal} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <span style={{ fontSize: 15, color: "var(--steel)" }}>الإجمالي</span>
          <span style={{ fontSize: 22, fontWeight: 900 }}>{fmt(grandTotal)}</span>
        </div>

        {user && !canConfirm && (
          <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 10 }}>
            حسابك غير موثق، لا يمكنك تأكيد الحجز حاليًا.
          </p>
        )}

        <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={handleConfirm}>
          {user ? "تأكيد الحجز وعرض الفاتورة" : "سجّل دخولك لتأكيد الحجز"}
        </button>
      </Section>

      <style>{`
        .calc-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 13px; flex-wrap: wrap; }
        .calc-row .unit { color: var(--steel-light); font-size: 12px; white-space: nowrap; }
        .calc-row .rp { min-width: 90px; text-align: left; font-weight: 700; margin-inline-start: auto; }
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

        {(invoice.equipmentRows.length > 0 || invoice.workerCount > 0) && (
          <InvoiceGroup title="الرسوم الإيجارية للمعدات والعمالة">
            {invoice.equipmentRows.map((r, i) => (
              <InvoiceLine key={i} label={`${r.name} - ${r.hours} ساعة`} value={r.total} />
            ))}
            {invoice.workerCount > 0 && (
              <InvoiceLine label={`عمال (${invoice.workerCount}) - ${invoice.workerHours} ساعة`} value={invoice.workersTotal} />
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
