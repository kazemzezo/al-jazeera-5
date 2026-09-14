import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeActiveAds, getAvailableItems } from "../lib/ads";
import { LOCATIONS, SALE_TYPE_UNIT } from "../lib/catalog";

export default function RelatedAds({ currentAd, limit = 4 }) {
  const navigate = useNavigate();
  const [allAds, setAllAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeActiveAds(
      (items) => {
        setAllAds(items);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ============ اقتراح الإعلانات ============
  const related = useMemo(() => {
    if (!currentAd || allAds.length === 0) return [];

    // أصناف الإعلان الحالي
    const currentCategories = (currentAd.items || []).map((it) =>
      (it.category || "").toLowerCase()
    );

    // استبعد الإعلان الحالي
    const others = allAds.filter((a) => a.id !== currentAd.id);

    // احسب نقاط التشابه لكل إعلان
    const scored = others.map((ad) => {
      let score = 0;

      // 1. نفس الموقع (رصيف/ساحة) — وزن 3
      if (ad.location === currentAd.location) score += 3;

      // 2. أصناف مشتركة — وزن 5 لكل صنف
      const adCategories = (ad.items || []).map((it) =>
        (it.category || "").toLowerCase()
      );
      const commonCategories = adCategories.filter((c) =>
        currentCategories.includes(c)
      );
      score += commonCategories.length * 5;

      return { ad, score };
    });

    // رتب بالأعلى نقاط
    scored.sort((a, b) => b.score - a.score);

    // رجع أول `limit` نتائج
    return scored.slice(0, limit).map((s) => s.ad);
  }, [allAds, currentAd, limit]);

  if (loading || related.length === 0) return null;

  return (
    <div className="related-ads">
      <h3 className="related-ads-title">
        <span>🎯</span> إعلانات مقترحة لك
      </h3>

      <div className="related-ads-grid">
        {related.map((ad) => (
          <MiniAdCard
            key={ad.id}
            ad={ad}
            onClick={() => {
              navigate(`/ads/${ad.id}`);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ))}
      </div>

      <style>{`
        .related-ads {
          margin-top: 24px;
          padding: 18px 0 8px;
          border-top: 2px dashed var(--line);
        }
        .related-ads-title {
          font-size: 15px;
          font-weight: 900;
          margin: 0 0 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ink);
        }

        .related-ads-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .related-ads-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================
   كارت إعلان مصغّر
   ============================================ */
function MiniAdCard({ ad, onClick }) {
  const available = getAvailableItems(ad);
  const firstType = ad.items?.[0]?.saleType || "ton";
  const unit = SALE_TYPE_UNIT[firstType] || "طن";

  // إجمالي المتاح (بالوحدة)
  const totalAvail = available.reduce(
    (s, it) => s + Number(it.available || 0),
    0
  );

  const locationLabel =
    ad.location === LOCATIONS.DOCK ? "الرصيف" : "الساحة";

  return (
    <button type="button" className="mini-ad-card" onClick={onClick}>
      <div className="mini-ad-image">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            loading="lazy"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.textContent = "📦";
            }}
          />
        ) : (
          "📦"
        )}
        <span className="mini-ad-location">{locationLabel}</span>
      </div>

      <div className="mini-ad-body">
        <p className="mini-ad-title">{ad.title || "بدون عنوان"}</p>
        <p className="mini-ad-available">
          {totalAvail > 0
            ? `${totalAvail.toLocaleString("ar-EG")} ${unit} متاح`
            : "غير متاح"}
        </p>
      </div>

      <style>{`
        .mini-ad-card {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          text-align: start;
          font-family: inherit;
          color: var(--ink);
          padding: 0;
          transition: transform .2s, box-shadow .2s, border-color .2s;
          display: flex;
          flex-direction: column;
        }
        .mini-ad-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
          border-color: var(--kabbash);
        }
        .mini-ad-card:focus-visible {
          outline: 2px solid var(--crane);
          outline-offset: 2px;
        }

        .mini-ad-image {
          position: relative;
          background: var(--paper-sunken);
          height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: var(--steel-light);
          overflow: hidden;
        }
        .mini-ad-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .mini-ad-location {
          position: absolute;
          top: 6px;
          inset-inline-start: 6px;
          background: rgba(0,0,0,0.65);
          color: #fff;
          font-size: 9.5px;
          padding: 2px 6px;
          border-radius: 999px;
          font-weight: 700;
        }

        .mini-ad-body {
          padding: 8px 10px 10px;
        }
        .mini-ad-title {
          font-size: 12px;
          font-weight: 800;
          margin: 0 0 3px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 34px;
        }
        .mini-ad-available {
          font-size: 10.5px;
          color: var(--kabbash);
          font-weight: 700;
          margin: 0;
        }
      `}</style>
    </button>
  );
}
