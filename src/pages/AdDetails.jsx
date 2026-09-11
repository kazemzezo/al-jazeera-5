import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  subscribeAd,
  AD_STATUS,
  AD_STATUS_LABELS,
  getAdTotal,
  getAvailableItems,
  isAdReservable,
} from "../lib/ads";
import { LOCATIONS } from "../lib/catalog";
import { useAuth } from "../context/AuthContext";
import { useGuestPrompt } from "../context/GuestPromptContext";
import { canReserve as canReserveRole } from "../lib/roles";

export default function AdDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, profile } = useAuth();
  const { promptLogin, promptVerification } = useGuestPrompt();

  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const unsub = subscribeAd(
      id,
      (data) => {
        setAd(data);
        setLoading(false);
        if (!data) setNotFound(true);
      },
      (err) => {
        console.error("فشل تحميل الإعلان:", err);
        setLoading(false);
        setNotFound(true);
      }
    );
    return () => unsub();
  }, [id]);

  function handleReserve() {
    if (!user) {
      promptLogin("سجّل دخولك الأول عشان تقدر تحجز");
      return;
    }
    if (!canReserveRole(role)) {
      promptVerification("لإتمام الحجز، لازم توثق حسابك أولاً.");
      return;
    }
    // ⏳ سيتم تفعيل نموذج الحجز في التحديث القادم
    alert(
      "شكراً لك! نظام الحجز التفاعلي هيتفعّل في التحديث القادم. حالياً تقدر تشوف تفاصيل الإعلان."
    );
  }

  if (loading) {
    return (
      <div className="page-loading">جاري تحميل الإعلان...</div>
    );
  }

  if (notFound || !ad) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p style={{ fontSize: 42, margin: 0 }}>🔍</p>
        <p style={{ fontSize: 16, fontWeight: 700, margin: "12px 0 6px" }}>
          الإعلان غير موجود
        </p>
        <p style={{ fontSize: 13, color: "var(--steel)", marginBottom: 20 }}>
          يمكن أن يكون محذوفاً أو الرابط غير صحيح.
        </p>
        <button className="btn" onClick={() => navigate("/")}>
          عودة للرئيسية
        </button>
      </div>
    );
  }

  const total = getAdTotal(ad);
  const available = getAvailableItems(ad);
  const reservable = isAdReservable(ad);
  const locationLabel =
    ad.location === LOCATIONS.DOCK ? "الرصيف البحري" : "ساحة الجزيره";
  const dateLabel =
    ad.createdAt?.toDate?.().toLocaleDateString("ar-EG") || "—";

  return (
    <div className="ad-details">
      <button
        className="btn"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16, fontSize: 13 }}
      >
        ← رجوع
      </button>

      <div className="ad-details-card">
        {ad.imageUrl ? (
          <div className="ad-details-image">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="ad-details-image-fallback">📦</div>
        )}

        <div className="ad-details-body">
          <div className="ad-details-meta">
            <span className="ad-details-badge">{locationLabel}</span>
            <span className="ad-details-date">📅 {dateLabel}</span>
            <span
              className={
                "ad-details-status status-" + ad.status
              }
            >
              {AD_STATUS_LABELS[ad.status]}
            </span>
          </div>

          <h1 className="ad-details-title">{ad.title}</h1>

          {ad.description && (
            <p className="ad-details-description">{ad.description}</p>
          )}

          <h3 className="ad-details-subtitle">الأصناف المتاحة</h3>
          <div className="ad-details-items">
            {(ad.items || []).map((it, i) => {
              const avail =
                Number(it.qty || 0) - Number(it.reservedQty || 0);
              const itemTotal = Number(it.qty) * Number(it.unitPrice);
              const soldOut = avail <= 0;
              return (
                <div
                  key={i}
                  className={
                    "ad-details-item" + (soldOut ? " item-soldout" : "")
                  }
                >
                  <div className="item-info">
                    <span className="item-category">{it.category}</span>
                    <span className="item-available">
                      {soldOut
                        ? "نفذت الكمية"
                        : `متاح: ${avail} من ${it.qty} طن`}
                    </span>
                  </div>
                  <div className="item-price">
                    <span className="item-unit">
                      {Number(it.unitPrice).toLocaleString("ar-EG")}ج/طن
                    </span>
                    <span className="item-total">
                      {itemTotal.toLocaleString("ar-EG")}ج
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ad-details-total">
            <span>الإجمالي</span>
            <span className="ad-details-total-value">
              {total.toLocaleString("ar-EG")}ج
            </span>
          </div>

          {reservable && available.length > 0 ? (
            <button
              className="btn btn-primary ad-details-cta"
              onClick={handleReserve}
            >
              احجز الآن
            </button>
          ) : (
            <button
              className="btn ad-details-cta"
              disabled
              style={{ opacity: 0.6, cursor: "not-allowed" }}
            >
              {ad.status === AD_STATUS.CLOSED
                ? "تم الغلق من الإدارة"
                : "تم البيع"}
            </button>
          )}

          {user && !canReserveRole(role) && reservable && (
            <p className="ad-details-note">
              حسابك غير موثق — أرسل طلب توثيق عشان تقدر تحجز.
            </p>
          )}
        </div>
      </div>

      <style>{`
        .ad-details {
          max-width: 760px;
          margin: 0 auto;
        }
        .ad-details-card {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: 16px;
          overflow: hidden;
        }
        .ad-details-image {
          background: var(--paper-sunken);
          max-height: 380px;
          overflow: hidden;
        }
        .ad-details-image img {
          width: 100%;
          height: auto;
          display: block;
        }
        .ad-details-image-fallback {
          background: var(--paper-sunken);
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
          color: var(--steel-light);
        }
        .ad-details-body {
          padding: 22px;
        }
        .ad-details-meta {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 10px;
          font-size: 12.5px;
        }
        .ad-details-badge {
          background: var(--kabbash-light);
          color: var(--kabbash);
          padding: 3px 10px;
          border-radius: 999px;
          font-weight: 700;
        }
        .ad-details-date {
          color: var(--steel);
        }
        .ad-details-status {
          padding: 3px 10px;
          border-radius: 999px;
          font-weight: 700;
          margin-inline-start: auto;
        }
        .status-active {
          background: var(--kabbash-light);
          color: var(--kabbash);
        }
        .status-partial {
          background: var(--crane-light);
          color: var(--crane);
        }
        .status-sold_out {
          background: var(--paper-sunken);
          color: var(--steel);
        }
        .status-closed {
          background: var(--danger-light);
          color: var(--danger);
        }
        .ad-details-title {
          margin: 0 0 10px;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.3;
        }
        .ad-details-description {
          margin: 0 0 20px;
          font-size: 14px;
          color: var(--steel);
          line-height: 1.8;
        }
        .ad-details-subtitle {
          margin: 18px 0 10px;
          font-size: 14px;
          font-weight: 800;
          color: var(--ink);
        }
        .ad-details-items {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ad-details-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: var(--paper-sunken);
          border-radius: 10px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ad-details-item.item-soldout {
          opacity: 0.55;
        }
        .item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 120px;
        }
        .item-category {
          font-weight: 700;
          font-size: 14px;
        }
        .item-available {
          font-size: 12px;
          color: var(--steel);
        }
        .item-price {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: end;
        }
        .item-unit {
          font-size: 12px;
          color: var(--steel);
        }
        .item-total {
          font-weight: 800;
          font-size: 14px;
        }
        .ad-details-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0;
          margin-top: 14px;
          border-top: 2px solid var(--ink);
          font-size: 16px;
          font-weight: 700;
        }
        .ad-details-total-value {
          font-size: 22px;
          font-weight: 900;
        }
        .ad-details-cta {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          font-size: 15px;
        }
        .ad-details-note {
          margin: 10px 0 0;
          font-size: 12.5px;
          color: var(--danger);
          text-align: center;
          line-height: 1.7;
        }
      `}</style>
    </div>
  );
}
