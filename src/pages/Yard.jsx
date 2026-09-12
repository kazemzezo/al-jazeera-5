import { useEffect, useState } from "react";
import { LOCATIONS } from "../lib/catalog";
import { subscribeActiveAds } from "../lib/ads";
import AdCard from "../components/AdCard";

export default function Yard() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

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

  const displayed = ads.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const counts = {
    all: ads.length,
    active: ads.filter((a) => a.status === "active").length,
    partial: ads.filter((a) => a.status === "partial").length,
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>
          ساحة الجزيره
        </h1>
        <p style={{ fontSize: 13, color: "var(--steel)", margin: 0 }}>
          إعلانات الخردة المتاحة في ساحة الجزيره.
        </p>
      </div>

      {/* فلاتر */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {[
          { k: "all", label: "الكل", n: counts.all },
          { k: "active", label: "متاح", n: counts.active },
          { k: "partial", label: "متاح جزئياً", n: counts.partial },
        ].map((s) => (
          <button
            key={s.k}
            className="btn"
            style={{
              fontSize: 12,
              padding: "5px 12px",
              background: filter === s.k ? "var(--kabbash)" : "transparent",
              color: filter === s.k ? "#fff" : "var(--ink)",
              borderColor: filter === s.k ? "var(--kabbash)" : "var(--line)",
            }}
            onClick={() => setFilter(s.k)}
          >
            {s.label} ({s.n})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loading">جاري التحميل...</div>
      ) : displayed.length === 0 ? (
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
          <p style={{ fontSize: 13, color: "var(--steel)", margin: 0 }}>
            هيتم إضافة إعلانات جديدة قريباً.
          </p>
        </div>
      ) : (
        <div className="ad-grid">
          {displayed.map((ad) => (
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
