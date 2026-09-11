import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useGuestPrompt } from "../context/GuestPromptContext";
import { db } from "../lib/firebase";
import { ROLES } from "../lib/roles";
import { subscribeMyLatestVerification } from "../lib/verification";
import { subscribeMyReservations } from "../lib/listings";
import InvoiceView from "../components/InvoiceView";

const ROLE_LABELS = {
  [ROLES.ADMIN]: "أدمن",
  [ROLES.SUPERVISOR]: "مشرف الموقع",
  [ROLES.VERIFIED_TRADER]: "تاجر موثق",
  [ROLES.TRADER]: "تاجر غير موثق",
  [ROLES.DRIVER_KABBASH]: "سائق الكباش",
  [ROLES.DRIVER_CRAWLER_CRANE]: "سائق الرافعة المجنزرة",
  [ROLES.DRIVER_FORKLIFT]: "سائق الرافعة الشوكية",
};

const RES_STATUS_LABELS = {
  new: "🟡 جديد",
  contacted: "🔵 تم التواصل",
  completed: "🟢 مكتمل",
  cancelled: "🔴 ملغي",
};

function statusStyle(status) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  };
  if (status === "new") return { ...base, background: "var(--crane-light)", color: "var(--crane)" };
  if (status === "contacted") return { ...base, background: "var(--kabbash-light)", color: "var(--steel)" };
  if (status === "completed") return { ...base, background: "var(--kabbash-light)", color: "var(--kabbash)" };
  if (status === "cancelled") return { ...base, background: "var(--danger-light)", color: "var(--danger)" };
  return base;
}

export default function Profile() {
  const { user, profile, role } = useAuth();
  const { promptVerification } = useGuestPrompt();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState(null);
  const [loadingVerif, setLoadingVerif] = useState(true);
  const [myReservations, setMyReservations] = useState([]);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyLatestVerification(user.uid, (v) => {
      setVerification(v);
      setLoadingVerif(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyReservations(user.uid, setMyReservations);
    return () => unsub();
  }, [user]);

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      navigate("/");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setError("لأسباب أمنية، لازم تسجل خروج وتدخل تاني قبل ما تقدر تحذف الحساب.");
      } else {
        setError("حصل خطأ أثناء حذف الحساب، حاول مرة أخرى.");
      }
      setDeleting(false);
    }
  }

  if (viewing) {
    return <InvoiceView invoice={viewing} onBack={() => setViewing(null)} />;
  }

  const isVerified = role === ROLES.VERIFIED_TRADER || role === ROLES.ADMIN;

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 16 }}>حسابي</h1>

      <div
        style={{
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          padding: 18,
          marginBottom: 16,
        }}
      >
        <Row label="الاسم" value={profile?.name || "—"} />
        <Row label="البريد الإلكتروني" value={user?.email} />
        <Row label="نوع الحساب" value={ROLE_LABELS[role] || "—"} />
      </div>

      {!isVerified ? (
        <div
          style={{
            background: "var(--paper-raised)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
            padding: 18,
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 800, margin: "0 0 10px" }}>
            حالة التوثيق
          </p>
          <VerificationStatus
            loading={loadingVerif}
            verification={verification}
            onRequest={() => promptVerification("")}
          />
        </div>
      ) : (
        <div
          className="badge"
          style={{ display: "inline-flex", padding: "10px 16px", fontSize: 13, marginBottom: 16 }}
        >
          ✅ حسابك موثق — يمكنك تأكيد الحجوزات
        </div>
      )}

      <div
        style={{
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          padding: 18,
          marginBottom: 16,
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 800, margin: "0 0 12px" }}>
          حجوزاتي ({myReservations.length})
        </p>

        {myReservations.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--steel)", margin: 0 }}>
            لسه مفيش حجوزات. اعمل حجز من أداة الحساب أو من الصفحة الرئيسية.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myReservations.map((r) => {
              const dateLabel =
                r.createdAt?.toDate?.().toLocaleString("ar-EG") || r.date || "—";
              return (
                <div
                  key={r.id}
                  style={{
                    background: "var(--paper-sunken)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius)",
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={statusStyle(r.status)}>
                          {RES_STATUS_LABELS[r.status] || r.status}
                        </span>
                        {r.invoiceId && (
                          <span style={{ fontSize: 11, color: "var(--steel-light)" }}>
                            {r.invoiceId}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "6px 0 2px", fontSize: 13.5, fontWeight: 600 }}>
                        {r.type === "calculator"
                          ? `فاتورة من الحاسبة · ${r.location === "dock" ? "الرصيف" : "الساحة"}`
                          : `${r.category} · ${r.qty} ${r.saleType === "lot" ? "لوط" : r.saleType === "piece" ? "قطعة" : "طن"}`}
                      </p>
                      <p style={{ margin: 0, fontSize: 11.5, color: "var(--steel-light)" }}>
                        {dateLabel}
                      </p>
                      {r.status === "cancelled" && r.cancelReason && (
                        <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--danger)" }}>
                          <b>سبب الإلغاء:</b> {r.cancelReason}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 900 }}>
                        {Number(r.grandTotal || 0).toLocaleString("ar-EG")}ج
                      </span>
                      <button
                        className="btn"
                        style={{ fontSize: 11.5, padding: "4px 10px" }}
                        onClick={() => setViewing(r)}
                      >
                        عرض الفاتورة
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          background: "var(--paper-raised)",
          border: "1px solid var(--danger)",
          borderRadius: "var(--radius-lg)",
          padding: 18,
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>حذف الحساب</p>
        <p style={{ fontSize: 12, color: "var(--steel)", marginBottom: 12 }}>
          حذف حسابك نهائي وسيؤدي لمسح بياناتك بالكامل من الموقع، ولا يمكن التراجع عنه.
        </p>

        {!confirming ? (
          <button
            className="btn"
            style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
            onClick={() => setConfirming(true)}
          >
            حذف الحساب
          </button>
        ) : (
          <div>
            <p style={{ fontSize: 13, marginBottom: 10 }}>
              متأكد؟ بياناتك هتتحذف بالكامل ولن تستطيع استرجاعها.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn"
                style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "#fff" }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "جاري الحذف..." : "نعم، احذف حسابي"}
              </button>
              <button className="btn" onClick={() => setConfirming(false)} disabled={deleting}>
                تراجع
              </button>
            </div>
          </div>
        )}

        {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 10 }}>{error}</p>}
      </div>
    </div>
  );
}

