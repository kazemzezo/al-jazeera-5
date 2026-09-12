import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  SALE_TYPES,
  SALE_TYPES_LABELS,
  SALE_TYPE_UNIT,
} from "../lib/catalog";
import {
  subscribeAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories,
} from "../lib/categories";

export default function AdminCategoriesTab() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const unsub = subscribeAllCategories(setCategories, (err) => {
      console.error("فشل تحميل الأصناف:", err);
      setError("تعذر تحميل الأصناف.");
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let list = categories;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => (c.name || "").toLowerCase().includes(q));
    } else if (filter !== "all") {
      list = list.filter((c) => c.saleType === filter);
    }
    return list;
  }, [categories, filter, search]);

  const counts = useMemo(
    () => ({
      all: categories.length,
      [SALE_TYPES.TON]: categories.filter((c) => c.saleType === SALE_TYPES.TON)
        .length,
      [SALE_TYPES.PIECE]: categories.filter(
        (c) => c.saleType === SALE_TYPES.PIECE
      ).length,
      [SALE_TYPES.DEAL]: categories.filter(
        (c) => c.saleType === SALE_TYPES.DEAL
      ).length,
    }),
    [categories]
  );

  async function handleSeed() {
    if (
      !window.confirm(
        "سيتم إضافة كل الأصناف الافتراضية (طن + عدد + صفقة) إلى قاعدة البيانات. متأكد؟"
      )
    )
      return;
    setSeeding(true);
    setError("");
    setSuccess("");
    try {
      const res = await seedDefaultCategories(user);
      if (res.seeded) {
        setSuccess(`تم زرع ${res.count} صنف بنجاح`);
      } else {
        setError("فيه أصناف موجودة بالفعل — مش هنزرع حاجة");
      }
    } catch (err) {
      console.error(err);
      setError("تعذر زرع الأصناف، حاول تاني");
    } finally {
      setSeeding(false);
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`حذف الصنف "${cat.name}"؟`)) return;
    setBusyId(cat.id);
    setError("");
    try {
      await deleteCategory(cat.id);
      setSuccess(`تم حذف "${cat.name}"`);
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error(err);
      setError("تعذر حذف الصنف");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p
        style={{
          fontSize: 13,
          color: "var(--steel)",
          marginBottom: 14,
          lineHeight: 1.7,
        }}
      >
        الأصناف اللي هنا هي اللي هتظهر للأدمن عند إضافة إعلان. كل صنف له نوع
        بيع محدد (طن / عدد / صفقة).
      </p>

      {error && (
        <div
          style={{
            fontSize: 13,
            color: "var(--danger)",
            background: "var(--danger-light)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            fontSize: 13,
            color: "var(--kabbash)",
            background: "var(--kabbash-light)",
            border: "1px solid var(--kabbash)",
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            marginBottom: 12,
          }}
        >
          ✅ {success}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <input
          className="input"
          placeholder="ابحث باسم الصنف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {categories.length === 0 && (
            <button
              className="btn"
              onClick={handleSeed}
              disabled={seeding}
              style={{
                whiteSpace: "nowrap",
                color: "var(--crane)",
                borderColor: "var(--crane)",
              }}
            >
              {seeding ? "جاري الزرع..." : "🌱 زرع الأصناف الافتراضية"}
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            style={{ whiteSpace: "nowrap" }}
          >
            + صنف جديد
          </button>
        </div>
      </div>

      {!search.trim() && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {[
            { k: "all", label: "الكل" },
            { k: SALE_TYPES.TON, label: SALE_TYPES_LABELS[SALE_TYPES.TON] },
            { k: SALE_TYPES.PIECE, label: SALE_TYPES_LABELS[SALE_TYPES.PIECE] },
            { k: SALE_TYPES.DEAL, label: SALE_TYPES_LABELS[SALE_TYPES.DEAL] },
          ].map((s) => (
            <button
              key={s.k}
              className="btn"
              style={{
                fontSize: 12,
                padding: "5px 12px",
                background: filter === s.k ? "var(--ink)" : "transparent",
                color: filter === s.k ? "var(--paper)" : "var(--ink)",
                borderColor: filter === s.k ? "var(--ink)" : "var(--line)",
              }}
              onClick={() => setFilter(s.k)}
            >
              {s.label} ({counts[s.k] || 0})
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--steel)" }}>
          {categories.length === 0
            ? "مفيش أصناف. اضغط 'زرع الأصناف الافتراضية' لبدء سريع، أو '+ صنف جديد'."
            : "لا توجد نتائج مطابقة."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((cat) => (
            <div
              key={cat.id}
              style={{
                background: "var(--paper-raised)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 180 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {cat.name}
                  </p>
                  <SaleTypeBadge saleType={cat.saleType} />
                </div>
                {cat.notes && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "var(--steel)",
                    }}
                  >
                    {cat.notes}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn"
                  style={{
                    fontSize: 12,
                    padding: "5px 10px",
                    color: "var(--kabbash)",
                    borderColor: "var(--kabbash)",
                  }}
                  onClick={() => setEditingCat(cat)}
                  disabled={busyId === cat.id}
                >
                  ✏️ تعديل
                </button>
                <button
                  className="btn"
                  style={{
                    fontSize: 12,
                    padding: "5px 10px",
                    color: "var(--danger)",
                    borderColor: "var(--danger)",
                  }}
                  onClick={() => handleDelete(cat)}
                  disabled={busyId === cat.id}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <CategoryForm
          onClose={() => setShowForm(false)}
          onSave={async (data) => {
            await createCategory(data, user);
            setShowForm(false);
            setSuccess("تم إضافة الصنف");
            setTimeout(() => setSuccess(""), 2500);
          }}
        />
      )}

      {editingCat && (
        <CategoryForm
          category={editingCat}
          onClose={() => setEditingCat(null)}
          onSave={async (data) => {
            await updateCategory(editingCat.id, data, user.uid);
            setEditingCat(null);
            setSuccess("تم تعديل الصنف");
            setTimeout(() => setSuccess(""), 2500);
          }}
        />
      )}
    </div>
  );
}

function SaleTypeBadge({ saleType }) {
  const styles = {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 700,
  };
  if (saleType === SALE_TYPES.TON)
    return (
      <span
        style={{
          ...styles,
          background: "var(--kabbash-light)",
          color: "var(--kabbash)",
        }}
      >
        {SALE_TYPES_LABELS[SALE_TYPES.TON]}
      </span>
    );
  if (saleType === SALE_TYPES.PIECE)
    return (
      <span
        style={{
          ...styles,
          background: "var(--crane-light)",
          color: "var(--crane)",
        }}
      >
        {SALE_TYPES_LABELS[SALE_TYPES.PIECE]}
      </span>
    );
  if (saleType === SALE_TYPES.DEAL)
    return (
      <span
        style={{
          ...styles,
          background: "var(--paper-sunken)",
          color: "var(--steel)",
        }}
      >
        {SALE_TYPES_LABELS[SALE_TYPES.DEAL]}
      </span>
    );
  return null;
}

function CategoryForm({ category, onClose, onSave }) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name || "");
  const [saleType, setSaleType] = useState(category?.saleType || SALE_TYPES.TON);
  const [notes, setNotes] = useState(category?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("اسم الصنف مطلوب");
    if (!saleType) return setError("نوع البيع مطلوب");

    setSaving(true);
    try {
      await onSave({ name, saleType, notes });
    } catch (err) {
      console.error(err);
      setError(err.message || "تعذر الحفظ، حاول تاني");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cf-backdrop" onClick={onClose}>
      <div className="cf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cf-header">
          <h2 className="cf-title">
            {isEdit ? "تعديل الصنف" : "صنف جديد"}
          </h2>
          <button
            className="cf-close"
            onClick={onClose}
            type="button"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="cf-label">
              اسم الصنف <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: حديد، براميل، سيارات"
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="cf-label">
              نوع البيع <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.values(SALE_TYPES).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="btn"
                  style={{
                    fontSize: 12.5,
                    padding: "6px 14px",
                    background:
                      saleType === t ? "var(--kabbash)" : "transparent",
                    color: saleType === t ? "#fff" : "var(--ink)",
                    borderColor:
                      saleType === t ? "var(--kabbash)" : "var(--line)",
                  }}
                  onClick={() => setSaleType(t)}
                >
                  {SALE_TYPES_LABELS[t]} ({SALE_TYPE_UNIT[t]})
                </button>
              ))}
            </div>
            <p className="cf-hint">
              {saleType === SALE_TYPES.TON &&
                "هيتكتب الكمية بالأطنان، والسعر للطن."}
              {saleType === SALE_TYPES.PIECE &&
                "هيتكتب الكمية بالعدد، والسعر للقطعة."}
              {saleType === SALE_TYPES.DEAL &&
                "صفقة — الأدمن يكتب الكمية والسعر الإجمالي، والتاجر مايقدرش يعدّلهم."}
            </p>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="cf-label">ملاحظات (اختياري)</label>
            <textarea
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="أي تفاصيل إضافية"
              style={{ resize: "vertical", minHeight: 60 }}
            />
          </div>

          {error && <p className="cf-error">{error}</p>}

          <div className="cf-actions">
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
              disabled={saving}
            >
              {saving ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .cf-backdrop {
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
          animation: cf-fade .2s ease;
        }
        @keyframes cf-fade {
          from { opacity: 0 } to { opacity: 1 }
        }
        .cf-modal {
          background: var(--paper-raised);
          color: var(--ink);
          border-radius: 16px;
          padding: 22px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
          animation: cf-pop .25s cubic-bezier(0.22, 0.61, 0.36, 1);
          max-height: 90vh;
          overflow-y: auto;
        }
        @keyframes cf-pop {
          from { transform: scale(0.95); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }
        .cf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 12px;
        }
        .cf-title {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
        }
        .cf-close {
          background: transparent;
          border: none;
          color: var(--steel);
          font-size: 16px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background .2s;
        }
        .cf-close:hover {
          background: var(--paper-sunken);
        }
        .cf-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 6px;
          color: var(--ink);
        }
        .cf-hint {
          font-size: 11.5px;
          color: var(--steel-light);
          margin: 6px 0 0;
          line-height: 1.6;
        }
        .cf-error {
          color: var(--danger);
          font-size: 12.5px;
          margin: 0 0 12px;
          padding: 8px 12px;
          background: var(--danger-light);
          border-radius: 8px;
        }
        .cf-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .cf-actions .btn {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
