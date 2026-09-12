import { useEffect, useMemo, useState } from "react";
import { LOCATIONS, SALE_TYPES, SALE_TYPES_LABELS, SALE_TYPE_UNIT } from "../lib/catalog";
import { createAd, updateAd } from "../lib/ads";
import { subscribeAllCategories } from "../lib/categories";
import { useAuth } from "../context/AuthContext";

export default function AddAdForm({ onClose, defaultLocation, ad }) {
  const { user } = useAuth();
  const isEdit = !!ad;

  const [title, setTitle] = useState(ad?.title || "");
  const [description, setDescription] = useState(ad?.description || "");
  const [imageUrl, setImageUrl] = useState(ad?.imageUrl || "");
  const [location, setLocation] = useState(
    ad?.location || defaultLocation || LOCATIONS.DOCK
  );
  const [items, setItems] = useState(() => {
    if (ad?.items && ad.items.length > 0) {
      return ad.items.map((it) => ({
        category: it.category,
        saleType: it.saleType || SALE_TYPES.TON,
        qty: String(it.qty ?? "1"),
        unitPrice: String(it.unitPrice ?? "0"),
        reservedQty: Number(it.reservedQty || 0),
      }));
    }
    return [];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // قراءة الأصناف من Firebase
  useEffect(() => {
    const unsub = subscribeAllCategories(
      (items) => {
        setCategories(items);
        setLoadingCats(false);
      },
      (err) => {
        console.error("فشل تحميل الأصناف:", err);
        setLoadingCats(false);
      }
    );
    return () => unsub();
  }, []);

  // الأصناف مفلترة حسب نوع البيع
  const categoriesByType = useMemo(() => {
    const map = {
      [SALE_TYPES.TON]: [],
      [SALE_TYPES.PIECE]: [],
      [SALE_TYPES.DEAL]: [],
    };
    categories.forEach((c) => {
      if (map[c.saleType]) map[c.saleType].push(c);
    });
    return map;
  }, [categories]);

  const used = items.map((i) => `${i.category}|${i.saleType}`);

  // إضافة صنف جديد (أول واحد متاح من أي نوع)
  function addItem() {
    const all = [
      ...categoriesByType[SALE_TYPES.TON],
      ...categoriesByType[SALE_TYPES.PIECE],
      ...categoriesByType[SALE_TYPES.DEAL],
    ];
    const firstFree = all.find(
      (c) => !used.includes(`${c.name}|${c.saleType}`)
    );
    if (!firstFree) return;

    setItems([
      ...items,
      {
        category: firstFree.name,
        saleType: firstFree.saleType,
        qty: "1",
        unitPrice: "0",
        reservedQty: 0,
      },
    ]);
  }

  function removeItem(idx) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx, field, value) {
    setItems(
      items.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    );
  }

  // لما تغيّر الصنف → نحدّث نوع البيع تلقائياً
  function changeCategory(idx, catName, catSaleType) {
    setItems(
      items.map((it, i) =>
        i === idx
          ? {
              ...it,
              category: catName,
              saleType: catSaleType,
              qty: catSaleType === SALE_TYPES.DEAL ? "1" : it.qty,
            }
          : it
      )
    );
  }

  const total = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("العنوان مطلوب");
    if (items.length === 0) return setError("أضف صنف واحد على الأقل");

    for (const it of items) {
      if (!it.category) return setError("اختار صنف لكل سطر");
      if (Number(it.qty) <= 0)
        return setError(`الكمية غير صحيحة في: ${it.category}`);
      if (Number(it.unitPrice) <= 0)
        return setError(`السعر غير صحيح في: ${it.category}`);

      if (isEdit && Number(it.qty) < Number(it.reservedQty || 0)) {
        return setError(
          `الكمية في "${it.category}" أقل من المحجوز (${it.reservedQty}). لازم تكون مساوية أو أكبر.`
        );
      }
    }

    const dups = used.filter((c, i) => used.indexOf(c) !== i);
    if (dups.length > 0) {
      const [name] = dups[0].split("|");
      return setError(`الصنف "${name}" مكرر`);
    }

    setSaving(true);
    try {
      const newItems = items.map((it) => ({
        category: it.category,
        saleType: it.saleType,
        qty: Number(it.qty),
        unitPrice: Number(it.unitPrice),
        reservedQty: Number(it.reservedQty || 0),
      }));

      if (isEdit) {
        await updateAd(
          ad.id,
          {
            title: title.trim(),
            description: description.trim(),
            imageUrl: imageUrl.trim(),
            location,
            items: newItems,
          },
          user.uid
        );
      } else {
        await createAd(
          {
            title,
            description,
            imageUrl,
            location,
            items: newItems,
          },
          user
        );
      }
      onClose();
    } catch (err) {
      console.error("تعذر حفظ الإعلان:", err);
      setError(
        err?.message
          ? `تعذر الحفظ: ${err.message}`
          : "تعذر حفظ الإعلان، حاول تاني"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adf-backdrop" onClick={onClose}>
      <div className="adf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adf-header">
          <div>
            <h2 className="adf-title">
              {isEdit ? "تعديل الإعلان" : "إضافة إعلان جديد"}
            </h2>
            <p className="adf-subtitle">
              {isEdit
                ? "عدّل البيانات واضغط حفظ."
                : "املأ بيانات الإعلان. الأصناف هتكون قابلة للحجز من التجار الموثقين."}
            </p>
          </div>
          <button
            className="adf-close"
            onClick={onClose}
            type="button"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="العنوان" required>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: خردة متنوعة للبيع"
              autoFocus
            />
          </Field>

          <Field label="الوصف" hint="معلومات إضافية للتاجر (اختياري)">
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="مثال: الكمية متوفرة للتسليم الفوري"
              style={{ resize: "vertical", minHeight: 60 }}
            />
          </Field>

          <Field
            label="رابط الصورة"
            hint="URL مباشر للصورة (اختياري)."
          >
            <input
              className="input"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImageError(false);
              }}
              placeholder="https://example.com/image.jpg"
              type="url"
            />
          </Field>

          <div style={{ marginBottom: 14 }}>
            {imageUrl.trim() && !imageError ? (
              <img
                src={imageUrl}
                alt="معاينة"
                style={{
                  width: "100%",
                  maxHeight: 200,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                }}
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                style={{
                  background: "var(--paper-sunken)",
                  border: "1px dashed var(--line-strong)",
                  borderRadius: 8,
                  height: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--steel-light)",
                  fontSize: 13,
                  gap: 8,
                }}
              >
                {imageError
                  ? "⚠️ الرابط مش شغال"
                  : "🖼️ معاينة الصورة هتظهر هنا"}
              </div>
            )}
          </div>

          <Field label="القسم" required>
            <select
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value={LOCATIONS.DOCK}>الرصيف البحري</option>
              <option value={LOCATIONS.YARD}>ساحة الجزيره</option>
            </select>
          </Field>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <label style={{ fontSize: 13, fontWeight: 700 }}>
                الأصناف <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <button
                type="button"
                className="btn"
                style={{ fontSize: 12, padding: "4px 10px" }}
                onClick={addItem}
                disabled={
                  loadingCats ||
                  items.length >= categories.length
                }
              >
                + إضافة صنف
              </button>
            </div>

            {loadingCats ? (
              <p style={{ fontSize: 13, color: "var(--steel)" }}>
                جاري تحميل الأصناف...
              </p>
            ) : categories.length === 0 ? (
              <div
                style={{
                  padding: 14,
                  background: "var(--crane-light)",
                  border: "1px solid var(--crane)",
                  borderRadius: 8,
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                ⚠️ مفيش أصناف. اطلب من الأدمن يضيف أصناف من تاب **"📋
                الأصناف"** أولاً.
              </div>
            ) : items.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--steel)",
                  margin: 0,
                }}
              >
                دوس **"+ إضافة صنف"** لبدء إضافة الأصناف.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {items.map((it, idx) => {
                  const isDeal = it.saleType === SALE_TYPES.DEAL;
                  const availableCats = categoriesByType[it.saleType] || [];

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: 10,
                        background: "var(--paper-sunken)",
                        borderRadius: 10,
                        border: "1px solid var(--line)",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 80px 90px 32px",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <select
                          className="input"
                          value={it.category}
                          onChange={(e) => {
                            const cat = availableCats.find(
                              (c) => c.name === e.target.value
                            );
                            if (cat)
                              changeCategory(idx, cat.name, cat.saleType);
                          }}
                          style={{ fontSize: 13 }}
                        >
                          {availableCats.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="1"
                          value={it.qty}
                          onChange={(e) =>
                            updateItem(idx, "qty", e.target.value)
                          }
                          placeholder="0"
                          disabled={isDeal}
                          style={{
                            textAlign: "center",
                            fontSize: 13,
                            opacity: isDeal ? 0.6 : 1,
                          }}
                        />
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="1"
                          value={it.unitPrice}
                          onChange={(e) =>
                            updateItem(idx, "unitPrice", e.target.value)
                          }
                          placeholder="0"
                          style={{ textAlign: "center", fontSize: 13 }}
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: "1.5px solid var(--line-strong)",
                            background: "transparent",
                            color: "var(--danger)",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                          aria-label="حذف الصنف"
                        >
                          ✕
                        </button>
                      </div>

                      <div
                        style={{
                          marginTop: 6,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          fontSize: 11.5,
                          color: "var(--steel)",
                        }}
                      >
                        <span style={saleTypeBadge(it.saleType)}>
                          {SALE_TYPES_LABELS[it.saleType]}
                        </span>
                        <span>
                          الوحدة: {SALE_TYPE_UNIT[it.saleType]}
                        </span>
                        {isDeal && (
                          <span style={{ color: "var(--crane)" }}>
                            🔒 السعر والكمية للقراءة فقط — التاجر مايقدرش
                            يعدّلهم
                          </span>
                        )}
                      </div>

                      {isEdit && Number(it.reservedQty || 0) > 0 && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--crane)",
                            margin: "4px 0 0",
                          }}
                        >
                          ⚠️ محجوز: {it.reservedQty} — الكمية الجديدة لازم ≥{" "}
                          {it.reservedQty}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px dashed var(--line)",
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--steel)">القيمة المتوقعة:</span>
              <span style={{ fontWeight: 900, fontSize: 15 }}>
                {total.toLocaleString("ar-EG")}ج
              </span>
            </div>
          </div>

          {error && <p className="adf-error">{error}</p>}

          <div className="adf-actions">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={saving}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || items.length === 0}
            >
              {saving
                ? "جاري الحفظ..."
                : isEdit
                ? "حفظ التعديلات"
                : "نشر الإعلان"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .adf-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 18, 16, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 90;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: adf-fade .2s ease;
        }
        @keyframes adf-fade {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        .adf-modal {
          background: var(--paper-raised);
          color: var(--ink);
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 560px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
          animation: adf-pop .25s cubic-bezier(0.22, 0.61, 0.36, 1);
          max-height: 90vh;
          overflow-y: auto;
        }
        @keyframes adf-pop {
          from { transform: scale(0.95); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }
        .adf-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
        }
        .adf-title {
          margin: 0 0 6px;
          font-size: 19px;
          font-weight: 900;
        }
        .adf-subtitle {
          margin: 0;
          font-size: 13px;
          color: var(--steel);
          line-height: 1.7;
        }
        .adf-close {
          background: transparent;
          border: none;
          color: var(--steel);
          font-size: 16px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background .2s;
          flex-shrink: 0;
        }
        .adf-close:hover {
          background: var(--paper-sunken);
        }
        .adf-error {
          color: var(--danger);
          font-size: 12.5px;
          margin: 0 0 12px;
          padding: 8px 12px;
          background: var(--danger-light);
          border-radius: 8px;
        }
        .adf-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .adf-actions .btn {
          flex: 1;
        }
        @media (max-width: 480px) {
          .adf-modal {
            padding: 18px;
            border-radius: 12px;
          }
          .adf-header {
            margin-bottom: 14px;
          }
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 6,
          color: "var(--ink)",
        }}
      >
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      {children}
      {hint && (
        <p
          style={{
            fontSize: 11.5,
            color: "var(--steel-light)",
            margin: "4px 0 0",
            lineHeight: 1.5,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function saleTypeBadge(saleType) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  };
  if (saleType === SALE_TYPES.TON)
    return {
      ...base,
      background: "var(--kabbash-light)",
      color: "var(--kabbash)",
    };
  if (saleType === SALE_TYPES.PIECE)
    return { ...base, background: "var(--crane-light)", color: "var(--crane)" };
  if (saleType === SALE_TYPES.DEAL)
    return {
      ...base,
      background: "var(--paper-raised)",
      color: "var(--steel)",
    };
  return base;
}
