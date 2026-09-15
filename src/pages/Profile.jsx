import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  requestAccountDeletion,
  subscribeMyDeletionRequest,
} from "../lib/deletionRequests";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/roles";
import { subscribeMyLatestVerification } from "../lib/verification";
import { subscribeMyReservations } from "../lib/listings";
import InvoiceView from "../components/InvoiceView";
import CompleteProfileForm from "../components/CompleteProfileForm";
import VerificationRequestModal from "../components/VerificationRequestModal";
import WalletCard from "../components/WalletCard";

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
  in_progress: "🟣 قيد التنفيذ",
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
  if (status === "new")
    return { ...base, background: "var(--crane-light)", color: "var(--crane)" };
  if (status === "contacted")
    return { ...base, background: "var(--kabbash-light)", color: "var(--steel)" };
  if (status === "in_progress")
    return {
      ...base,
      background: "var(--kabbash-light)",
      color: "var(--kabbash)",
    };
  if (status === "completed")
    return {
      ...base,
      background: "var(--kabbash-light)",
      color: "var(--kabbash)",
    };
  if (status === "cancelled")
    return { ...base, background: "var(--danger-light)", color: "var(--danger)" };
  return base;
}

function getReservationTitle(r) {
  if (r.type === "calculator") {
    return `فاتورة من الحاسبة · ${
      r.location === "dock" ? "الرصيف" : "الساحة"
    }`;
  }
  if (r.type === "ad") {
    const itemCount = r.items?.length || 0;
    const totalQty = (r.items || []).reduce(
      (s, it) => s + Number(it.qty || 0),
      0
    );
    const firstCat = r.items?.[0]?.category || "";
    const extra = itemCount > 1 ? ` و${itemCount - 1} صنف آخر` : "";
    return `${firstCat}${extra} · ${totalQty}`;
  }
  return `${r.category} · ${r.qty} ${
    r.saleType === "lot" ? "لوط" : r.saleType === "piece" ? "قطعة" : "طن"
  }`;
}

