import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { ROLES } from "../lib/roles";

const ROLE_LABELS = {
  [ROLES.ADMIN]: "أدمن",
  [ROLES.SUPERVISOR]: "مشرف الموقع",
  [ROLES.VERIFIED_TRADER]: "تاجر موثق",
  [ROLES.TRADER]: "تاجر غير موثق",
  [ROLES.DRIVER_KABBASH]: "سائق الكباش",
  [ROLES.DRIVER_CRAWLER_CRANE]: "سائق الرافعة المجنزرة",
  [ROLES.DRIVER_FORKLIFT]: "سائق الرافعة الشوكية",
};

export default function Profile() {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>حسابي</h1>

      <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 18, marginBottom: 20 }}>
        <Row label="الاسم" value={profile?.name || "—"} />
        <Row label="البريد الإلكتروني" value={user?.email} />
        <Row label="نوع الحساب" value={ROLE_LABELS[role] || "—"} />
      </div>

      <div style={{ background: "var(--paper-raised)", border: "1px solid var(--danger)", borderRadius: "var(--radius)", padding: 18 }}>
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>حذف الحساب</p>
        <p style={{ fontSize: 12, color: "var(--steel)", marginBottom: 12 }}>
          حذف حسابك نهائي وسيؤدي لمسح بياناتك بالكامل من الموقع، ولا يمكن التراجع عنه.
        </p>

        {!confirming ? (
          <button className="btn" style={{ borderColor: "var(--danger)", color: "var(--danger)" }} onClick={() => setConfirming(true)}>
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

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, borderBottom: "1px solid var(--line)" }}>
      <span style={{ color: "var(--steel)" }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}
