import { useState } from "react";

export default function DriverPanel() {
  const [inService, setInService] = useState(true);

  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--steel-light)", marginBottom: 8 }}>
        شكل مبدئي (ديمو) لصفحة سائق المعدة.
      </p>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>
        حالة المعدة
      </h1>

      <div
        style={{
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          padding: 20,
          textAlign: "center",
          maxWidth: 320,
        }}
      >
        <p style={{ fontSize: 14, color: "var(--steel)", marginBottom: 12 }}>
          حالة المعدة الحالية
        </p>
        <p
          style={{
            fontSize: 18,
            fontWeight: 900,
            marginBottom: 16,
            color: inService ? "var(--kabbash)" : "var(--danger)",
          }}
        >
          {inService ? "متاحة بالخدمة" : "خارج الخدمة (صيانة)"}
        </p>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setInService(!inService)}>
          {inService ? "تعليق المعدة للصيانة" : "إعادة المعدة للخدمة"}
        </button>
      </div>
    </div>
  );
}
