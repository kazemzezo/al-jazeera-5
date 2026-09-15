import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  subscribeAllDeletionRequests,
  rejectDeletionRequest,
  markDeletionCompleted,
  getUserFullData,
} from "../lib/deletionRequests";
import { adminDeleteUserData } from "../lib/adminUserDeletion";

export default function AdminDeletionRequestsTab() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewingData, setViewingData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const unsub = subscribeAllDeletionRequests(setRequests, (err) => {
      console.error("فشل تحميل طلبات الحذف:", err);
      setError("تعذر تحميل الطلبات.");
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === "pending").length,
      completed: requests.filter((r) => r.status === "completed").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      all: requests.length,
    }),
    [requests]
  );

  function showSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  }

  async function handleViewData(req) {
    setLoadingData(true);
    setError("");
    try {
      const data = await getUserFullData(req.uid);
      setViewingData({ request: req, data });
    } catch (err) {
      console.error("فشل تحميل بيانات المستخدم:", err);
      setError("تعذر تحميل بيانات المستخدم.");
    } finally {
      setLoadingData(false);
    }
  }

  async function handleConfirmDelete(req) {
    if (
      !window.confirm(
        `⚠️ تأكيد الحذف النهائي\n\n` +
          `الاسم: ${req.name || req.email}\n` +
          `UID: ${req.uid}\n\n` +
          `سيتم حذف:\n` +
          `• البروفايل\n` +
          `• المحفظة + الرصيد\n` +
          `• كل المعاملات\n` +
          `• كل الحجوزات\n` +
          `• طلبات التوثيق والأكواد\n\n` +
          `هل نسخت البيانات أولاً؟\n` +
          `لا يمكن التراجع عن الحذف!`
      )
    )
      return;

    setBusyId(req.id);
    setError("");
    setSuccess("");
    try {
      const result = await adminDeleteUserData(req.uid);
      await markDeletionCompleted(req.id, user.uid);

      if (result.success) {
        showSuccess(`✅ تم حذف بيانات ${req.name || req.email} بالكامل`);
      } else {
        setError(
          `تم الحذف جزئياً. فشل في: ${result.errors.join(", ")}`
        );
      }
    } catch (err) {
      console.error("فشل حذف البيانات:", err);
      setError("تعذر حذف بيانات المستخدم.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(req) {
    if (!rejectReason.trim()) {
      setError("لازم تكتب سبب الرفض");
      return;
    }
    setBusyId(req.id);
    setError("");
    try {
      await rejectDeletionRequest(req.id, rejectReason.trim(), user.uid);
      setRejectingId(null);
      setRejectReason("");
      showSuccess("تم رفض الطلب");
    } catch (err) {
      console.error(err);
      setError("تعذر رفض الطلب.");
    } finally {
      setBusyId(null);
    }
  }

  const labels = {
    pending: "معلق",
    completed: "مكتمل",
    rejected: "مرفوض",
    all: "الكل",
  };

  return (
    <div>
      {error && (
        <div
          style={{
            fontSize: 13,
            color: "var(--danger)",
            background: "var(--danger-light)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            fontSize: 13,
            color: "var(--kabbash)",
            background: "var(--kabbash-light)",
            border: "1px solid var(--kabbash)",
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            marginBottom: 12,
          }}
        >
          {success}
        </div>
      )}

      <div
        style={{
          background: "var(--crane-light)",
          border: "1px solid var(--crane)",
          borderRadius: "var(--radius)",
          padding: "10px 14px",
          marginBottom: 14,
          fontSize: 12.5,
          lineHeight: 1.7,
        }}
      >
        ⚠️ قبل الحذف النهائي: افتح البيانات وانسخها (زر "📋 نسخ" أو "🖨️ طباعة").
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {["pending", "completed", "rejected", "all"].map((s) => (
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
            {labels[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--steel)" }}>
          لا توجد طلبات في هذه الحالة.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((req) => (
            <div
              key={req.id}
              style={{
                background: "var(--paper-raised)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 220, flex: 1 }}>
                  <p
                    style={{
                      margin: "0 0 2px",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {req.name || "بدون اسم"}
                  </p>
                  <p
                    style={{
                      margin: "2px 0",
                      fontSize: 12,
                      color: "var(--steel)",
                    }}
                  >
                    {req.email}
                  </p>
                  {req.phone && (
                    <p
                      style={{
                        margin: "2px 0",
                        fontSize: 12,
                        color: "var(--steel)",
                      }}
                    >
                      📞 {req.phone}
                    </p>
                  )}
                  {req.company && (
                    <p
                      style={{
                        margin: "2px 0",
                        fontSize: 12,
                        color: "var(--steel)",
                      }}
                    >
                      🏢 {req.company}
                    </p>
                  )}
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 11,
                      color: "var(--steel-light)",
                      fontFamily: "monospace",
                    }}
                  >
                    UID: {req.uid}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 11,
                      color: "var(--steel-light)",
                    }}
                  >
                    📅{" "}
                    {req.createdAt?.toDate?.().toLocaleString("ar-EG") || "—"}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    alignItems: "flex-end",
                  }}
                >
                  {req.status === "pending" && rejectingId !== req.id && (
                    <>
                      <button
                        className="btn"
                        style={{
                          fontSize: 12,
                          padding: "6px 14px",
                          color: "var(--kabbash)",
                          borderColor: "var(--kabbash)",
                        }}
                        onClick={() => handleViewData(req)}
                        disabled={loadingData || busyId === req.id}
                      >
                        📋 عرض البيانات الكاملة
                      </button>
                      <button
                        className="btn"
                        style={{
                          fontSize: 12,
                          padding: "6px 14px",
                          color: "var(--danger)",
                          borderColor: "var(--danger)",
                          fontWeight: 700,
                        }}
                        onClick={() => handleConfirmDelete(req)}
                        disabled={busyId === req.id}
                      >
                        {busyId === req.id
                          ? "جاري الحذف..."
                          : "🗑️ تأكيد الحذف"}
                      </button>
                      <button
                        className="btn"
                        style={{
                          fontSize: 12,
                          padding: "4px 12px",
                        }}
                        onClick={() => {
                          setRejectingId(req.id);
                          setRejectReason("");
                        }}
                        disabled={busyId === req.id}
                      >
                        ❌ رفض
                      </button>
                    </>
                  )}

                  {req.status === "completed" && (
                    <span
                      className="badge"
                      style={{ padding: "6px 14px", fontSize: 12 }}
                    >
                      ✅ تم التنفيذ
                    </span>
                  )}
                  {req.status === "rejected" && (
                    <span
                      className="badge badge-danger"
                      style={{ padding: "6px 14px", fontSize: 12 }}
                    >
                      ❌ مرفوض
                    </span>
                  )}
                </div>
              </div>

              {rejectingId === req.id && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px dashed var(--line)",
                  }}
                >
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
                      style={{
                        background: "var(--danger)",
                        borderColor: "var(--danger)",
                        color: "#fff",
                        fontSize: 13,
                      }}
                      onClick={() => handleReject(req)}
                      disabled={busyId === req.id}
                    >
                      تأكيد الرفض
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: 13 }}
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {req.status === "rejected" && req.rejectReason && (
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 12.5,
                    color: "var(--danger)",
                  }}
                >
                  <b>سبب الرفض:</b> {req.rejectReason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {viewingData && (
        <UserDataModal
          data={viewingData.data}
          request={viewingData.request}
          onClose={() => setViewingData(null)}
        />
      )}
    </div>
  );
}

/* ============================================
   مودال عرض البيانات الكاملة
   ============================================ */
function UserDataModal({ data, request, onClose }) {
  function handleCopyAll() {
    const text = buildTextReport(data, request);
    navigator.clipboard
      .writeText(text)
      .then(() => alert("✅ تم نسخ البيانات للحافظة"))
      .catch(() => alert("تعذر النسخ — استخدم الطباعة"));
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("متصفحك منع فتح نافذة الطباعة");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير بيانات - ${request.name || request.email}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
          h1 { border-bottom: 2px solid #000; padding-bottom: 8px; }
          h2 { margin-top: 24px; color: #333; border-bottom: 1px solid #999; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: right; font-size: 13px; }
          th { background: #f0f0f0; }
          .info { margin: 8px 0; font-size: 14px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${buildHTMLReport(data, request)}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }

  return (
    <div className="udm-backdrop" onClick={onClose}>
      <div className="udm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="udm-header">
          <div>
            <h2 className="udm-title">📋 بيانات المستخدم الكاملة</h2>
            <p className="udm-subtitle">
              {request.name || request.email} · {request.uid}
            </p>
          </div>
          <button
            className="udm-close"
            onClick={onClose}
            type="button"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div className="udm-actions">
          <button className="btn btn-primary" onClick={handleCopyAll}>
            📋 نسخ الكل
          </button>
          <button className="btn" onClick={handlePrint}>
            🖨️ طباعة / حفظ PDF
          </button>
        </div>

        <div className="udm-body">
          <DataSection title="👤 البروفايل">
            {data.profile ? (
              <KV obj={data.profile} skip={["uid"]} />
            ) : (
              <p className="udm-empty">لا يوجد</p>
            )}
          </DataSection>

          <DataSection title="💼 المحفظة">
            {data.wallet ? (
              <KV obj={data.wallet} />
            ) : (
              <p className="udm-empty">لا توجد محفظة</p>
            )}
          </DataSection>

          <DataSection
            title={`📜 عمليات المحفظة (${data.transactions.length})`}
          >
            {data.transactions.length === 0 ? (
              <p className="udm-empty">لا توجد عمليات</p>
            ) : (
              <table className="udm-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>المبلغ</th>
                    <th>السبب</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((t) => (
                    <tr key={t.id}>
                      <td>
                        {t.createdAt
                          ?.toDate?.()
                          .toLocaleString("ar-EG") || "—"}
                      </td>
                      <td>{t.type}</td>
                      <td>{Number(t.amount || 0).toLocaleString("ar-EG")}ج</td>
                      <td>{t.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </DataSection>

          <DataSection
            title={`🚛 الحجوزات (${data.reservations.length})`}
          >
            {data.reservations.length === 0 ? (
              <p className="udm-empty">لا توجد حجوزات</p>
            ) : (
              <table className="udm-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reservations.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {r.createdAt
                          ?.toDate?.()
                          .toLocaleString("ar-EG") || r.date || "—"}
                      </td>
                      <td>{r.adTitle || r.category || r.type || "—"}</td>
                      <td>
                        {Number(r.grandTotal || 0).toLocaleString("ar-EG")}ج
                      </td>
                      <td>{r.status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </DataSection>

          <DataSection
            title={`🔑 طلبات التوثيق (${data.verificationRequests.length})`}
          >
            {data.verificationRequests.length === 0 ? (
              <p className="udm-empty">لا توجد طلبات</p>
            ) : (
              <table className="udm-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>الكود</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.verificationRequests.map((v) => (
                    <tr key={v.id}>
                      <td>
                        {v.createdAt
                          ?.toDate?.()
                          .toLocaleString("ar-EG") || "—"}
                      </td>
                      <td>{v.type || "—"}</td>
                      <td style={{ fontFamily: "monospace" }}>
                        {v.code || "—"}
                      </td>
                      <td>{v.status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </DataSection>

          <DataSection title={`🎫 أكواد التوثيق (${data.codes.length})`}>
            {data.codes.length === 0 ? (
              <p className="udm-empty">لا توجد أكواد</p>
            ) : (
              <table className="udm-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الكود</th>
                    <th>النوع</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.codes.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {c.createdAt
                          ?.toDate?.()
                          .toLocaleString("ar-EG") || "—"}
                      </td>
                      <td style={{ fontFamily: "monospace" }}>
                        {c.code || "—"}
                      </td>
                      <td>{c.type || "—"}</td>
                      <td>{c.status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </DataSection>
        </div>
      </div>

      <style>{`
        .udm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 18, 16, 0.7);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 110;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: udm-fade .2s ease;
        }
        @keyframes udm-fade {
          from { opacity: 0 } to { opacity: 1 }
        }
        .udm-modal {
          background: var(--paper-raised);
          color: var(--ink);
          border-radius: 16px;
          padding: 22px;
          width: 100%;
          max-width: 780px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
          animation: udm-pop .25s cubic-bezier(0.22, 0.61, 0.36, 1);
          max-height: 92vh;
          display: flex;
          flex-direction: column;
        }
        @keyframes udm-pop {
          from { transform: scale(0.95); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }
        .udm-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--line);
        }
        .udm-title {
          margin: 0 0 4px;
          font-size: 17px;
          font-weight: 900;
        }
        .udm-subtitle {
          margin: 0;
          font-size: 12px;
          color: var(--steel);
          font-family: monospace;
        }
        .udm-close {
          background: transparent;
          border: none;
          color: var(--steel);
          font-size: 16px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .udm-close:hover {
          background: var(--paper-sunken);
        }
        .udm-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .udm-body {
          flex: 1;
          overflow-y: auto;
          padding-inline-end: 6px;
        }
        .udm-empty {
          font-size: 12.5px;
          color: var(--steel-light);
          margin: 0;
        }
        .udm-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
        }
        .udm-table th,
        .udm-table td {
          border: 1px solid var(--line);
          padding: 6px 10px;
          text-align: start;
        }
        .udm-table th {
          background: var(--paper-sunken);
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

function DataSection({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "var(--kabbash)",
          margin: "0 0 8px",
          paddingBottom: 6,
          borderBottom: "1px solid var(--line)",
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function KV({ obj, skip = [] }) {
  const entries = Object.entries(obj).filter(
    ([k]) => !skip.includes(k) && typeof obj[k] !== "object"
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {entries.map(([k, v]) => (
        <div
          key={k}
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12.5,
            gap: 10,
            padding: "4px 8px",
            background: "var(--paper-sunken)",
            borderRadius: 6,
          }}
        >
          <span style={{ color: "var(--steel)" }}>{k}</span>
          <span style={{ fontWeight: 700 }}>
            {String(v).slice(0, 60)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================================
   بناء تقرير نصي (للنسخ)
   ============================================ */
function buildTextReport(data, request) {
  const lines = [];
  lines.push("═".repeat(50));
  lines.push(`تقرير بيانات المستخدم — ${request.name || request.email}`);
  lines.push("═".repeat(50));
  lines.push(`UID: ${request.uid}`);
  lines.push(`تاريخ الطلب: ${request.createdAt?.toDate?.().toLocaleString("ar-EG") || "—"}`);
  lines.push("");

  lines.push("── البروفايل ──");
  if (data.profile) {
    Object.entries(data.profile).forEach(([k, v]) => {
      if (typeof v !== "object") lines.push(`${k}: ${v}`);
    });
  } else lines.push("لا يوجد");
  lines.push("");

  lines.push("── المحفظة ──");
  if (data.wallet) {
    Object.entries(data.wallet).forEach(([k, v]) => {
      if (typeof v !== "object") lines.push(`${k}: ${v}`);
    });
  } else lines.push("لا توجد محفظة");
  lines.push("");

  lines.push(`── عمليات المحفظة (${data.transactions.length}) ──`);
  data.transactions.forEach((t, i) => {
    lines.push(
      `${i + 1}. ${t.type} | ${Number(t.amount || 0)}ج | ${t.reason || "—"} | ${
        t.createdAt?.toDate?.().toLocaleString("ar-EG") || "—"
      }`
    );
  });
  lines.push("");

  lines.push(`── الحجوزات (${data.reservations.length}) ──`);
  data.reservations.forEach((r, i) => {
    lines.push(
      `${i + 1}. ${r.adTitle || r.category || r.type} | ${Number(
        r.grandTotal || 0
      )}ج | ${r.status} | ${
        r.createdAt?.toDate?.().toLocaleString("ar-EG") || "—"
      }`
    );
  });
  lines.push("");

  lines.push(`── طلبات التوثيق (${data.verificationRequests.length}) ──`);
  data.verificationRequests.forEach((v, i) => {
    lines.push(
      `${i + 1}. ${v.type} | ${v.code || "—"} | ${v.status} | ${
        v.createdAt?.toDate?.().toLocaleString("ar-EG") || "—"
      }`
    );
  });
  lines.push("");

  lines.push(`── أكواد التوثيق (${data.codes.length}) ──`);
  data.codes.forEach((c, i) => {
    lines.push(
      `${i + 1}. ${c.code} | ${c.type} | ${c.status} | ${
        c.createdAt?.toDate?.().toLocaleString("ar-EG") || "—"
      }`
    );
  });

  lines.push("");
  lines.push("═".repeat(50));
  return lines.join("\n");
}

/* ============================================
   بناء تقرير HTML (للطباعة)
   ============================================ */
function buildHTMLReport(data, request) {
  function table(headers, rows) {
    return `
      <table>
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows
            .map(
              (row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  return `
    <h1>تقرير بيانات المستخدم</h1>
    <p class="info"><b>الاسم:</b> ${request.name || "—"}</p>
    <p class="info"><b>الإيميل:</b> ${request.email || "—"}</p>
    <p class="info"><b>UID:</b> ${request.uid}</p>
    <p class="info"><b>تاريخ الطلب:</b> ${request.createdAt?.toDate?.().toLocaleString("ar-EG") || "—"}</p>

    <h2>👤 البروفايل</h2>
    ${
      data.profile
        ? `<div>${Object.entries(data.profile)
            .filter(([, v]) => typeof v !== "object")
            .map(([k, v]) => `<p class="info"><b>${k}:</b> ${v}</p>`)
            .join("")}</div>`
        : "<p>لا يوجد</p>"
    }

    <h2>💼 المحفظة</h2>
    ${
      data.wallet
        ? `<div>${Object.entries(data.wallet)
            .filter(([, v]) => typeof v !== "object")
            .map(([k, v]) => `<p class="info"><b>${k}:</b> ${v}</p>`)
            .join("")}</div>`
        : "<p>لا توجد محفظة</p>"
    }

    <h2>📜 عمليات المحفظة (${data.transactions.length})</h2>
    ${
      data.transactions.length
        ? table(
            ["التاريخ", "النوع", "المبلغ", "السبب"],
            data.transactions.map((t) => [
              t.createdAt?.toDate?.().toLocaleString("ar-EG") || "—",
              t.type,
              Number(t.amount || 0).toLocaleString("ar-EG") + "ج",
              t.reason || "—",
            ])
          )
        : "<p>لا توجد عمليات</p>"
    }

    <h2>🚛 الحجوزات (${data.reservations.length})</h2>
    ${
      data.reservations.length
        ? table(
            ["التاريخ", "النوع", "الإجمالي", "الحالة"],
            data.reservations.map((r) => [
              r.createdAt?.toDate?.().toLocaleString("ar-EG") || "—",
              r.adTitle || r.category || r.type || "—",
              Number(r.grandTotal || 0).toLocaleString("ar-EG") + "ج",
              r.status || "—",
            ])
          )
        : "<p>لا توجد حجوزات</p>"
    }

    <h2>🔑 طلبات التوثيق (${data.verificationRequests.length})</h2>
    ${
      data.verificationRequests.length
        ? table(
            ["التاريخ", "النوع", "الكود", "الحالة"],
            data.verificationRequests.map((v) => [
              v.createdAt?.toDate?.().toLocaleString("ar-EG") || "—",
              v.type || "—",
              v.code || "—",
              v.status || "—",
            ])
          )
        : "<p>لا توجد طلبات</p>"
    }

    <h2>🎫 أكواد التوثيق (${data.codes.length})</h2>
    ${
      data.codes.length
        ? table(
            ["التاريخ", "الكود", "النوع", "الحالة"],
            data.codes.map((c) => [
              c.createdAt?.toDate?.().toLocaleString("ar-EG") || "—",
              c.code || "—",
              c.type || "—",
              c.status || "—",
            ])
          )
        : "<p>لا توجد أكواد</p>"
    }
  `;
}
