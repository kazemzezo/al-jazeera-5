import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { TON_CATEGORIES } from "../lib/catalog";
import { EQUIPMENT } from "../lib/equipment";
import { DEMO_TON_PRICES } from "../lib/demoData";
import {
  subscribeTonPrices,
  setTonPrice,
  subscribeEquipmentPrices,
  setEquipmentPrice,
} from "../lib/listings";
import {
  subscribePendingVerifications,
  approveVerification,
  rejectVerification,
} from "../lib/verification";

export default function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState("prices");

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>لوحة الإدمن</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Pill active={tab === "prices"} onClick={() => setTab("prices")}>الأسعار</Pill>
        <Pill active={tab === "equipment"} onClick={() => setTab("equipment")}>المعدات</Pill>
        <Pill active={tab === "verification"} onClick={() => setTab("verification")}>طلبات التوثيق</Pill>
      </div>

      {tab === "prices" && <PricesTab uid={user.uid} />}
      {tab === "equipment" && <EquipmentTab uid={user.uid} />}
      {tab === "verification" && <VerificationTab />}

      <style>{`
        .admin-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
        .admin-row .unit { color: var(--steel-light); font-size: 12px; }
      `}</style>
    </div>
  );
}

function PricesTab({ uid }) {
  const [prices, setPrices] = useState({});
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeTonPrices(setPrices);
    return () => unsub();
  }, []);

  useEffect(() => {
    const source = Object.keys(prices).length > 0 ? prices : DEMO_TON_PRICES;
    const v = {};
    TON_CATEGORIES.forEach((c) => (v[c] = source[c]?.pricePerTon ?? 0));
    setValues(v);
  }, [prices]);

  async function saveAll() {
    setSaving(true);
    try {
      await Promise.all(TON_CATEGORIES.map((c) => setTonPrice(c, values[c] || 0, uid)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {TON_CATEGORIES.map((c) => (
        <div key={c} className="admin-row">
          <span style={{ flex: 1 }}>{c}</span>
          <span className="unit">ج/طن</span>
          <input
            type="number"
            value={values[c] ?? 0}
            onChange={(e) => setValues({ ...values, [c]: e.target.value })}
            style={{ width: 110 }}
          />
        </div>
      ))}
      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={saveAll} disabled={saving}>
        {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
      </button>
    </div>
  );
}

function EquipmentTab({ uid }) {
  const [prices, setPrices] = useState({});
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeEquipmentPrices(setPrices);
    return () => unsub();
  }, []);

  useEffect(() => {
    const v = {};
    EQUIPMENT.forEach((eq) => (v[eq.id] = prices[eq.id]?.pricePerHour ?? eq.pricePerHour));
    setValues(v);
  }, [prices]);

  async function saveAll() {
    setSaving(true);
    try {
      await Promise.all(EQUIPMENT.map((eq) => setEquipmentPrice(eq.id, values[eq.id] || 0, uid)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {EQUIPMENT.map((eq) => (
        <div key={eq.id} className="admin-row">
          <span style={{ flex: 1 }}>{eq.name}</span>
          <span className="unit">ج/ساعة</span>
          <input
            type="number"
            value={values[eq.id] ?? 0}
            onChange={(e) => setValues({ ...values, [eq.id]: e.target.value })}
            style={{ width: 110 }}
          />
        </div>
      ))}
      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={saveAll} disabled={saving}>
        {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
      </button>
    </div>
  );
}

function VerificationTab() {
  const [requests, setRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const unsub = subscribePendingVerifications(setRequests);
    return () => unsub();
  }, []);

  async function handleApprove(req) {
    setBusyId(req.id);
    try {
      await approveVerification(req);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(req) {
    setBusyId(req.id);
    try {
      await rejectVerification(req.id);
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) {
    return <p style={{ fontSize: 13, color: "var(--steel)" }}>لا توجد طلبات توثيق معلّقة حاليًا.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {requests.map((req) => (
        <div key={req.id} style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{req.name || req.email}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--steel)" }}>{req.email}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => handleApprove(req)} disabled={busyId === req.id}>
              توثيق
            </button>
            <button className="btn" style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => handleReject(req)} disabled={busyId === req.id}>
              رفض
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      className="btn"
      style={{
        fontSize: 12,
        padding: "6px 14px",
        background: active ? "var(--kabbash)" : "transparent",
        color: active ? "#fff" : "var(--ink)",
        borderColor: active ? "var(--kabbash)" : "var(--line)",
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
