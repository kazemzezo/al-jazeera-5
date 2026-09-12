import { useMemo, useState } from "react";
import { EQUIPMENT } from "../lib/equipment";
import { createAdReservation } from "../lib/ads";
import { useAuth } from "../context/AuthContext";

const WORKER_PRICE = 250;
const CAR_PRICE = 300;
const TOTAL_WORKERS_AVAILABLE = 20;

export default function AdReserveModal({ ad, onClose, onSuccess }) {
  const { user, profile } = useAuth();

  const [itemQtys, setItemQtys] = useState(() => {
    const init = {};
    (ad.items || []).forEach((it) => {
      init[it.category] = 0;
    });
    return init;
  });

  const [equipmentHours, setEquipmentHours] = useState({});
  const [workerCount, setWorkerCount] = useState(0);
  const [carCount, setCarCount] = useState(1); // ← افتراضي 1 (إجباري)
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const itemsWithTotals = useMemo(() => {
    return (ad.items || []).map((it) => {
      const available = Number(it.qty || 0) - Number(it.reservedQty || 0);
      const qty = Number(itemQtys[it.category] || 0);
      return {
        category: it.category,
        unitPrice: Number(it.unitPrice || 0),
        available,
        qty,
        subtotal: qty * Number(it.unitPrice || 0),
      };
    });
  }, [ad.items, itemQtys]);

  const itemsTotal = itemsWithTotals.reduce((s, it) => s + it.subtotal, 0);

  const equipmentWithTotals = useMemo(() => {
    return EQUIPMENT.map((eq) => {
      const hours = Number(equipmentHours[eq.id] || 0);
      return {
        id: eq.id,
        name: eq.name,
        pricePerHour: eq.pricePerHour,
        hours,
        subtotal: hours * eq.pricePerHour,
      };
    });
  }, [equipmentHours]);

  const equipmentTotal = equipmentWithTotals.reduce(
    (s, eq) => s + eq.subtotal,
    0
  );

  const workersTotal = Number(workerCount || 0) * WORKER_PRICE;
  const carsTotal = Number(carCount || 0) * CAR_PRICE;

  const grandTotal = itemsTotal + equipmentTotal + workersTotal + carsTotal;

  // الشروط الجديدة
  const hasAnyItem = itemsWithTotals.some((it) => it.qty > 0);
  const hasAnyEquipment = equipmentWithTotals.some((eq) => eq.hours > 0);
  const hasWorkers = Number(workerCount) > 0;
  const hasCars = Number(carCount) >= 1;

  // لازم سيارة + (صنف أو معدة أو عامل)
  const hasEquipmentOrWorkers = hasAnyEquipment || hasWorkers;
  const canSubmit =
    hasCars && (hasAnyItem || hasEquipmentOrWorkers);

  function setItemQty(category, value, max) {
    const num = Number(value || 0);
    if (num < 0) return;
    if (num > max) return;
    setItemQtys({ ...itemQtys, [category]: num });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!hasCars) {
      setError("عدد السيارات إجباري — لازم سيارة واحدة على الأقل");
      return;
    }
    if (!hasAnyItem && !hasEquipmentOrWorkers) {
      setError(
        "لازم تختار صنف واحد على الأقل، أو معدة، أو عامل"
      );
      return;
    }

    for (const it of itemsWithTotals) {
      if (it.qty > it.available) {
        setError(`الكمية المطلوبة من ${it.category} تتجاوز المتاح`);
        return;
      }
    }

    if (Number(workerCount) > TOTAL_WORKERS_AVAILABLE) {
      setError(`الحد الأقصى ${TOTAL_WORKERS_AVAILABLE} عامل`);
      return;
    }

    setSaving(true);
    try {
      await createAdReservation(
        {
          adId: ad.id,
          adTitle: ad.title,
          location: ad.location,
          items: itemsWithTotals.filter((it) => it.qty > 0),
          equipment: equipmentWithTotals.filter((eq) => eq.hours > 0),
          workerCount: Number(workerCount),
          workerUnitPrice: WORKER_PRICE,
          carCount: Number(carCount),
          carUnitPrice: CAR_PRICE,
          itemsTotal,
          equipmentTotal,
          workersTotal,
          carsTotal,
          grandTotal,
          traderName: profile?.name || user.displayName || user.email,
        },
        user
      );
      setDone(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("فشل إنشاء الحجز:", err);
      setError(
        err?.message
          ? `تعذر إنشاء الحجز: ${err.message}`
          : "تعذر إنشاء الحجز، حاول تاني"
      );
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="arm-backdrop" onClick={onClose}>
        <div className="arm-modal" onClick={(e) => e.stopPropagation()}>
          <div className="arm-success">
            <div className="arm-icon">✅</div>
            <h2>تم إرسال طلب الحجز</h2>
            <p>
              طلبك وصل للإدارة، وهيتم مراجعته قريباً. تقدر تتابع حالة الطلب من
              صفحة "حسابي → حجوزاتي".
            </p>
            <button className="btn btn-primary" onClick={onClose}>
              تمام
            </button>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="arm-backdrop" onClick={onClose}>
      <div className="arm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="arm-header">
          <div>
            <h2 className="arm-title">تأكيد الحجز</h2>
            <p className="arm-subtitle">
              عدّل الكميات وأضف المعدات والعمال والسيارات. السيارة إجبارية.
            </p>
          </div>
          <button
            className="arm-close"
            onClick={onClose}
            type="button"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* الأصناف */}
          <Section title="الأصناف (اختياري)">
            {itemsWithTotals.map((it) => (
              <div key={it.category} className="arm-row">
                <div className="arm-row-info">
                  <span className="arm-row-name">{it.category}</span>
                  <span className="arm-row-sub">
                    متاح {it.available} طن ·{" "}
                    {it.unitPrice.toLocaleString("ar-EG")}ج/طن
                  </span>
                </div>
                <div className="arm-row-input">
                  <input
                    type="number"
                    className="input arm-input"
                    min="0"
                    max={it.available}
                    step="1"
                    value={it.qty || ""}
                    onChange={(e) =>
                      setItemQty(it.category, e.target.value, it.available)
                    }
                    placeholder="0"
                  />
                  <span className="arm-unit">طن</span>
                </div>
                <div className="arm-row-total">
                  {it.subtotal > 0
                    ? it.subtotal.toLocaleString("ar-EG") + "ج"
                    : "—"}
                </div>
              </div>
            ))}
          </Section>

          {/* المعدات */}
          <Section title="المعدات (اختياري)">
            {equipmentWithTotals.map((eq) => (
              <div key={eq.id} className="arm-row">
                <div className="arm-row-info">
                  <span className="arm-row-name">{eq.name}</span>
                  <span className="arm-row-sub">
                    {eq.pricePerHour.toLocaleString("ar-EG")}ج/ساعة
                  </span>
                </div>
                <div className="arm-row-input">
                  <input
                    type="number"
                    className="input arm-input"
                    min="0"
                    step="1"
                    value={eq.hours || ""}
                    onChange={(e) =>
                      setEquipmentHours({
                        ...equipmentHours,
                        [eq.id]: e.target.value,
                      })
                    }
                    placeholder="0"
                  />
                  <span className="arm-unit">ساعة</span>
                </div>
                <div className="arm-row-total">
                  {eq.subtotal > 0
                    ? eq.subtotal.toLocaleString("ar-EG") + "ج"
                    : "—"}
                </div>
              </div>
            ))}
          </Section>

          {/* العمال */}
          <Section title="العمال (اختياري — بس إجباري معدة أو عامل)">
            <div className="arm-row">
              <div className="arm-row-info">
                <span className="arm-row-name">عدد العمال</span>
                <span className="arm-row-sub">
                  {WORKER_PRICE}ج للعامل · الحد الأقصى {TOTAL_WORKERS_AVAILABLE}
                </span>
              </div>
              <div className="arm-row-input">
                <input
                  type="number"
                  className="input arm-input"
                  min="0"
                  max={TOTAL_WORKERS_AVAILABLE}
                  step="1"
                  value={workerCount || ""}
                  onChange={(e) => setWorkerCount(e.target.value)}
                  placeholder="0"
                />
                <span className="arm-unit">عامل</span>
              </div>
              <div className="arm-row-total">
                {workersTotal > 0
                  ? workersTotal.toLocaleString("ar-EG") + "ج"
                  : "—"}
              </div>
            </div>
          </Section>

          {/* السيارات — إجباري */}
          <Section title="السيارات (إجباري)" required>
            <div className="arm-row">
              <div className="arm-row-info">
                <span className="arm-row-name">عدد السيارات</span>
                <span className="arm-row-sub">{CAR_PRICE}ج للسيارة</span>
              </div>
              <div className="arm-row-input">
                <input
                  type="number"
                  className="input arm-input"
                  min="1"
                  step="1"
                  value={carCount || ""}
                  onChange={(e) => setCarCount(e.target.value)}
                  placeholder="1"
                />
                <span className="arm-unit">سيارة</span>
              </div>
              <div className="arm-row-total">
                {carsTotal > 0 ? carsTotal.toLocaleString("ar-EG") + "ج" : "—"}
              </div>
            </div>
          </Section>

          {/* الإجماليات */}
          <div className="arm-summary">
            {itemsTotal > 0 && <SummaryRow label="الأصناف" value={itemsTotal} />}
            {equipmentTotal > 0 && (
              <SummaryRow label="المعدات" value={equipmentTotal} />
            )}
            {workersTotal > 0 && (
              <SummaryRow label="العمال" value={workersTotal} />
            )}
            {carsTotal > 0 && <SummaryRow label="السيارات" value={carsTotal} />}
            <div className="arm-grand-total">
              <span>الإجمالي</span>
              <span>{grandTotal.toLocaleString("ar-EG")}ج</span>
            </div>
          </div>

          {!canSubmit && (
            <p className="arm-hint">
              ⚠️ لازم تختار: سيارة واحدة على الأقل + (صنف أو معدة أو عامل)
            </p>
          )}

          {error && <p className="arm-error">{error}</p>}

          <div className="arm-actions">
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
              disabled={saving || !canSubmit}
            >
              {saving ? "جاري الإرسال..." : "تأكيد الحجز"}
            </button>
          </div>

          <p className="arm-note">
            ملاحظة: الحجز هيتأكد نهائياً بعد موافقة الإدارة.
          </p>
        </form>
      </div>

      <style>{styles}</style>
    </div>
  );
}

