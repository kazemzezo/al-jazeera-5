import { useNavigate } from "react-router-dom";
import { LOCATIONS } from "../lib/catalog";
import { AD_STATUS, AD_STATUS_LABELS, getAdTotal, getAvailableItems } from "../lib/ads";

export default function AdCard({ ad }) {
  const navigate = useNavigate();

  const total = getAdTotal(ad);
  const available = getAvailableItems(ad);
  const totalAvailableTons = available.reduce(
    (s, it) => s + Number(it.available || 0),
    0
  );
  const categories = (ad.items || []).map((it) => it.category).join(" · ");
  const soldOut = ad.status === AD_STATUS.SOLD_OUT || ad.status === AD_STATUS.CLOSED;

  const locationLabel =
    ad.location === LOCATIONS.DOCK ? "الرصيف البحري" : "ساحة الجزيره";

  return (
    <div
      className="ad-card"
      onClick={() => navigate(`/ads/${ad.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/ads/${ad.id}`);
      }}
    >
      <div className="ad-card-image">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            loading="lazy"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.classList.add("ad-card-image-fallback");
              e.target.parentElement.innerHTML = "📦";
            }}
          />
        ) : (
          <div className="ad-card-image-fallback">📦</div>
        )}
        <span className="ad-card-location">{locationLabel}</span>
        {soldOut && (
          <span className="ad-card-soldout">
            {ad.status === AD_STATUS.SOLD_OUT
              ? "تم البيع"
              : AD_STATUS_LABELS[AD_STATUS.CLOSED]}
          </span>
        )}
      </div>

      <div className="ad-card-body">
        <h3 className="ad-card-title">{ad.title}</h3>
        {categories && (
          <p className="ad-card-categories">{categories}</p>
        )}

        <div className="ad-card-footer">
          {!soldOut && totalAvailableTons > 0 && (
            <span className="ad-card-available">
              {totalAvailableTons.toLocaleString("ar-EG")} طن متاح
            </span>
          )}
          {soldOut && <span className="ad-card-soldout-text">غير متاح</span>}
          <span className="ad-card-price">
            {total.toLocaleString("ar-EG")}ج
          </span>
        </div>
      </div>

      <style>{`
        .ad-card {
          break-inside: avoid;
          margin-bottom: 12px;
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .ad-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }
        .ad-card:focus-visible {
          outline: 2px solid var(--crane);
          outline-offset: 2px;
        }

        .ad-card-image {
          position: relative;
          background: var(--paper-sunken);
          min-height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .ad-card-image img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }
        .ad-card-image-fallback {
          font-size: 46px;
          color: var(--steel-light);
          padding: 30px 0;
          width: 100%;
          text-align: center;
        }
        .ad-card-location {
          position: absolute;
          top: 8px;
          inset-inline-start: 8px;
          background: rgba(0,0,0,0.6);
          color: #fff;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 999px;
          font-weight: 600;
        }
        .ad-card-soldout {
          position: absolute;
          inset: 0;
          background: rgba(163, 52, 47, 0.75);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .ad-card-body {
          padding: 10px 12px 12px;
        }
        .ad-card-title {
          margin: 0 0 4px;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.4;
        }
        .ad-card-categories {
          margin: 0 0 8px;
          font-size: 11.5px;
          color: var(--steel);
          line-height: 1.5;
        }
        .ad-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
        }
        .ad-card-available {
          color: var(--kabbash);
          font-weight: 700;
        }
        .ad-card-soldout-text {
          color: var(--danger);
          font-weight: 700;
        }
        .ad-card-price {
          font-weight: 900;
          color: var(--ink);
        }
      `}</style>
    </div>
  );
}
