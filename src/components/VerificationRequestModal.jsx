import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { requestVerification } from "../lib/verification";
import { generateUniqueCode } from "../lib/codes";
import {
  subscribeSettings,
  getVerificationFee,
} from "../lib/settings";

const SPIN_DURATION = 2500; // مدة دوران الكود (ms)
const SPIN_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export default function VerificationRequestModal({ onClose }) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState("choose");
  // choose → payment → success
  const [type, setType] = useState("");
  const [code, setCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [spinChars, setSpinChars] = useState("------");
  const [transactionId, setTransactionId] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(null);

  // تحميل الإعدادات
  useEffect(() => {
    const unsub = subscribeSettings(setSettings);
    return () => unsub();
  }, []);

  // أنيميشن دوران الكود
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      let s = "";
      for (let i = 0; i < 6; i++) {
        s += SPIN_CHARS[Math.floor(Math.random() * SPIN_CHARS.length)];
      }
      setSpinChars(s);
    }, 60);
    return () => clearInterval(interval);
  }, [generating]);

  const fee = type && settings ? getVerificationFee(type, settings) : 0;
  const prefix =
    type === "dock" ? "DK" : type === "yard" ? "YD" : "??";
  const typeLabel =
    type === "dock" ? "تاجر رصيف" : type === "yard" ? "تاجر ساحة" : "";

  /* ============ توليد الكود ============ */
  async function handleGenerate() {
    if (!type) {
      setError("اختر نوع التوثيق أولاً");
      return;
    }
    setError("");
    setGenerating(true);

    // أنيميشن
    await new Promise((res) => setTimeout(res, SPIN_DURATION));

    try {
      const generated = await generateUniqueCode(type);
      setCode(generated);
      setStep("payment");
    } catch (err) {
      console.error(err);
      setError("تعذر توليد الكود، حاول تاني");
    } finally {
      setGenerating(false);
    }
  }

  /* ============ إرسال الطلب ============ */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!code) {
      setError("الكود غير موجود");
      return;
    }
    if (!transactionId.trim()) {
      setError("رقم العملية مطلوب");
      return;
    }
    if (confirmCode.trim().toUpperCase() !== code.toUpperCase()) {
      setError("الكود المُدخل لا يطابق الكود المُولّد");
      return;
    }

    setSending(true);
    try {
      await requestVerification(user, profile, {
        phone: profile?.phone || "",
        notes: `كود الدفع: ${code} · رقم العملية: ${transactionId.trim()}`,
        type,
        code,
        transactionId: transactionId.trim(),
        paymentAmount: fee,
      });
      setStep("success");
    } catch (err) {
      console.error(err);
      setError(err.message || "تعذر إرسال الطلب، حاول تاني");
    } finally {
      setSending(false);
    }
  }

  /* ============ نسخ الكود ============ */
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      alert("تم نسخ الكود ✅");
    } catch (err) {
      // fallback
      alert(`الكود: ${code}`);
    }
  }

  return (
    <div className="vrm-backdrop" onClick={onClose}>
      <div className="vrm-modal" onClick={(e) => e.stopPropagation()}>
        {/* رأس */}
        <div className="vrm-header">
          <div>
            <h2 className="vrm-title">طلب توثيق الحساب</h2>
            <p className="vrm-subtitle">
              {step === "choose" && "اختر نوع التوثيق المناسب لك"}
              {step === "payment" && "أكمل عملية الدفع وارفع البيانات"}
              {step === "success" && "تم إرسال طلبك بنجاح"}
            </p>
          </div>
          <button
            className="vrm-close"
            onClick={onClose}
            type="button"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* ============ الخطوة 1: اختيار النوع ============ */}
        {step === "choose" && (
          <div>
            <div className="vrm-types">
              <button
                type="button"
                className={
                  "vrm-type-card" + (type === "dock" ? " active" : "")
                }
                onClick={() => setType("dock")}
              >
                <div className="vrm-type-icon">⚓</div>
                <div className="vrm-type-info">
                  <p className="vrm-type-name">تاجر رصيف</p>
                  <p className="vrm-type-desc">
                    يحجز من الرصيف البحري فقط
                  </p>
                  <p className="vrm-type-fee">
                    {settings
                      ? Number(settings.dockFee).toLocaleString("ar-EG")
                      : "..."}{" "}
                    ج
                  </p>
                </div>
                <div className="vrm-type-radio" />
              </button>

              <button
                type="button"
                className={
                  "vrm-type-card" + (type === "yard" ? " active" : "")
                }
                onClick={() => setType("yard")}
              >
                <div className="vrm-type-icon">🏭</div>
                <div className="vrm-type-info">
                  <p className="vrm-type-name">تاجر ساحة</p>
                  <p className="vrm-type-desc">
                    يحجز من الساحة + الرصيف
                  </p>
                  <p className="vrm-type-fee">
                    {settings
                      ? Number(settings.yardFee).toLocaleString("ar-EG")
                      : "..."}{" "}
                    ج
                  </p>
                </div>
                <div className="vrm-type-radio" />
              </button>
            </div>

            <div className="vrm-note">
              💡 المبلغ ده <b>أمانة</b> تُحفظ في محفظتك، وتُخصم من أول
              حجز أو تُسترد كخردة بقيمتها.
            </div>

            {error && <p className="vrm-error">{error}</p>}

            <div className="vrm-actions">
              <button
                type="button"
                className="btn"
                onClick={onClose}
                disabled={generating}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={!type || generating}
              >
                {generating ? "⏳ جاري توليد الكود..." : "⚙️ توليد كود الدفع"}
              </button>
            </div>

            {generating && (
              <div className="vrm-spinner">
                <div className="vrm-spin-code">
                  {prefix}-{spinChars}
                </div>
                <p className="vrm-spin-text">
                  ⚙️ جاري توليد كود فريد...
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============ الخطوة 2: الدفع ============ */}
        {step === "payment" && (
          <form onSubmit={handleSubmit}>
            {/* الكود */}
            <div className="vrm-code-box">
              <div className="vrm-code-label">🔑 كود الدفع الخاص بك</div>
              <div className="vrm-code-value">
                <span>{code}</span>
                <button
                  type="button"
                  className="vrm-copy-btn"
                  onClick={copyCode}
                  title="نسخ الكود"
                >
                  📋
                </button>
              </div>
              <p className="vrm-code-hint">
                ⚠️ اكتب الكود ده في خانة <b>"الملاحظات"</b> وقت التحويل
              </p>
            </div>

            {/* المبلغ */}
            <div className="vrm-fee-box">
              <span className="vrm-fee-label">المبلغ المطلوب:</span>
              <span className="vrm-fee-value">
                {Number(fee).toLocaleString("ar-EG")} ج
              </span>
            </div>

            {/* طرق الدفع */}
            <div className="vrm-pay-box">
              <p className="vrm-pay-title">💳 طرق الدفع المتاحة</p>

              <div className="vrm-pay-method primary">
                <div className="vrm-pay-method-head">
                  <span className="vrm-pay-icon">🏦</span>
                  <span className="vrm-pay-name">
                    إنستاباي (الأكثر أماناً) 🌟
                  </span>
                </div>
                <div className="vrm-pay-details">
                  <b>{settings?.instapay || "..."}</b>
                </div>
                {settings?.instapayLink && (
                  <a
                    href={settings.instapayLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vrm-pay-link"
                  >
                    🔗 اضغط للدفع المباشر
                  </a>
                )}
              </div>

              <div className="vrm-pay-method">
                <div className="vrm-pay-method-head">
                  <span className="vrm-pay-icon">📱</span>
                  <span className="vrm-pay-name">فودافون كاش</span>
                </div>
                <div className="vrm-pay-details">
                  <b>{settings?.vodafoneCash || "..."}</b>
                </div>
              </div>
            </div>

            {/* حقول الإدخال */}
            <div className="vrm-field">
              <label className="vrm-label">
                📝 رقم العملية <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                className="input"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="اكتب رقم العملية من الإيصال"
                required
              />
            </div>

            <div className="vrm-field">
              <label className="vrm-label">
                🔑 تأكيد الكود{" "}
                <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                className="input"
                type="text"
                value={confirmCode}
                onChange={(e) =>
                  setConfirmCode(e.target.value.toUpperCase())
                }
                placeholder="اكتب الكود المُولّد للتأكيد"
                required
              />
            </div>

            {error && <p className="vrm-error">{error}</p>}

            <div className="vrm-actions">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setStep("choose");
                  setError("");
                }}
                disabled={sending}
              >
                ← رجوع
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending}
              >
                {sending ? "جاري الإرسال..." : "✅ إرسال الطلب"}
              </button>
            </div>

            <p className="vrm-note-small">
              بعد استلام الأدمن للدفع، سيتم توثيق حسابك خلال 24 ساعة.
            </p>
          </form>
        )}

        {/* ============ الخطوة 3: نجاح ============ */}
        {step === "success" && (
          <div className="vrm-success">
            <div className="vrm-success-icon">✅</div>
            <h3 className="vrm-success-title">تم إرسال طلبك</h3>
            <p className="vrm-success-text">
              هيتم مراجعة طلبك من إدارة الموقع، وهيتم تفعيل حسابك خلال 24
              ساعة بعد تأكيد الدفع.
            </p>
            <div className="vrm-success-info">
              <div>
                <b>النوع:</b> {typeLabel}
              </div>
              <div>
                <b>الكود:</b> {code}
              </div>
              <div>
                <b>المبلغ:</b> {Number(fee).toLocaleString("ar-EG")} ج
              </div>
            </div>
            <p className="vrm-success-note">
              💡 تقدر تتابع حالة طلبك من صفحة "حسابي".
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 12 }}
              onClick={onClose}
            >
              تمام
            </button>
          </div>
        )}
      </div>

      <style>{`
        .vrm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 18, 16, 0.65);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 95;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: vrm-fade .2s ease;
        }
        @keyframes vrm-fade {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        .vrm-modal {
          background: var(--paper-raised);
          color: var(--ink);
          border-radius: 16px;
          padding: 22px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
          animation: vrm-pop .25s cubic-bezier(0.22, 0.61, 0.36, 1);
          max-height: 92vh;
          overflow-y: auto;
        }
        @keyframes vrm-pop {
          from { transform: scale(0.95); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }
        .vrm-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
        }
        .vrm-title {
          margin: 0 0 4px;
          font-size: 19px;
          font-weight: 900;
        }
        .vrm-subtitle {
          margin: 0;
          font-size: 12.5px;
          color: var(--steel);
        }
        .vrm-close {
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
        .vrm-close:hover {
          background: var(--paper-sunken);
        }

        /* بطاقات الاختيار */
        .vrm-types {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 14px;
        }
        .vrm-type-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: var(--paper-raised);
          border: 2px solid var(--line);
          border-radius: 12px;
          cursor: pointer;
          text-align: start;
          transition: border-color .2s, background .2s, transform .15s;
          font-family: inherit;
          color: var(--ink);
          width: 100%;
        }
        .vrm-type-card:hover {
          border-color: var(--kabbash);
        }
        .vrm-type-card.active {
          border-color: var(--kabbash);
          background: var(--kabbash-light);
        }
        .vrm-type-card:active {
          transform: scale(0.98);
        }
        .vrm-type-icon {
          font-size: 32px;
          flex-shrink: 0;
        }
        .vrm-type-info {
          flex: 1;
          min-width: 0;
        }
        .vrm-type-name {
          margin: 0 0 2px;
          font-size: 15px;
          font-weight: 800;
        }
        .vrm-type-desc {
          margin: 0 0 4px;
          font-size: 12px;
          color: var(--steel);
        }
        .vrm-type-fee {
          margin: 0;
          font-size: 16px;
          font-weight: 900;
          color: var(--kabbash);
        }
        .vrm-type-radio {
          width: 20px;
          height: 20px;
          border: 2px solid var(--line-strong);
          border-radius: 50%;
          flex-shrink: 0;
          transition: all .2s;
          position: relative;
        }
        .vrm-type-card.active .vrm-type-radio {
          border-color: var(--kabbash);
          background: var(--kabbash);
        }
        .vrm-type-card.active .vrm-type-radio::after {
          content: "";
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: #fff;
        }

        /* ملاحظة */
        .vrm-note {
          background: var(--crane-light);
          border: 1px solid var(--crane);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 12.5px;
          line-height: 1.7;
          color: var(--ink);
          margin-bottom: 14px;
        }

        /* سبينر */
        .vrm-spinner {
          text-align: center;
          padding: 20px;
        }
        .vrm-spin-code {
          font-family: monospace;
          font-size: 28px;
          font-weight: 900;
          color: var(--crane);
          letter-spacing: 3px;
          margin-bottom: 10px;
          animation: vrm-pulse .8s ease-in-out infinite;
        }
        @keyframes vrm-pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.5 }
        }
        .vrm-spin-text {
          font-size: 13px;
          color: var(--steel);
          margin: 0;
        }

        /* صندوق الكود */
        .vrm-code-box {
          background: var(--kabbash-light);
          border: 2px solid var(--kabbash);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          margin-bottom: 14px;
        }
        .vrm-code-label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--kabbash);
          margin-bottom: 8px;
        }
        .vrm-code-value {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: monospace;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 3px;
          color: var(--ink);
          margin-bottom: 8px;
        }
        .vrm-copy-btn {
          background: var(--kabbash);
          color: #fff;
          border: none;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          transition: background .2s;
        }
        .vrm-copy-btn:hover {
          background: var(--kabbash-dark);
        }
        .vrm-code-hint {
          margin: 0;
          font-size: 11.5px;
          color: var(--kabbash);
          font-weight: 600;
        }

        /* صندوق المبلغ */
        .vrm-fee-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--paper-sunken);
          border-radius: 10px;
          margin-bottom: 14px;
        }
        .vrm-fee-label {
          font-size: 13.5px;
          color: var(--steel);
          font-weight: 700;
        }
        .vrm-fee-value {
          font-size: 22px;
          font-weight: 900;
          color: var(--kabbash);
        }

        /* طرق الدفع */
        .vrm-pay-box {
          margin-bottom: 14px;
        }
        .vrm-pay-title {
          font-size: 13px;
          font-weight: 700;
          margin: 0 0 8px;
          color: var(--steel);
        }
        .vrm-pay-method {
          padding: 12px 14px;
          border: 1.5px solid var(--line);
          border-radius: 10px;
          margin-bottom: 8px;
          background: var(--paper-raised);
        }
        .vrm-pay-method.primary {
          border-color: var(--kabbash);
          background: var(--kabbash-light);
        }
        .vrm-pay-method-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .vrm-pay-icon {
          font-size: 20px;
        }
        .vrm-pay-name {
          font-size: 13px;
          font-weight: 800;
          color: var(--ink);
        }
        .vrm-pay-details {
          font-family: monospace;
          font-size: 14.5px;
          font-weight: 700;
          color: var(--kabbash);
          word-break: break-all;
          margin-bottom: 6px;
        }
        .vrm-pay-link {
          display: inline-block;
          font-size: 12.5px;
          color: var(--kabbash);
          font-weight: 700;
          text-decoration: underline;
        }

        /* حقول الإدخال */
        .vrm-field {
          margin-bottom: 12px;
        }
        .vrm-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 6px;
          color: var(--ink);
        }

        /* أخطاء */
        .vrm-error {
          background: var(--danger-light);
          border: 1px solid var(--danger);
          color: var(--danger);
          font-size: 12.5px;
          padding: 8px 12px;
          border-radius: 8px;
          margin: 0 0 12px;
          line-height: 1.6;
        }

        /* أزرار */
        .vrm-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .vrm-actions .btn {
          flex: 1;
        }
        .vrm-note-small {
          font-size: 11px;
          color: var(--steel-light);
          margin: 10px 0 0;
          text-align: center;
        }

        /* نجاح */
        .vrm-success {
          text-align: center;
          padding: 10px 0;
        }
        .vrm-success-icon {
          font-size: 54px;
          margin-bottom: 8px;
        }
        .vrm-success-title {
          margin: 0 0 8px;
          font-size: 20px;
          font-weight: 900;
        }
        .vrm-success-text {
          margin: 0 0 16px;
          font-size: 13.5px;
          color: var(--steel);
          line-height: 1.7;
        }
        .vrm-success-info {
          background: var(--paper-sunken);
          border-radius: 10px;
          padding: 12px 16px;
          text-align: start;
          font-size: 13.5px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .vrm-success-info b {
          color: var(--steel);
          margin-inline-end: 6px;
        }
        .vrm-success-note {
          font-size: 12px;
          color: var(--steel-light);
          margin: 0 0 8px;
        }

        @media (max-width: 480px) {
          .vrm-modal {
            padding: 18px;
            border-radius: 14px;
          }
          .vrm-code-value {
            font-size: 22px;
            letter-spacing: 2px;
          }
          .vrm-type-name {
            font-size: 14px;
          }
          .vrm-type-fee {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
}