export default function Profile() {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();
  const [verification, setVerification] = useState(null);
  const [loadingVerif, setLoadingVerif] = useState(true);
  const [myReservations, setMyReservations] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [deletionRequest, setDeletionRequest] = useState(null);

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

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyDeletionRequest(user.uid, setDeletionRequest);
    return () => unsub();
  }, [user]);

  async function handleDeleteRequest() {
    setDeleting(true);
    setError("");
    try {
      await requestAccountDeletion(user, profile);
      setConfirming(false);
    } catch (err) {
      console.error("فشل طلب الحذف:", err);
      setError(err?.message || "تعذر إرسال طلب الحذف، حاول مرة أخرى.");
    } finally {
      setDeleting(false);
    }
  }

  if (viewing) {
    return <InvoiceView invoice={viewing} onBack={() => setViewing(null)} />;
  }

  const isVerified = role === ROLES.VERIFIED_TRADER || role === ROLES.ADMIN;
  const isAdmin = role === ROLES.ADMIN;
  const hasPendingDeletion = deletionRequest?.status === "pending";

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 16 }}>
        حسابي
      </h1>

      {/* بياناتي */}
      <div
        style={{
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          padding: 18,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>بياناتي</p>
          <button
            className="btn"
            style={{ fontSize: 12.5, padding: "5px 12px" }}
            onClick={() => setEditing(true)}
          >
            ✏️ تعديل البيانات
          </button>
        </div>

        <Row label="الاسم الكامل" value={profile?.name || "—"} />
        <Row label="البريد الإلكتروني" value={user?.email} />
        <Row label="رقم الهاتف" value={profile?.phone || "—"} />
        <Row label="المحافظة" value={profile?.governorate || "—"} />
        <Row label="اسم الشركة" value={profile?.company || "—"} />
        <Row label="عنوان الشركة" value={profile?.address || "—"} />
        <Row label="نوع الحساب" value={ROLE_LABELS[role] || "—"} last />
      </div>

      {/* محفظتي */}
      {isVerified && !isAdmin && <WalletCard />}

      {/* حالة التوثيق */}
      {!isVerified && !isAdmin && (
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
            onRequest={() => setShowVerificationModal(true)}
          />
        </div>
      )}

      {isVerified && (
        <div
          className="badge"
          style={{
            display: "inline-flex",
            padding: "10px 16px",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          ✅ حسابك موثق — يمكنك تأكيد الحجوزات
        </div>
      )}

      {/* حجوزاتي */}
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
            لسه مفيش حجوزات. اعمل حجز من أعلانات الرئيسية.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myReservations.map((r) => {
              const dateLabel =
                r.createdAt?.toDate?.().toLocaleString("ar-EG") ||
                r.date ||
                "—";
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={statusStyle(r.status)}>
                          {RES_STATUS_LABELS[r.status] || r.status}
                        </span>
                        {r.invoiceId && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--steel-light)",
                            }}
                          >
                            {r.invoiceId}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: "6px 0 2px",
                          fontSize: 13.5,
                          fontWeight: 600,
                        }}
                      >
                        {getReservationTitle(r)}
                      </p>
                      {r.adTitle && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11.5,
                            color: "var(--steel)",
                          }}
                        >
                          {r.adTitle}
                        </p>
                      )}
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11.5,
                          color: "var(--steel-light)",
                        }}
                      >
                        {dateLabel}
                      </p>
                      {r.status === "cancelled" && r.cancelReason && (
                        <p
                          style={{
                            margin: "6px 0 0",
                            fontSize: 12,
                            color: "var(--danger)",
                          }}
                        >
                          <b>سبب الإلغاء:</b> {r.cancelReason}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 6,
                      }}
                    >
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

      {/* حالة طلب الحذف */}
      {deletionRequest && (
        <div
          style={{
            background: "var(--paper-raised)",
            border: `1px solid ${
              deletionRequest.status === "rejected"
                ? "var(--danger)"
                : deletionRequest.status === "pending"
                ? "var(--crane)"
                : "var(--line)"
            }`,
            borderRadius: "var(--radius-lg)",
            padding: 18,
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 800, margin: "0 0 10px" }}>
            طلب حذف الحساب
          </p>

          {deletionRequest.status === "pending" && (
            <>
              <div
                className="badge badge-warn"
                style={{ padding: "8px 14px", fontSize: 13 }}
              >
                ⏳ طلب الحذف تحت المراجعة
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--steel)",
                  margin: "10px 0 0",
                  lineHeight: 1.7,
                }}
              >
                هيتم التواصل معك من الإدارة قبل الحذف النهائي.
              </p>
            </>
          )}

          {deletionRequest.status === "rejected" && (
            <>
              <div
                className="badge badge-danger"
                style={{ padding: "8px 14px", fontSize: 13 }}
              >
                ❌ تم رفض طلب الحذف
              </div>
              {deletionRequest.rejectReason && (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--ink)",
                    margin: "10px 0 0",
                  }}
                >
                  <b>السبب:</b> {deletionRequest.rejectReason}
                </p>
              )}
            </>
          )}

          {deletionRequest.status === "completed" && (
            <div
              className="badge"
              style={{ padding: "8px 14px", fontSize: 13 }}
            >
              ✅ تم تنفيذ طلب الحذف
            </div>
          )}
        </div>
      )}

      {/* حذف الحساب */}
      {!isAdmin && (
        <div
          style={{
            background: "var(--paper-raised)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-lg)",
            padding: 18,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
            طلب حذف الحساب
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--steel)",
              marginBottom: 12,
              lineHeight: 1.7,
            }}
          >
            عند إرسال الطلب، هيتم مراجعته من الإدارة والتواصل معك. الحذف
            نهائي ولا يمكن التراجع عنه.
          </p>

          {hasPendingDeletion ? (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--crane-light)",
                border: "1px solid var(--crane)",
                borderRadius: "var(--radius)",
                fontSize: 12.5,
                color: "var(--crane)",
                fontWeight: 700,
              }}
            >
              ⏳ لديك طلب حذف قيد المراجعة — هيتم التواصل معك قريبًا.
            </div>
          ) : !confirming ? (
            <button
              className="btn"
              style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
              onClick={() => setConfirming(true)}
            >
              طلب حذف الحساب
            </button>
          ) : (
            <div>
              <p
                style={{
                  fontSize: 13,
                  marginBottom: 10,
                  lineHeight: 1.7,
                }}
              >
                هيتم إرسال طلب للإدارة لمراجعة حذف حسابك. سيتم التواصل معك
                قبل الحذف النهائي.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn"
                  style={{
                    background: "var(--danger)",
                    borderColor: "var(--danger)",
                    color: "#fff",
                  }}
                  onClick={handleDeleteRequest}
                  disabled={deleting}
                >
                  {deleting ? "جاري الإرسال..." : "نعم، أرسل طلب الحذف"}
                </button>
                <button
                  className="btn"
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                >
                  تراجع
                </button>
              </div>
            </div>
          )}

          {error && (
            <p
              style={{
                color: "var(--danger)",
                fontSize: 12,
                marginTop: 10,
              }}
            >
              {error}
            </p>
          )}
        </div>
      )}

      {/* المودالات */}
      {editing && (
        <CompleteProfileForm forceMode onClose={() => setEditing(false)} />
      )}
      {showVerificationModal && (
        <VerificationRequestModal
          onClose={() => setShowVerificationModal(false)}
        />
      )}
    </div>
  );
}

