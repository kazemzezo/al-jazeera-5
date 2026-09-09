import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGuestPrompt } from "../context/GuestPromptContext";
import { canReserve as canReserveRole } from "../lib/roles";
import { TON_CATEGORIES, LOCATIONS, SITE_MAINTENANCE_FEE } from "../lib/catalog";
import { EQUIPMENT, WORKER_PRICE_PER_CAR, TOTAL_WORKERS } from "../lib/equipment";
import { DEMO_TON_PRICES } from "../lib/demoData";

function fmt(n) {
  return Number(n || 0).toLocaleString("ar-EG") + "ج";
}

export default function Calculator() {
  const { user, role } = useAuth();
  const { promptLogin } = useGuestPrompt();

  const [location, setLocation] = useState(LOCATIONS.DOCK);

  const [rows, setRows] = useState([{ category: TON_CATEGORIES[0], tons: 1 }]);

  const [equipmentHours, setEquipmentHours] = useState({});
  const [workerCount, setWorkerCount] = useState(0);
  const [workerHours, setWorkerHours] = useState(1);
  const [carCount, setCarCount] = useState(1);

  const tonPrices = DEMO_TON_PRICES;

  function addRow() {
    setRows([...rows, { category: TON_CATEGORIES[0], tons: 1 }]);
  }
  function removeRow(idx) {
    setRows(rows.filter((_, i) => i !== idx));
  }
  function updateRow(idx, field, value) {
    setRows(rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  const scrapTotal = useMemo(() => {
    return rows.reduce((sum, r) => {
      const price = tonPrices[r.category]?.pricePerTon || 0;
      return sum + price * Number(r.tons || 0);
    }, 0);
  }, [rows]);

  const equipmentTotal = useMemo(() => {
    return EQUIPMENT.reduce((sum, eq) => {
      const hours = Number(equipmentHours[eq.id] || 0);
      return sum + hours * eq.pricePerHour;
    }, 0);
  }, [equipmentHours]);

  const workersTotal = useMemo(() => {
    return Number(workerCount || 0) * Number(workerHours || 0) * WORKER_PRICE_PER_CAR;
  }, [workerCount, workerHours]);

  const maintenanceFee = SITE_MAINTENANCE_FEE[location];
  const maintenanceTotal = Number(carCount || 0) * maintenanceFee;

  const grandTotal = scrapTotal + equipmentTotal + workersTotal + maintenanceTotal;

  const canConfirm = canReserveRole(role);

  function handleConfirm() {
    if (!user) {
      promptLogin("سجّل دخولك عشان تقدر تأكد الحجز");
      return;
    }
    if (!canConfirm) {
      return;
    }
    window.print();
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>
        أداة الحساب
      </h1>
      <p style={{ fontSize: 13, color: "var(--steel)", marginBottom: 20 }}>
        الأسعار المعروضة تجريبية حاليًا، هتتحدث تلقائيًا من لوحة الإدمن في
        المرحلة القادمة.
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
              <input
                type="number"
                min="0"
                value={r.tons}
                onChange={(e) => updateRow(idx, "tons", e.target.value)}
                style={{ width: 70 }}
              />
              <span className="unit">طن</span>
              <span className="rp">{fmt(price * Number(r.tons || 0))}</span>
              {rows.length > 1 && (
                <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => removeRow(idx)}>
                  حذف
                </button>
              )}
            </div>
          );
        })}
        <button className="btn" style={{ marginTop: 10, fontSize: 13 }} onClick={addRow}>
          + إضافة صنف
        </button>
      </Section>

      <Section title="المعدات والعمال">
        {EQUIPMENT.map((eq) => (
          <div key={eq.id} className="calc-row">
            <span style={{ flex: 1 }}>{eq.name}</span>
            <input
              type="number"
              min="0"
              value={equipmentHours[eq.id] || ""}
              onChange={(e) =>
                setEquipmentHours({ ...equipmentHours, [eq.id]: e.target.value })
              }
              placeholder="0"
              style={{ width: 70 }}
            />
            <span className="unit">ساعة</span>
            <span className="rp">{fmt(Number(equipmentHours[eq.id] || 0) * eq.pricePerHour)}</span>
          </div>
        ))}

        <div className="calc-row">
          <span style={{ flex: 1 }}>عمال (من أصل {TOTAL_WORKERS})</span>
          <input
            type="number"
            min="0"
            max={TOTAL_WORKERS}
            value={workerCount || ""}
            onChange={(e) => setWorkerCount(e.target.value)}
            placeholder="0"
            style={{ width: 70 }}
          />
          <span className="unit">عامل</span>
        </div>
        <div className="calc-row">
          <span style={{ flex: 1 }}>عدد ساعات العمال</span>
          <input
            type="number"
            min="0"
            value={workerHours}
            onChange={(e) => setWorkerHours(e.target.value)}
            style={{ width: 70 }}
          />
          <span className="unit">ساعة</span>
          <span className="rp">{fmt(workersTotal)}</span>
        </div>

        <div className="calc-row" style={{ marginTop: 8 }}>
          <span style={{ flex: 1 }}>عدد السيارات (صيانة الرصيف)</span>
          <input
            type="number"
            min="0"
            value={carCount}
            onChange={(e) => setCarCount(e.target.value)}
            style={{ width: 70 }}
          />
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
            حسابك غير موثق، لا يمكنك تأكيد الحجز حاليًا. تواصل مع إدارة الموقع
            للتوثيق من الصفحة الرئيسية.
          </p>
        )}

        <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={handleConfirm}>
          {user ? "تأكيد الحجز وطباعة الفاتورة" : "سجّل دخولك لتأكيد الحجز"}
        </button>
      </Section>

      <style>{`
        .calc-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid var(--line);
          font-size: 13px;
          flex-wrap: wrap;
        }
        .calc-row .unit { color: var(--steel-light); font-size: 12px; white-space: nowrap; }
        .calc-row .rp { min-width: 90px; text-align: left; font-weight: 700; margin-inline-start: auto; }
      `}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div
      style={{
        background: "var(--paper-raised)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius)",
        padding: 16,
        marginBottom: 16,
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--steel)", margin: "0 0 10px" }}>
        {title}
      </p>
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
