import { useEffect, useState } from "react";

export default function Experimental() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/al-jazeera-5/scraped-prices.json")
      .then((res) => {
        if (!res.ok) throw new Error("الملف مش موجود");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("مفيش بيانات لسه — السكربت لسه ما اشتغلش");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="page-loading">جاري التحميل...</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* بانر تجريبي */}
      <div
        style={{
          background: "var(--crane-light)",
          border: "2px solid var(--crane)",
          borderRadius: "var(--radius-lg)",
          padding: "14px 18px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 24 }}>🧪</span>
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 900,
              color: "var(--crane)",
            }}
          >
            صفحة تجريبية — أسعار الخردة الآلية
          </h2>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.7,
            color: "var(--ink)",
          }}
        >
          الصفحة دي بتعرض أسعار خردة مسحوبة آلياً من مصادر مصرية. البيانات
          للتجربة فقط — بنراقبها شهر، ولو شغالة كويس هنضمّها للتطبيق
          الرئيسي.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: "var(--danger-light)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius)",
            padding: 20,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 40, margin: 0 }}>⏳</p>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: "10px 0 6px",
              color: "var(--danger)",
            }}
          >
            {error}
          </p>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--steel)",
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            السكربت بيشتغل مرة واحدة كل يوم. لو لسه مشتغلش، الأرقام هتظهر
            بكرة الصبح.
          </p>
        </div>
      )}

      {data && (
        <>
          <div
            style={{
              background: "var(--paper-raised)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
              padding: 14,
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--steel)",
                  marginBottom: 4,
                }}
              >
                📅 آخر تحديث
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {new Date(data.lastUpdate).toLocaleString("ar-EG", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </div>
            </div>
            <div style={{ textAlign: "end" }}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--steel)",
                  marginBottom: 4,
                }}
              >
                📡 المصدر
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {data.source}
              </div>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                background:
                  data.status === "success"
                    ? "var(--kabbash-light)"
                    : "var(--crane-light)",
                color:
                  data.status === "success"
                    ? "var(--kabbash)"
                    : "var(--crane)",
              }}
            >
              {data.status === "success" ? "✅ ناجح" : "⚠️ احتياطي"}
            </span>
          </div>

          <div
            style={{
              background: "var(--paper-raised)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--paper-sunken)",
                    textAlign: "start",
                  }}
                >
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "start",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--steel)",
                      borderBottom: "2px solid var(--line)",
                    }}
                  >
                    الخامة
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "end",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--steel)",
                      borderBottom: "2px solid var(--line)",
                    }}
                  >
                    السعر
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.prices.map((p, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom:
                        i < data.prices.length - 1
                          ? "1px solid var(--line)"
                          : "none",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontWeight: 600,
                      }}
                    >
                      {p.material}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "end",
                        fontWeight: 900,
                        color: "var(--kabbash)",
                        fontSize: 15,
                      }}
                    >
                      {Number(p.price).toLocaleString("ar-EG")}{" "}
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--steel)",
                          fontWeight: 500,
                        }}
                      >
                        {p.unit}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p
            style={{
              fontSize: 11.5,
              color: "var(--steel-light)",
              marginTop: 14,
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            ⓘ الأسعار دي مسحوبة آلياً ومش مراجَعة. متستخدمهاش في أي قرار
            تجاري حقيقي قبل ما تتأكد من المصدر الرسمي.
          </p>
        </>
      )}
    </div>
  );
}
