import { useEffect, useState } from "react";
import {
  subscribeAllVerifications,
  approveVerification,
  rejectVerification,
} from "../lib/verification";
import { createWallet } from "../lib/wallet";

export default function AdminVerificationTab({ adminUid }) {
  const [filter, setFilter] = useState("pending");
  const [allRequests, setAllRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsub = subscribeAllVerifications(setAllRequests, (err) => {
      console.error("فشل تحميل طلبات التوثيق:", err);
      setError("تعذر تحميل الطلبات. جرب تحديث الصفحة.");
    });
    return () => unsub();
  }, []);

  const requests = allRequests.filter((r) =>
    filter === "all" ? true : r.status === filter
  );

  async function handleApprove(req) {
    if (
      !window.confirm(
        `تأكيد الدفع وتوثيق حساب "${req.name || req.email}"؟\n\nالنوع: ${
          req.type === "dock" ? "تاجر رصيف" : "تاجر ساحة"
        }\nالكود: ${req.code || "—"}\nالمبلغ: ${Number(
          req.paymentAmount || 0
        ).toLocaleString("ar-eg")}ج`
      )
    )
      return;

    setBusyId(req.id);
    setError("");
    setSuccess("");
    try {
      await approveVerification(req);

      try {
        await createWallet(req.uid, req.type || "dock", adminUid);
        setSuccess(`✅ تم توثيق ${req.name || req.email} وإنشاء محفظته`);
      } catch (walletErr) {
        console.error("فشل إنشاء المحفظة:", walletErr);
        setSuccess(
          `✅ تم توثيق ${req.name || req.email} (⚠️ المحفظة موجودة بالفعل)`
        );
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || "تعذر التوثيق");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(req) {
    if (!rejectingId) return;
    setBusyId(req.id);
    setError("");
    try {
      await rejectVerification(req.id, rejectReason.trim(), req.uid);
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
  const counts = {
    pending: allRequests.filter((r) => r.status === "pending").length,
    approved: allRequests.filter((r) => r.status === "approved").length,
    rejected: allRequests.filter((r) => r.status === "rejected").length,
    all: allRequests.length,
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
          display: "flex",
          gap: 6,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
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
            {labels[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--steel)" }}>
          لا توجد طلبات في هذه الحالة.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map((req) => {
            const typeLabel =
              req.type === "dock"
                ? "تاجر رصيف"
                : req.type === "yard"
                ? "تاجر ساحة"
                : "—";

            return (
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
                      {req.name || req.email}
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

                    {req.type && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: "10px 12px",
                          background: "var(--paper-sunken)",
                          borderRadius: 8,
                          fontSize: 12.5,
                          lineHeight: 1.9,
                        }}
                      >
                        <div>
                          <b>نوع التوثيق:</b> {typeLabel}
                        </div>
                        {req.code && (
                          <div>
                            <b>الكود:</b>{" "}
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontWeight: 800,
                                color: "var(--kabbash)",
                                fontSize: 14,
                              }}
                            >
                              {req.code}
                            </span>
                          </div>
                        )}
                        {req.transactionId && (
                          <div>
                            <b>رقم العملية:</b>{" "}
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontWeight: 700,
                              }}
                            >
                              {req.transactionId}
                            </span>
                          </div>
                        )}
                        {req.paymentAmount > 0 && (
                          <div>
                            <b>المبلغ:</b>{" "}
                            {Number(req.paymentAmount).toLocaleString("ar-EG")}
                            ج
                          </div>
                        )}
                      </div>
                    )}

                    {req.notes && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: 12,
                          color: "var(--steel)",
                        }}
                      >
                        <b>ملاحظات:</b> {req.notes}
                      </p>
                    )}
                    {req.status === "rejected" && req.rejectReason && (
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: 12.5,
                          color: "var(--danger)",
                        }}
                      >
                        <b>سبب الرفض:</b> {req.rejectReason}
                      </p>
                    )}
                  </div>

                  {req.status === "pending" && rejectingId !== req.id && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        alignItems: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--steel)",
                          marginBottom: 4,
                          textAlign: "end",
                          maxWidth: 180,
                          lineHeight: 1.6,
                        }}
                      >
                        ⚠️ قارن الكود ورقم العملية مع إشعار البنك قبل التأكيد
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{
                          padding: "8px 16px",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                        onClick={() => handleApprove(req)}
                        disabled={busyId === req.id}
                      >
                        {busyId === req.id
                          ? "جاري التوثيق..."
                          : "✅ تأكيد الدفع والتوثيق"}
                      </button>
                      <button
                        className="btn"
                        style={{
                          padding: "6px 14px",
                          fontSize: 12.5,
                          color: "var(--danger)",
                          borderColor: "var(--danger)",
                        }}
                        onClick={() => {
                          setRejectingId(req.id);
                          setRejectReason("");
                        }}
                        disabled={busyId === req.id}
                      >
                        ❌ رفض
                      </button>
                    </div>
                  )}

                  {req.status === "approved" && (
                    <span
                      className="badge"
                      style={{ alignSelf: "flex-start" }}
                    >
                      ✅ موثق
                    </span>
                  )}
                  {req.status === "rejected" && (
                    <span
                      className="badge badge-danger"
                      style={{ alignSelf: "flex-start" }}
                    >
                      ❌ مرفوض
                    </span>
                  )}
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
                        onClick={() => confirmReject(req)}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
