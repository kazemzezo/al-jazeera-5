import { SALE_TYPES } from "../lib/catalog";

export default function ListingCard({ listing, tonPrice, canReserve, onReserve }) {
  let priceLabel = "";
  let qtyLabel = "";

  if (listing.saleType === SALE_TYPES.TON) {
    qtyLabel = `${listing.quantity} طن متاح`;
    if (tonPrice) {
      const total = tonPrice * listing.quantity;
      priceLabel = `${total.toLocaleString("ar-EG")}ج`;
    }
  } else if (listing.saleType === SALE_TYPES.LOT) {
    qtyLabel = "لوط واحد";
    priceLabel = `${Number(listing.lotPrice).toLocaleString("ar-EG")}ج`;
  } else if (listing.saleType === SALE_TYPES.PIECE) {
    qtyLabel = `${listing.quantity} قطعة`;
    if (listing.piecePrice) {
      const total = listing.piecePrice * listing.quantity;
      priceLabel = `${total.toLocaleString("ar-EG")}ج`;
    }
  }

  return (
    <div
      style={{
        background: "var(--paper-raised)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: 14,
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 700, margin: "4px 0 2px" }}>
        {listing.category}
      </p>
      <p style={{ fontSize: 12, color: "var(--steel)", margin: "0 0 6px" }}>
        {qtyLabel}
      </p>
      {priceLabel && (
        <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>
          {priceLabel}
        </p>
      )}
      <button
        className="btn"
        style={{ fontSize: 12, padding: "6px 16px", width: "100%" }}
        onClick={onReserve}
        disabled={!canReserve}
      >
        {canReserve ? "حجز" : "للاطلاع فقط"}
      </button>
    </div>
  );
}
