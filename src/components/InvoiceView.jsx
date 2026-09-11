import { LOCATIONS } from "../lib/catalog";

function fmt(n) {
  return Number(n || 0).toLocaleString("ar-EG") + "ج";
}

export default function InvoiceView({ invoice, onBack, adminActions }) {
  const isCalculator = invoice.type === "calculator";
  const isAd = invoice.type === "ad";

  const locationLabel =
    invoice.location === LOCATIONS.DOCK ? "الرصيف البحري" : "ساحة الجزيره";

  const dateLabel =
    invoice.date ||
    invoice.createdAt?.toDate?.().toLocaleDateString("ar-EG") ||
    "—";

  const invoiceNumber = invoice.invoiceId || invoice.id || "—";

  return (
    <div>
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {onBack && (
            <button className="btn" onClick={onBack}>
              عودة
            </button>
          )}
          <button className="btn btn-primary" onClick={() => window.print()}>
            طباعة / حفظ PDF
          </button>
        </div>
        {adminActions && (
          <div style={{ display: "flex", gap: 8 }}>{adminActions}</div>
        )}
      </div>

      <div
        id="invoice-print"
        style={{
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          padding: 24,
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 20,
            borderBottom: "2px solid var(--ink)",
            paddingBottom: 16,
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>
            فاتورة الجزيره خمسه
          </h1>
          <p style={{ fontSize: 12, color: "var(--steel)", margin: 0 }}>
            رقم الفاتورة: {invoiceNumber} · التاريخ: {dateLabel}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
            fontSize: 13,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>
            <b>اسم التاجر:</b> {invoice.traderName || "—"}
          </span>
          <span>
            <b>الموقع:</b> {locationLabel}
          </span>
        </div>

        {isCalculator && <CalculatorContent invoice={invoice} />}
        {isAd && <AdContent invoice={invoice} />}
        {!isCalculator && !isAd && <ListingContent invoice={invoice} />}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 20,
            paddingTop: 16,
            borderTop: "2px solid var(--ink)",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700 }}>الإجمالي الكلي</span>
          <span style={{ fontSize: 24, fontWeight: 900 }}>
            {fmt(invoice.grandTotal)}
          </span>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print, #invoice-print * { visibility: visible !important; }
          #invoice-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            right: 0 !important;
            width: 100% !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 16px !important;
            margin: 0 !important;
            background: #fff !important;
            color: #000 !important;
          }
          #invoice-print { page-break-inside: avoid; }
          @page { margin: 12mm; }
        }
      `}</style>
    </div>
  );
}

function CalculatorContent({ invoice }) {
  const scrapRows = invoice.scrapRows || [];
  const equipmentRows = invoice.equipmentRows || [];

  return (
    <>
      {scrapRows.length > 0 && (
        <Group title="أسعار الأصناف">
          {scrapRows.map((r, i) => (
            <Line key={i} label={`${r.category} - ${r.tons} طن`} value={r.total} />
          ))}
        </Group>
      )}

      {(equipmentRows.length > 0 || invoice.loadingTotal > 0) && (
        <Group title="الرسوم الإيجارية للمعدات والعمالة">
          {equipmentRows.map((r, i) => (
            <Line key={i} label={`${r.name} - ${r.hours} ساعة`} value={r.total} />
          ))}
          {invoice.loadingTotal > 0 && (
            <Line
              label={`تحميل ${invoice.loadingTons} طن × ${fmt(
                invoice.loadingPricePerTon
              )}${invoice.workerCount > 0 ? ` (${invoice.workerCount} عامل)` : ""}`}
              value={invoice.loadingTotal}
            />
          )}
        </Group>
      )}

      <Group title="رسوم الرصيف">
        <Line
          label={`صيانة الرصيف (${invoice.carCount} سيارة × ${fmt(
            invoice.maintenanceFee
          )})`}
          value={invoice.maintenanceTotal}
        />
      </Group>
    </>
  );
}

// ✅ جديد: عرض حجز إعلان الرصيف
function AdContent({ invoice }) {
  const items = invoice.items || [];
  const equipment = invoice.equipment || [];
  const workerCount = Number(invoice.workerCount || 0);
  const carCount = Number(invoice.carCount || 0);

  return (
    <>
      {invoice.adTitle && (
        <div
          style={{
            padding: "8px 12px",
            background: "var(--paper-sunken)",
            borderRadius: 8,
            marginBottom: 14,
            fontSize: 12.5,
            color: "var(--steel)",
          }}
        >
          <b style={{ color: "var(--ink)" }}>الإعلان:</b> {invoice.adTitle}
        </div>
      )}

      {items.length > 0 && (
        <Group title="الأصناف">
          {items.map((r, i) => (
            <InvoiceLine
              key={i}
              label={`${r.category} - ${r.qty} طن × ${fmt(r.unitPrice)}`}
              value={r.subtotal}
            />
          ))}
        </Group>
      )}

      {equipment.length > 0 && (
        <Group title="المعدات">
          {equipment.map((r, i) => (
            <InvoiceLine
              key={i}
              label={`${r.name} - ${r.hours} ساعة × ${fmt(r.pricePerHour)}`}
              value={r.subtotal}
            />
          ))}
        </Group>
      )}

      {(workerCount > 0 || carCount > 0) && (
        <Group title="عمالة وسيارات">
          {workerCount > 0 && (
            <InvoiceLine
              label={`عمال (${workerCount} × ${fmt(invoice.workerUnitPrice)})`}
              value={invoice.workersTotal}
            />
          )}
          {carCount > 0 && (
            <InvoiceLine
              label={`سيارات (${carCount} × ${fmt(invoice.carUnitPrice)})`}
              value={invoice.carsTotal}
            />
          )}
        </Group>
      )}
    </>
  );
}

function ListingContent({ invoice }) {
  const qtyLabel =
    invoice.saleType === "lot"
      ? "لوط كامل"
      : invoice.saleType === "piece"
      ? `${invoice.qty} قطعة`
      : `${invoice.qty} طن`;

  return (
    <Group title="تفاصيل الحجز">
      <Line label={`الصنف: ${invoice.category || "—"}`} value="" />
      <Line label={`الكمية: ${qtyLabel}`} value="" />
      {invoice.unitPrice > 0 && (
        <Line
          label={`سعر الوحدة × الكمية = ${fmt(invoice.unitPrice)} × ${invoice.qty}`}
          value={invoice.subtotal}
        />
      )}
    </Group>
  );
}

function Group({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--steel)",
          borderBottom: "1px solid var(--line)",
          paddingBottom: 6,
          marginBottom: 8,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function InvoiceLine({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        padding: "4px 0",
      }}
    >
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>{fmt(value)}</span>
    </div>
  );
}

function Line({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        padding: "4px 0",
      }}
    >
      <span>{label}</span>
      {value !== "" && <span style={{ fontWeight: 700 }}>{fmt(value)}</span>}
    </div>
  );
}
