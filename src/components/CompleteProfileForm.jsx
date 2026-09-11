import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { EGYPT_GOVERNORATES } from "../lib/egypt";
import { isValidEgyptianPhone } from "../lib/profile";

export const PROFILE_FORM_DISMISSED_KEY = "aj5_profile_form_dismissed";

export default function CompleteProfileForm({ onClose, forceMode = false }) {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [governorate, setGovernorate] = useState(profile?.governorate || "");
  const [company, setCompany] = useState(profile?.company || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("الاسم الكامل مطلوب");
    if (!phone.trim()) return setError("رقم الهاتف مطلوب");
    if (!isValidEgyptianPhone(phone))
      return setError("رقم الهاتف غير صحيح (مثال: 01012345678)");
    if (!governorate) return setError("المحافظة مطلوبة");

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        phone: phone.trim(),
        governorate,
        company: company.trim(),
        address: address.trim(),
        profileCompletedAt: serverTimestamp(),
      });
      sessionStorage.removeItem(PROFILE_FORM_DISMISSED_KEY);
      if (onClose) onClose();
    } catch (err) {
      console.error("تعذر حفظ البيانات:", err);
      setError("تعذر حفظ البيانات، حاول تاني");
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    if (forceMode) return;
    sessionStorage.setItem(PROFILE_FORM_DISMISSED_KEY, "1");
    if (onClose) onClose();
  }

  return (
    <div className="cpf-backdrop">
      <div className="cpf-modal">
        <div className="cpf-header">
          <div>
            <h2 className="cpf-title">أكمل بياناتك</h2>
            <p className="cpf-subtitle">
              محتاجين بعض البيانات الأساسية عشان نقدر نتعامل معاك. البيانات دي
              هتظهر في الفواتير وطلبات التوثيق.
            </p>
          </div>
          {!forceMode && (
            <button
              className="cpf-close"
              onClick={handleSkip}
              aria-label="إغلاق"
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="الاسم الكامل" required>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أحمد محمد علي"
              autoFocus
            />
          </Field>

          <Field label="رقم الهاتف" required>
            <input
              className="input"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012345678"
            />
          </Field>

          <Field label="المحافظة" required>
            <select
              className="input"
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
            >
              <option value="">— اختر المحافظة —</option>
              {EGYPT_GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>

          <Field label="اسم الشركة (اختياري)">
            <input
              className="input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="مثال: شركة النور للتجارة"
            />
          </Field>

          <Field label="عنوان الشركة (اختياري)">
            <textarea
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="المدينة، الشارع، رقم المبنى"
              style={{ resize: "vertical", minHeight: 60 }}
            />
          </Field>

          {error && <p className="cpf-error">{error}</p>}

          <div className="cpf-actions">
            {!forceMode && (
              <button
                type="button"
                className="btn"
                onClick={handleSkip}
                disabled={saving}
              >
                تصفح مؤقتاً
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "جاري الحفظ..." : "حفظ ومتابعة"}
            </button>
          </div>

          {!forceMode && (
            <p className="cpf-note">
              ملاحظة: تقدر تتصفح الموقع بدون البيانات دي، لكن مش هتقدر تحجز.
            </p>
          )}
        </form>
      </div>

      <style>{`
        .cpf-backdrop {
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
          animation: cpf-fade .2s ease;
        }
        @keyframes cpf-fade {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        .cpf-modal {
          background: var(--paper-raised);
          color: var(--ink);
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
          animation: cpf-pop .25s cubic-bezier(0.22, 0.61, 0.36, 1);
          max-height: 90vh;
          overflow-y: auto;
        }
        @keyframes cpf-pop {
          from { transform: scale(0.95); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }
        .cpf-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
        }
        .cpf-title {
          margin: 0 0 6px;
          font-size: 19px;
          font-weight: 900;
        }
        .cpf-subtitle {
          margin: 0;
          font-size: 13px;
          color: var(--steel);
          line-height: 1.7;
        }
        .cpf-close {
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
        .cpf-close:hover {
          background: var(--paper-sunken);
        }
        .cpf-error {
          color: var(--danger);
          font-size: 12.5px;
          margin: 0 0 12px;
          padding: 8px 12px;
          background: var(--danger-light);
          border-radius: 8px;
        }
        .cpf-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .cpf-actions .btn {
          flex: 1;
        }
        .cpf-note {
          font-size: 11.5px;
          color: var(--steel-light);
          margin: 12px 0 0;
          text-align: center;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }) {
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
    </div>
  );
}