function Section({ title, children, required }) {
  return (
    <div className="arm-section">
      <h3 className="arm-section-title">
        {title}
        {required && <span className="arm-req"> *</span>}
      </h3>
      <div className="arm-section-body">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="arm-summary-row">
      <span>{label}</span>
      <span>{value.toLocaleString("ar-EG")}ج</span>
    </div>
  );
}

const styles = `
  .arm-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(10, 18, 16, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 95;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: arm-fade .2s ease;
  }
  @keyframes arm-fade {
    from { opacity: 0 }
    to { opacity: 1 }
  }
  .arm-modal {
    background: var(--paper-raised);
    color: var(--ink);
    border-radius: 16px;
    padding: 22px;
    width: 100%;
    max-width: 560px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
    animation: arm-pop .25s cubic-bezier(0.22, 0.61, 0.36, 1);
    max-height: 92vh;
    overflow-y: auto;
  }
  @keyframes arm-pop {
    from { transform: scale(0.95); opacity: 0 }
    to { transform: scale(1); opacity: 1 }
  }
  .arm-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }
  .arm-title {
    margin: 0 0 4px;
    font-size: 19px;
    font-weight: 900;
  }
  .arm-subtitle {
    margin: 0;
    font-size: 12.5px;
    color: var(--steel);
    line-height: 1.6;
  }
  .arm-close {
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
  .arm-close:hover {
    background: var(--paper-sunken);
  }
  .arm-section {
    margin-bottom: 16px;
    padding: 12px;
    background: var(--paper-sunken);
    border-radius: 10px;
  }
  .arm-section-title {
    margin: 0 0 8px;
    font-size: 12.5px;
    font-weight: 800;
    color: var(--steel);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .arm-req {
    color: var(--danger);
    font-weight: 900;
  }
  .arm-section-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .arm-row {
    display: grid;
    grid-template-columns: 1fr auto 80px;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }
  .arm-row:last-child {
    border-bottom: none;
  }
  .arm-row-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .arm-row-name {
    font-size: 13.5px;
    font-weight: 700;
  }
  .arm-row-sub {
    font-size: 11.5px;
    color: var(--steel);
  }
  .arm-row-input {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .arm-input {
    width: 70px;
    padding: 6px 8px;
    text-align: center;
    font-size: 13px;
  }
  .arm-unit {
    font-size: 11px;
    color: var(--steel-light);
    white-space: nowrap;
  }
  .arm-row-total {
    text-align: end;
    font-weight: 700;
    font-size: 13px;
    color: var(--ink);
    white-space: nowrap;
  }
  .arm-summary {
    margin-top: 8px;
    padding-top: 12px;
    border-top: 2px solid var(--ink);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .arm-summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--steel);
  }
  .arm-grand-total {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
    font-size: 15px;
    font-weight: 700;
  }
  .arm-grand-total span:last-child {
    font-size: 20px;
    font-weight: 900;
  }
  .arm-hint {
    margin: 10px 0 0;
    padding: 8px 12px;
    background: var(--crane-light);
    color: var(--crane);
    font-size: 12px;
    border-radius: 8px;
    line-height: 1.6;
  }
  .arm-error {
    margin: 12px 0 0;
    padding: 8px 12px;
    background: var(--danger-light);
    color: var(--danger);
    font-size: 12.5px;
    border-radius: 8px;
    line-height: 1.5;
  }
  .arm-actions {
    display: flex;
    gap: 8px;
    margin-top: 14px;
  }
  .arm-actions .btn {
    flex: 1;
  }
  .arm-note {
    font-size: 11.5px;
    color: var(--steel-light);
    margin: 10px 0 0;
    text-align: center;
    line-height: 1.6;
  }
  .arm-success {
    text-align: center;
    padding: 10px 0;
  }
  .arm-icon {
    font-size: 46px;
    margin-bottom: 6px;
  }
  .arm-success h2 {
    margin: 0 0 8px;
    font-size: 19px;
    font-weight: 900;
  }
  .arm-success p {
    margin: 0 0 20px;
    font-size: 13px;
    color: var(--steel);
    line-height: 1.7;
  }
  @media (max-width: 480px) {
    .arm-modal {
      padding: 16px;
      border-radius: 12px;
    }
    .arm-row {
      grid-template-columns: 1fr auto;
      grid-template-areas:
        "info input"
        "total total";
      gap: 6px;
    }
    .arm-row-info { grid-area: info; }
    .arm-row-input { grid-area: input; }
    .arm-row-total { grid-area: total; text-align: start; }
  }
`;
