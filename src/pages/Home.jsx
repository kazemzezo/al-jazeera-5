import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LOCATIONS } from "../lib/catalog";
import { subscribeActiveAds, AD_STATUS } from "../lib/ads";
import PriceBar from "../components/PriceBar";
import AnnouncementBanner from "../components/AnnouncementBanner";
import AdCard from "../components/AdCard";

export default function Home() {
  const [location, setLocation] = useState("all");
  const [allAds, setAllAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeActiveAds(
      (items) => {
        setAllAds(items);
        setLoading(false);
      },
      (err) => {
        console.error("فشل تحميل الإعلانات:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const displayed = useMemo(() => {
    if (location === "all") return allAds;
    return allAds.filter((a) => a.location === location);
  }, [allAds, location]);

  const dockCount = allAds.filter((a) => a.location === LOCATIONS.DOCK).length;
  const yardCount = allAds.filter((a) => a.location === LOCATIONS.YARD).length;

  return (
    <div>
      <PriceBar />
      <AnnouncementBanner location={location === "all" ? LOCATIONS.DOCK : location} />

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <FilterBtn
          active={location === "all"}
          onClick={() => setLocation("all")}
        >
          الكل ({allAds.length})
        </FilterBtn>
        <FilterBtn
          active={location === LOCATIONS.DOCK}
          onClick={() => setLocation(LOCATIONS.DOCK)}
        >
          الرصيف البحري ({dockCount})
        </FilterBtn>
        <FilterBtn
          active={location === LOCATIONS.YARD}
          onClick={() => setLocation(LOCATIONS.YARD)}
        >
          ساحة الجزيره ({yardCount})
        </FilterBtn>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 14,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 900,
            margin: 0,
          }}
        >
          الإعلانات المتاحة
        </h1>
        {location !== "all" && (
          <Link
            to={location === LOCATIONS.DOCK ? "/dock" : "/yard"}
            style={{
              fontSize: 13,
              color: "var(--kabbash)",
              fontWeight: 700,
              textDecoration: "underline",
            }}
          >
            عرض الصفحة الكاملة ←
          </Link>
        )}
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
          <p style={{ fontSize: 42, margin: 0 }}>📭</p>
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
            {location === "all"
              ? "هيتم إضافة إعلانات جديدة قريباً."
              : "هيتم إضافة إعلانات في هذا القسم قريباً."}
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

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      className="btn"
      style={{
        fontSize: 13,
        padding: "7px 14px",
        background: active ? "var(--kabbash)" : "transparent",
        color: active ? "#fff" : "var(--ink)",
        borderColor: active ? "var(--kabbash)" : "var(--line)",
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
