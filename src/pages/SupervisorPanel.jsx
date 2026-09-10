export default function SupervisorPanel() {
  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--steel-light)", marginBottom: 8 }}>
        شكل مبدئي (ديمو) للوحة المشرف.
      </p>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>
        لوحة الإشراف
      </h1>
      <p style={{ fontSize: 13, color: "var(--steel)", marginBottom: 20 }}>
        من هنا تقدر تضيف أصناف الرصيف البحري اليومية، تنشر إعلانات على
        الصفحة الرئيسية، وتدير حسابات سائقي المعدات الثلاثة.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="sup-card">
          <p style={{ fontWeight: 700, margin: "0 0 4px", fontSize: 14 }}>إضافة أصناف وإعلانات</p>
          <p style={{ fontSize: 12, color: "var(--steel)", margin: 0 }}>
            متاحة فعليًا من الصفحة الرئيسية - تبويب الرصيف البحري.
          </p>
        </div>
        <div className="sup-card">
          <p style={{ fontWeight: 700, margin: "0 0 4px", fontSize: 14 }}>سائقو المعدات</p>
          <p style={{ fontSize: 12, color: "var(--steel)", margin: 0 }}>
            الكباش · رافعه مجنزره 30 طن · رافعه شوكيه 11 طن — تعليق / حذف /
            تجديد الحساب (قادم).
          </p>
        </div>
      </div>

      <style>{`
        .sup-card {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 14px 16px;
        }
      `}</style>
    </div>
  );
}