function VerificationStatus({ loading, verification, onRequest }) {
  if (loading) {
    return <p style={{ fontSize: 13, color: "var(--steel)", margin: 0 }}>جاري التحميل...</p>;
  }

  if (!verification) {
    return (
      <div>
        <p style={{ fontSize: 13, color: "var(--steel)", margin: "0 0 12px", lineHeight: 1.7 }}>
          حسابك غير موثق حاليًا، وبالتالي لا يمكنك تأكيد أي حجز. أرسل طلب توثيق وهيتم مراجعته من الإدارة.
        </p>
        <button className="btn btn-primary" onClick={onRequest}>أرسل طلب توثيق</button>
      </div>
    );
  }

  if (verification.status === "pending") {
    return (
      <div>
        <div className="badge badge-warn" style={{ padding: "8px 14px", fontSize: 13 }}>
          ⏳ طلبك تحت المراجعة
        </div>
        <p style={{ fontSize: 12.5, color: "var(--steel)", margin: "10px 0 0" }}>
          تم إرسال طلبك بتاريخ {verification.createdAt?.toDate?.().toLocaleDateString("ar-EG") || "—"} وسيتم إشعارك عند الرد.
        </p>
      </div>
    );
  }

  if (verification.status === "rejected") {
    return (
      <div>
        <div className="badge badge-danger" style={{ padding: "8px 14px", fontSize: 13 }}>
          ❌ تم رفض الطلب
        </div>
        {verification.rejectReason && (
          <p style={{ fontSize: 13, color: "var(--ink)", margin: "10px 0 12px" }}>
            <b>السبب:</b> {verification.rejectReason}
          </p>
        )}
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={onRequest}>
          إعادة إرسال الطلب
        </button>
      </div>
    );
  }

  if (verification.status === "approved") {
    return (
      <div className="badge" style={{ padding: "8px 14px", fontSize: 13 }}>
        ✅ حسابك موثق
      </div>
    );
  }

  return null;
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        fontSize: 13,
        borderBottom: "1px solid var(--line)",
      }}
    >
      <span style={{ color: "var(--steel)" }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}
