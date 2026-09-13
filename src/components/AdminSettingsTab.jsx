import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  subscribeSettings,
  updateSettings,
  ensureSettingsExist,
  DEFAULT_SETTINGS,
} from "../lib/settings";

export default function AdminSettingsTab() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(DEFAULT_SETTINGS);

  // تحميل الإعدادات
  useEffect(() => {
    const unsub = subscribeSettings(
      (data) => {
        setSettings(data);
        setForm(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  // تهيئة الإعدادات أول مرة
  useEffect(() => {
    if (!loading && user?.uid) {
      ensureSettingsExist(user.uid).catch(() => {});
    }
  }, [loading, user]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateDeduction(idx, field, value) {
    const list = [...form.deductions];
    list[idx] = { ...list[idx], [field]: value };
    setForm((f) => ({ ...f, deductions: list }));
  }

  function addDeduction() {
    const newItem = {
      id: "d" + Date.now(),
      reason: "",
      amount: 0,
    };
    setForm((f) => ({ ...f, deductions: [...f.deductions, newItem] }));
  }

  function removeDeduction(idx) {
    setForm((f) => ({
      ...f,
      deductions: f.deductions.filter((_, i) => i !== idx),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");

    // تحقق
    if (!form.dockFee || form.dockFee <= 0) {
      setError("رسوم الرصيف غير صحيحة");
      setSaving(false);
      return;
    }
    if (!form.yardFee || form.yardFee <= 0) {
      setError("رسوم الساحة غير صحيحة");
      setSaving(false);
      return;
    }
    if (!form.instapay?.trim()) {
      setError("عنوان إنستاباي مطلوب");
      setSaving(false);
      return;
    }
    if (!form.vodafoneCash?.trim()) {
      setError("رقم فودافون كاش مطلوب");
      setSaving(false);
      return;
    }

    // تحقق من قايمة الخصومات
    for (const d of form.deductions) {
      if (!d.reason?.trim()) {
        setError("كل خصم لازم يكون له سبب");
        setSaving(false);
        return;
      }
      if (!d.amount || Number(d.amount) <= 0) {
        setError(`مبلغ الخصم "${d.reason}" غير صحيح`);
        setSaving(false);
        return;
      }
    }

    try {
      await updateSettings(
        {
          dockFee: Number(form.dockFee),
          yardFee: Number(form.yardFee),
          instapay: form.instapay.trim(),
          instapayLink: form.instapayLink?.trim() || "",
          vodafoneCash: form.vodafoneCash.trim(),
          deductions: form.deductions.map((d) => ({
            id: d.id,
            reason: d.reason.trim(),
            amount: Number(d.amount),
          })),
          missingPaymentFee: {
            per: Number(form.missingPaymentFee.per),
            amount: Number(form.missingPaymentFee.amount),
          },
        },
        user.uid
      );
      setSuccess("✅ تم حفظ الإعدادات بنجاح");
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("تعذر حفظ الإعدادات، حاول تاني");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm(settings);
    setEditing(false);
    setError("");
  }

  if (loading) {
    return <div className="page-loading">جاري التحميل...</div>;
  }

  return (
    <div>
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
          {success}
        </div>
      )}

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

      {/* زر التعديل */}
      {!editing && (
        <div style={{ marginBottom: 16 }}>
          <button
            className="btn btn-primary"
            onClick={() => setEditing(true)}
          >
            ✏️ تعديل الإعدادات
          </button>
        </div>
      )}

      {/* أمانة التوثيق */}
      <Section title="💰 أمانة التوثيق">
        <Field
          label="تاجر الرصيف"
          value={editing ? form.dockFee : settings.dockFee}
          onChange={(v) => updateField("dockFee", v)}
          editing={editing}
          unit="ج"
          type="number"
        />
        <Field
          label="تاجر الساحة"
          value={editing ? form.yardFee : settings.yardFee}
          onChange={(v) => updateField("yardFee", v)}
          editing={editing}
          unit="ج"
          type="number"
        />
      </Section>

      {/* بيانات الدفع */}
      <Section title="💳 بيانات الدفع">
        <Field
          label="إنستاباي"
          value={editing ? form.instapay : settings.instapay}
          onChange={(v) => updateField("instapay", v)}
          editing={editing}
          type="text"
          hint="مثال: popoflop@instapay"
        />
        <Field
          label="رابط إنستاباي (اختياري)"
          value={editing ? form.instapayLink : settings.instapayLink}
          onChange={(v) => updateField("instapayLink", v)}
          editing={editing}
          type="text"
          hint="رابط الدفع المباشر"
        />
        <Field
          label="فودافون كاش"
          value={editing ? form.vodafoneCash : settings.vodafoneCash}
          onChange={(v) => updateField("vodafoneCash", v)}
          editing={editing}
          type="text"
          hint="رقم 11 خانة"
        />
      </Section>

      {/* قايمة الخصومات */}
      <Section title="⚠️ قايمة الخصومات">
        {!editing && (
          <div style={{ marginBottom: 10 }}>
            {settings.deductions.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--steel)" }}>
                مفيش خصومات مسجلة.
              </p>
            ) : (
              <table style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--line)",
                      color: "var(--steel)",
                    }}
                  >
                    <th
                      style={{
                        textAlign: "start",
                        padding: "6px 0",
                        fontWeight: 700,
                      }}
                    >
                      السبب
                    </th>
                    <th
                      style={{
                        textAlign: "end",
                        padding: "6px 0",
                        fontWeight: 700,
                      }}
                    >
                      المبلغ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {settings.deductions.map((d, i) => (
                    <tr
                      key={d.id || i}
                      style={{ borderBottom: "1px solid var(--line)" }}
                    >
                      <td style={{ padding: "8px 0" }}>{d.reason}</td>
                      <td
                        style={{
                          padding: "8px 0",
                          textAlign: "end",
                          fontWeight: 700,
                        }}
                      >
                        {Number(d.amount).toLocaleString("ar-EG")}ج
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {editing && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {form.deductions.map((d, idx) => (
              <div
                key={d.id || idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 32px",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <input
                  className="input"
                  placeholder="السبب"
                  value={d.reason}
                  onChange={(e) =>
                    updateDeduction(idx, "reason", e.target.value)
                  }
                  style={{ fontSize: 13 }}
                />
                <input
                  className="input"
                  type="number"
                  placeholder="المبلغ"
                  value={d.amount}
                  onChange={(e) =>
                    updateDeduction(idx, "amount", e.target.value)
                  }
                  style={{ fontSize: 13, textAlign: "center" }}
                />
                <button
                  type="button"
                  onClick={() => removeDeduction(idx)}
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
                  aria-label="حذف"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn"
              style={{
                fontSize: 12,
                padding: "6px 12px",
                marginTop: 6,
                alignSelf: "flex-start",
              }}
              onClick={addDeduction}
            >
              + إضافة سبب
            </button>
          </div>
        )}
      </Section>

      {/* رسوم الدفع الناقص */}
      <Section title="💵 رسوم الدفع الناقص">
        {!editing ? (
          <p style={{ fontSize: 14, margin: 0 }}>
            <b>{settings.missingPaymentFee.amount}ج</b> لكل{" "}
            <b>
              {Number(settings.missingPaymentFee.per).toLocaleString(
                "ar-EG"
              )}
              ج
            </b>{" "}
            ناقصة.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                الرسوم (ج)
              </label>
              <input
                className="input"
                type="number"
                value={form.missingPaymentFee.amount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    missingPaymentFee: {
                      ...f.missingPaymentFee,
                      amount: e.target.value,
                    },
                  }))
                }
                style={{ fontSize: 13 }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                لكل (ج)
              </label>
              <input
                className="input"
                type="number"
                value={form.missingPaymentFee.per}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    missingPaymentFee: {
                      ...f.missingPaymentFee,
                      per: e.target.value,
                    },
                  }))
                }
                style={{ fontSize: 13 }}
              />
            </div>
          </div>
        )}
      </Section>

      {/* أزرار الحفظ/الإلغاء */}
      {editing && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
            position: "sticky",
            bottom: 16,
            background: "var(--paper-raised)",
            padding: 12,
            borderRadius: "var(--radius)",
            boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "جاري الحفظ..." : "💾 حفظ التعديلات"}
          </button>
          <button
            className="btn"
            style={{ flex: 1 }}
            onClick={handleCancel}
            disabled={saving}
          >
            إلغاء
          </button>
        </div>
      )}

      {/* معلومات إضافية */}
      {!editing && settings.updatedAt && (
        <p
          style={{
            fontSize: 11.5,
            color: "var(--steel-light)",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          آخر تحديث:{" "}
          {settings.updatedAt?.toDate?.().toLocaleString("ar-EG") || "—"}
        </p>
      )}
    </div>
  );
}

/* ============================================
   مكونات مساعدة
   ============================================ */

function Section({ title, children }) {
  return (
    <div
      style={{
        background: "var(--paper-raised)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        padding: 16,
        marginBottom: 14,
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 800,
          margin: "0 0 12px",
          color: "var(--ink)",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  editing,
  unit,
  type = "text",
  hint,
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: "block",
          fontSize: 12.5,
          fontWeight: 700,
          marginBottom: 6,
          color: "var(--steel)",
        }}
      >
        {label}
      </label>
      {editing ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            className="input"
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ flex: 1, fontSize: 13 }}
          />
          {unit && (
            <span
              style={{
                fontSize: 13,
                color: "var(--steel)",
                fontWeight: 700,
              }}
            >
              {unit}
            </span>
          )}
        </div>
      ) : (
        <p
          style={{
            fontSize: 15,
            fontWeight: 700,
            margin: 0,
            color: "var(--ink)",
          }}
        >
          {type === "number"
            ? Number(value).toLocaleString("ar-EG")
            : value || "—"}
          {unit && ` ${unit}`}
        </p>
      )}
      {hint && editing && (
        <p
          style={{
            fontSize: 11,
            color: "var(--steel-light)",
            margin: "4px 0 0",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
