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
  subscribeVerificationsByStatus,
  approveVerification,
  rejectVerification,
} from "../lib/verification";
import { subscribeMessages, markMessageRead } from "../lib/messages";

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
        <Pill active={tab === "messages"} onClick={() => setTab("messages")}>رسائل التواصل</Pill>
      </div>

      {tab === "prices" && <PricesTab uid={user.uid} />}
      {tab === "equipment" && <EquipmentTab uid={user.uid} />}
      {tab === "verification" && <VerificationTab />}
      {tab === "messages" && <MessagesTab />}
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
  const [filter, setFilter] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const unsub = subscribeVerificationsByStatus(filter, setRequests);
    return () => unsub();
  }, [filter]);

  async function handleApprove(req) {
    setBusyId(req.id);
    try {
      await approveVerification(req);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(req) {
    if (!rejectingId) return;
    setBusyId(req.id);
    try {
      await rejectVerification(req.id, rejectReason.trim());
      setRejectingId(null);
      setRejectReason("");
    } finally {
      setBusyId(null);
    }
  }

  const labels = {
    pending: "معلق",
    approved: "مقبول",
    rejected: "مرفوض",
    all: "الكل",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button
            key={s}
            className="btn"
            style={{
              fontSize: 12,
              padding: "5px 12px",
              background: filter === s ? "var(--ink)" : "transparent",
              color: filter === s ? "var(--paper)" : "var(--ink)",
              borderColor: filter === s ? "var(--ink)" : "var(--line)",
            }}
            onClick={() => setFilter(s)}
          >
            {labels[s]}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--steel)" }}>لا توجد طلبات في هذه الحالة.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map((req) => (
            <div
              key={req.id}
              style={{
                background: "var(--paper-raised)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                padding: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{req.name || req.email}</p>
                  <p style={{ margin: "2px 0", fontSize: 12, color: "var(--steel)" }}>{req.email}</p>
                  {req.phone && (
                    <p style={{ margin: "2px 0", fontSize: 12, color: "var(--steel)" }}>
                      📞 {req.phone}
                    </p>
                  )}
                  {req.notes && (
                    <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--ink)" }}>
                      <b>ملاحظات:</b> {req.notes}
                    </p>
                  )}
                  {req.status === "rejected" && req.rejectReason && (
                    <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--danger)" }}>
                      <b>سبب الرفض:</b> {req.rejectReason}
                    </p>
                  )}
                </div>

                {req.status === "pending" && rejectingId !== req.id && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: "6px 14px", fontSize: 13 }}
                      onClick={() => handleApprove(req)}
                      disabled={busyId === req.id}
                    >
                      توثيق
                    </button>
                    <button
                      className="btn"
                      style={{ padding: "6px 14px", fontSize: 13, color: "var(--danger)", borderColor: "var(--danger)" }}
                      onClick={() => { setRejectingId(req.id); setRejectReason(""); }}
                      disabled={busyId === req.id}
                    >
                      رفض
                    </button>
                  </div>
                )}

                {req.status === "approved" && (
                  <span className="badge" style={{ alignSelf: "flex-start" }}>✅ موثق</span>
                )}
                {req.status === "rejected" && (
                  <span className="badge badge-danger" style={{ alignSelf: "flex-start" }}>❌ مرفوض</span>
                )}
              </div>

              {rejectingId === req.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--line)" }}>
                  <input
                    className="input"
                    placeholder="سبب الرفض (سيظهر للتاجر)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn"
                      style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "#fff", fontSize: 13 }}
                      onClick={() => confirmReject(req)}
                      disabled={busyId === req.id}
                    >
                      تأكيد الرفض
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: 13 }}
                      onClick={() => { setRejectingId(null); setRejectReason(""); }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesTab() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsub = subscribeMessages(setMessages);
    return () => unsub();
  }, []);

  if (messages.length === 0) {
    return <p style={{ fontSize: 13, color: "var(--steel)" }}>لا توجد رسائل حتى الآن.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {messages.map((m) => (
        <div
          key={m.id}
          style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 14 }}
          onClick={() => !m.read && markMessageRead(m.id)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{m.name || "بدون اسم"}</p>
            {!m.read && <span style={{ fontSize: 11, color: "var(--kabbash)", fontWeight: 700 }}>جديدة</span>}
          </div>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--steel)" }}>{m.email}</p>
          <p style={{ margin: 0, fontSize: 13 }}>{m.text}</p>
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
