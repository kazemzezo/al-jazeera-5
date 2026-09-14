import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeAllAds, AD_STATUS, AD_STATUS_LABELS } from "../lib/ads";
import { LOCATIONS, SALE_TYPE_UNIT } from "../lib/catalog";

export default function GlobalSearch({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [allAds, setAllAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // تحميل كل الإعلانات مرة واحدة (لما يفتح)
  useEffect(() => {
    if (!open) return;
    const unsub = subscribeAllAds(
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
  }, [open]);

  // ركّز على الـ input لما يفتح
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // إغلاق بـ ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // قفل تمرير الصفحة لما يفتح
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // نتائج البحث
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return allAds
      .filter((ad) => {
        // بحث في العنوان
        if ((ad.title || "").toLowerCase().includes(q)) return true;
        // بحث في الوصف
        if ((ad.description || "").toLowerCase().includes(q)) return true;
        // بحث في الأصناف
        if (
          (ad.items || []).some((it) =>
            (it.category || "").toLowerCase().includes(q)
          )
        )
          return true;
        return false;
      })
      .slice(0, 10); // أول 10 نتايج بس
  }, [allAds, query]);

  function handleSelect(ad) {
    onClose();
    navigate(`/ads/${ad.id}`);
    setQuery("");
  }

  function handleClear() {
    setQuery("");
    inputRef.current?.focus();
  }

  if (!open) return null;

  return (
    <div className="gs-backdrop" onClick={onClose}>
      <div className="gs-modal" onClick={(e) => e.stopPropagation()}>
        {/* مربع البحث */}
        <div className="gs-header">
          <div className="gs-search-box">
            <span className="gs-icon">🔍</span>
            <input
              ref={inputRef}
              className="gs-input"
              type="text"
              placeholder="ابحث عن صنف، إعلان، أو كلمة..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="gs-clear"
                onClick={handleClear}
                aria-label="مسح"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            className="gs-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            إلغاء
          </button>
        </div>

        {/* النتائج */}
        <div className="gs-results">
          {!query.trim() ? (
            <div className="gs-empty">
              <p className="gs-empty-icon">💡</p>
              <p className="gs-empty-title">ابدأ الكتابة للبحث</p>
              <p className="gs-empty-hint">
                ابحث بالصنف (حديد، نحاس...)، بالعنوان، أو بكلمة من الوصف.
              </p>
            </div>
          ) : loading ? (
            <div className="gs-empty">
              <p className="gs-empty-hint">جاري البحث...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="gs-empty">
              <p className="gs-empty-icon">🔍</p>
              <p className="gs-empty-title">لا توجد نتائج</p>
              <p className="gs-empty-hint">
                جرب كلمة مختلفة أو ابحث باسم صنف.
              </p>
            </div>
          ) : (
            <>
              <p className="gs-count">
                {results.length} نتيجة
                {results.length === 10 ? " (الأولى)" : ""}
              </p>
              <div className="gs-list">
                {results.map((ad) => (
                  <ResultRow
                    key={ad.id}
                    ad={ad}
                    query={query}
                    onClick={() => handleSelect(ad)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .gs-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 18, 16, 0.7);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 100;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 20px 16px;
          animation: gs-fade .2s ease;
        }
        @keyframes gs-fade {
          from { opacity: 0 }
          to { opacity: 1 }
        }

        .gs-modal {
          background: var(--paper-raised);
          color: var(--ink);
          border-radius: 16px;
          width: 100%;
          max-width: 620px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
          animation: gs-pop .25s cubic-bezier(0.22, 0.61, 0.36, 1);
          max-height: calc(100vh - 40px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-top: 8vh;
        }
        @keyframes gs-pop {
          from { transform: translateY(-12px) scale(0.98); opacity: 0 }
          to { transform: translateY(0) scale(1); opacity: 1 }
        }

        .gs-header {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
          flex-shrink: 0;
        }
        .gs-search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--paper-sunken);
          border: 1.5px solid var(--line);
          border-radius: 12px;
          padding: 10px 14px;
          transition: border-color .2s, box-shadow .2s;
        }
        .gs-search-box:focus-within {
          border-color: var(--kabbash);
          box-shadow: 0 0 0 3px var(--kabbash-light);
        }
        .gs-icon {
          font-size: 16px;
          flex-shrink: 0;
        }
        .gs-input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          color: var(--ink);
          font-family: inherit;
          font-size: 15px;
        }
        .gs-input::placeholder {
          color: var(--steel-light);
        }
        .gs-clear {
          background: var(--line);
          border: none;
          color: var(--steel);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background .2s;
        }
        .gs-clear:hover {
          background: var(--line-strong);
        }
        .gs-close {
          background: transparent;
          border: none;
          color: var(--steel);
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          padding: 6px 4px;
          font-family: inherit;
          flex-shrink: 0;
        }
        .gs-close:hover {
          color: var(--danger);
        }

        .gs-results {
          flex: 1;
          overflow-y: auto;
          padding: 12px 8px;
        }

        .gs-empty {
          text-align: center;
          padding: 40px 20px;
        }
        .gs-empty-icon {
          font-size: 40px;
          margin: 0 0 12px;
        }
        .gs-empty-title {
          font-size: 15px;
          font-weight: 800;
          margin: 0 0 6px;
        }
        .gs-empty-hint {
          font-size: 12.5px;
          color: var(--steel);
          margin: 0;
          line-height: 1.7;
        }

        .gs-count {
          font-size: 11.5px;
          color: var(--steel-light);
          margin: 0 8px 8px;
          font-weight: 700;
        }

        .gs-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .gs-row {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: background .15s;
          border: 1px solid transparent;
        }
        .gs-row:hover,
        .gs-row:focus {
          background: var(--paper-sunken);
          border-color: var(--line);
          outline: none;
        }

        .gs-row-image {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          background: var(--paper-sunken);
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }
        .gs-row-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gs-row-body {
          flex: 1;
          min-width: 0;
        }
        .gs-row-title {
          font-size: 13.5px;
          font-weight: 800;
          margin: 0 0 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .gs-row-title mark {
          background: var(--crane-light);
          color: var(--crane);
          padding: 0 2px;
          border-radius: 3px;
        }
        .gs-row-sub {
          font-size: 11.5px;
          color: var(--steel);
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .gs-row-badge {
          display: inline-flex;
          align-items: center;
          padding: 1px 7px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          background: var(--paper-sunken);
          color: var(--steel);
        }

        @media (max-width: 600px) {
          .gs-backdrop {
            padding: 12px 8px;
          }
          .gs-modal {
            margin-top: 4vh;
            max-height: calc(100vh - 24px);
            border-radius: 14px;
          }
          .gs-header {
            padding: 10px 12px;
            gap: 6px;
          }
          .gs-search-box {
            padding: 8px 12px;
          }
          .gs-input {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================
   صف نتيجة بحث
   ============================================ */
function ResultRow({ ad, query, onClick }) {
  const locationLabel =
    ad.location === LOCATIONS.DOCK ? "الرصيف" : "الساحة";

  // عدد الأصناف
  const itemsCount = ad.items?.length || 0;

  // الوحدة الأساسية
  const firstType = ad.items?.[0]?.saleType || "ton";
  const unit = SALE_TYPE_UNIT[firstType] || "طن";

  return (
    <button type="button" className="gs-row" onClick={onClick}>
      <div className="gs-row-image">
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
      </div>
      <div className="gs-row-body">
        <p className="gs-row-title">
          <Highlight text={ad.title || "بدون عنوان"} query={query} />
        </p>
        <div className="gs-row-sub">
          <span className="gs-row-badge">{locationLabel}</span>
          <span>
            {itemsCount} {itemsCount === 1 ? "صنف" : "أصناف"}
          </span>
          {ad.status && (
            <span>{AD_STATUS_LABELS[ad.status] || ad.status}</span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ============================================
   تمييز كلمة البحث في النص
   ============================================ */
function Highlight({ text, query }) {
  if (!query?.trim()) return text;
  const q = query.trim();
  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + q.length);
  const after = text.slice(index + q.length);

  return (
    <>
      {before}
      <mark>{match}</mark>
      {after}
    </>
  );
}