/* ============================================
   حالة التوثيق
   ============================================ */
function VerificationStatus({ loading, verification, onRequest }) {
  if (loading) {
    return (
      <p style={{ fontSize: 13, color: "var(--steel)", margin: 0 }}>
        جاري التحميل...
      </p>
    );
  }

  if (!verification) {
    return (
      <div>
        <p
          style={{
            fontSize: 13,
            color: "var(--steel)",
            margin: "0 0 12px",
            lineHeight: 1.7,
          }}
        >
          حسابك غير موثق حاليًا، وبالتالي لا يمكنك تأكيد أي حجز. أرسل طلب
          توثيق وهيتم مراجعته من الإدارة.
        </p>
        <button className="btn btn-primary" onClick={onRequest}>
          🔑 أرسل طلب توثيق
        </button>
      </div>
    );
  }

  const typeLabel =
    verification.type === "dock"
      ? "تاجر رصيف"
      : verification.type === "yard"
      ? "تاجر ساحة"
      : "";

  if (verification.status === "pending") {
    return (
      <div>
        <div
          className="badge badge-warn"
          style={{ padding: "8px 14px", fontSize: 13 }}
        >
          ⏳ طلبك تحت المراجعة
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 12.5,
            color: "var(--steel)",
            lineHeight: 1.8,
          }}
        >
          {typeLabel && (
            <p style={{ margin: "0 0 4px" }}>
              <b>النوع:</b> {typeLabel}
            </p>
          )}
          {verification.code && (
            <p style={{ margin: "0 0 4px" }}>
              <b>الكود:</b>{" "}
              <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                {verification.code}
              </span>
            </p>
          )}
          {verification.transactionId && (
            <p style={{ margin: "0 0 4px" }}>
              <b>رقم العملية:</b> {verification.transactionId}
            </p>
          )}
          <p style={{ margin: "8px 0 0" }}>
            تم إرسال طلبك بتاريخ{" "}
            {verification.createdAt?.toDate?.().toLocaleDateString("ar-EG") ||
              "—"}{" "}
            وسيتم إشعارك عند الرد.
          </p>
        </div>
      </div>
    );
  }

  if (verification.status === "rejected") {
    return (
      <div>
        <div
          className="badge badge-danger"
          style={{ padding: "8px 14px", fontSize: 13 }}
        >
          ❌ تم رفض الطلب
        </div>
        {verification.rejectReason && (
          <p
            style={{
              fontSize: 13,
              color: "var(--ink)",
              margin: "10px 0 12px",
            }}
          >
            <b>السبب:</b> {verification.rejectReason}
          </p>
        )}
        <button
          className="btn btn-primary"
          style={{ marginTop: 8 }}
          onClick={onRequest}
        >
          🔑 إعادة إرسال الطلب
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

function Row({ label, value, last }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        fontSize: 13,
        borderBottom: last ? "none" : "1px solid var(--line)",
        gap: 10,
      }}
    >
      <span style={{ color: "var(--steel)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 700, textAlign: "end" }}>{value}</span>
    </div>
  );
}
