import { useEffect, useState } from "react";
import { LOCATIONS } from "../lib/catalog";
import { subscribeActiveAds } from "../lib/ads";
import AdCard from "../components/AdCard";

export default function Yard() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeActiveAds(
      (items) => {
        setAds(items.filter((a) => a.location === LOCATIONS.YARD));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>
          ساحة الجزيره
        </h1>
        <p style={{ fontSize: 13, color: "var(--steel)", margin: 0 }}>
          الأصناف المتاحة في ساحة الجزيره.
        </p>
      </div>

      <div
        style={{
          background: "var(--crane-light)",
          border: "1px solid var(--crane)",
          borderRadius: "var(--radius)",
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        ⚙️ نظام المخزون الكامل للساحة هيتفعّل في التحديث القادم. حالياً بيعرض
        الإعلانات اللي عليها قسم "ساحة الجزيره".
      </div>

      {loading ? (
        <div className="page-loading">جاري التحميل...</div>
      ) : ads.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            background: "var(--paper-raised)",
            border: "1px dashed var(--line-strong)",
            borderRadius: 12,
          }}
        >
          <p style={{ fontSize: 42, margin: 0 }}>🏭</p>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: "10px 0 4px",
            }}
          >
            لا توجد إعلانات حالياً
          </p>
        </div>
      ) : (
        <div className="ad-grid">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}

      <style>{`
        .ad-grid {
          columns: 3;
          column-gap: 14px;
        }
        @media (max-width: 900px) {
          .ad-grid { columns: 2; }
        }
        @media (max-width: 500px) {
          .ad-grid { columns: 1; }
        }
      `}</style>
    </div>
  );
}
