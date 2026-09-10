import { useState } from "react";
import { SALE_TYPES } from "../lib/catalog";

export default function ListingCard({ listing, tonPrice, piecePrice, canReserve, onReserve }) {
  const [qty, setQty] = useState(1);

  const total = Number(listing.quantity || 0);
  const reserved = Number(listing.reservedQty || 0);
  const available = total - reserved;

  let priceLabel = "";
  let qtyLabel = "";

  if (listing.saleType === SALE_TYPES.TON) {
    qtyLabel = `متاح: ${available} من ${total} طن`;
    if (tonPrice) priceLabel = `${Number(tonPrice).toLocaleString("ar-EG")}ج/طن`;
  } else if (listing.saleType === SALE_TYPES.LOT) {
    qtyLabel = reserved >= 1 ? "تم حجزه بالكامل" : "لوط واحد";
    priceLabel = `${Number(listing.lotPrice).toLocaleString("ar-EG")}ج`;
  } else if (listing.saleType === SALE_TYPES.PIECE) {
    qtyLabel = `متاح: ${available} من ${total} قطعة`;
    const pp = listing.piecePrice || piecePrice;
    if (pp) priceLabel = `${Number(pp).toLocaleString("ar-EG")}ج/قطعة`;
  }

  const soldOut = available <= 0 && listing.saleType !== SALE_TYPES.LOT;
  const lotTaken = listing.saleType === SALE_TYPES.LOT && reserved >= 1;

  return (
    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, textAlign: "center" }}>
      <p style={{ fontSize: 14, fontWeight: 700, margin: "4px 0 2px" }}>{listing.category}</p>
      <p style={{ fontSize: 12, color: "var(--steel)", margin: "0 0 4px" }}>{qtyLabel}</p>
      {priceLabel && <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>{priceLabel}</p>}

      {listing.saleType !== SALE_TYPES.LOT && !soldOut && canReserve && (
        <input
          type="number"
          min="1"
          max={available}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          style={{ width: "100%", marginBottom: 8, textAlign: "center" }}
        />
      )}

      <button
        className="btn"
        style={{ fontSize: 12, padding: "6px 16px", width: "100%" }}
        onClick={() => onReserve(qty)}
        disabled={soldOut || lotTaken}
      >
        {soldOut || lotTaken ? "غير متاح" : "حجز"}
      </button>
    </div>
  );
}
