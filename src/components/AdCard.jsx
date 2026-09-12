import { useNavigate } from "react-router-dom";
import { LOCATIONS, SALE_TYPES, SALE_TYPE_UNIT } from "../lib/catalog";
import {
  AD_STATUS,
  AD_STATUS_LABELS,
  AD_STATUS_COLORS,
  getAdTotal,
  getAvailableItems,
} from "../lib/ads";

export default function AdCard({ ad }) {
  const navigate = useNavigate();

  const total = getAdTotal(ad);
  const available = getAvailableItems(ad);

  const availableByType = available.reduce((acc, it) => {
    const type = it.saleType || SALE_TYPES.TON;
    acc[type] = (acc[type] || 0) + Number(it.available || 0);
    return acc;
  }, {});

  const categories = (ad.items || []).map((it) => it.category).join(" · ");

  // حالات
  const statusColors = AD_STATUS_COLORS[ad.status] || AD_STATUS_COLORS.active;
  const isReservable = [AD_STATUS.ACTIVE, AD_STATUS.PARTIAL].includes(ad.status);
  const isPulsing = [AD_STATUS.LOADING, AD_STATUS.INACTIVE].includes(ad.status);

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

        {/* شارة الحالة */}
        <span
          className={"ad-card-status" + (isPulsing ? " pulse" : "")}
          style={{
            background: statusColors.bg,
            boxShadow: `0 0 0 3px ${statusColors.light}`,
          }}
        >
          <span className="ad-card-status-dot" />
          {AD_STATUS_LABELS[ad.status] || ad.status}
        </span>
      </div>

      <div className="ad-card-body">
        <h3 className="ad-card-title">{ad.title}</h3>
        {categories && <p className="ad-card-categories">{categories}</p>}

        <div className="ad-card-footer">
          {isReservable && Object.keys(availableByType).length > 0 && (
            <span className="ad-card-available">
              {Object.entries(availableByType)
                .map(
                  ([type, qty]) =>
                    `${qty.toLocaleString("ar-EG")} ${
                      SALE_TYPE_UNIT[type] || "طن"
                    }`
                )
                .join(" · ")}{" "}
              متاح
            </span>
          )}
          {!isReservable && (
            <span
              className="ad-card-soldout-text"
              style={{ color: statusColors.bg }}
            >
              {AD_STATUS_LABELS[ad.status]}
            </span>
          )}
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
          position: relative;
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
        .ad-card-status {
          position: absolute;
          top: 8px;
          inset-inline-end: 8px;
          color: #fff;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 999px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: box-shadow .2s;
        }
        .ad-card-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
        }
        .ad-card-status.pulse {
          animation: ad-card-pulse 1.5s ease-in-out infinite;
        }
        @keyframes ad-card-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.75;
            transform: scale(0.97);
          }
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
          font-size: 12px;
          flex-wrap: wrap;
        }
        .ad-card-available {
          color: var(--kabbash);
          font-weight: 700;
        }
        .ad-card-soldout-text {
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
