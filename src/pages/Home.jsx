import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/roles";
import { requestVerification } from "../lib/verification";

export default function Home() {
  const { user, profile, role } = useAuth();
  const [sent, setSent] = useState(false);

  const isUnverifiedTrader = role === ROLES.TRADER;

  async function handleRequest() {
    await requestVerification(user, profile);
    setSent(true);
  }

  return (
    <div>
      {isUnverifiedTrader && (
        <div
          style={{
            background: "var(--crane-light)",
            border: "1px solid var(--crane)",
            borderRadius: "var(--radius)",
            padding: "14px 16px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 14 }}>
            حسابك غير موثق حاليًا، يمكنك استخدام أدوات الحساب للاطلاع فقط. للحجز
            والشراء، تواصل مع إدارة الموقع للتوثيق.
          </span>
          <button className="btn" onClick={handleRequest} disabled={sent}>
            {sent ? "تم إرسال الطلب" : "طلب التوثيق الآن"}
          </button>
        </div>
      )}

      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>
        الرصيف البحري وساحة الجزيره
      </h1>
      <p style={{ color: "var(--steel)", fontSize: 14 }}>
        صفحة عرض الأصناف (الرصيف البحري / ساحة الجزيره) ستُبنى في المرحلة
        القادمة. الهيكل الأساسي وتسجيل الدخول والصلاحيات جاهزون الآن.
      </p>
    </div>
  );
}
