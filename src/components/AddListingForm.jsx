import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  SALE_TYPES,
  categoriesForSaleType,
  LOCATIONS,
} from "../lib/catalog";
import { createListing, postAnnouncement } from "../lib/listings";

export default function AddListingForm({ location }) {
  const { user } = useAuth();
  const [saleType, setSaleType] = useState(SALE_TYPES.TON);
  const [category, setCategory] = useState(categoriesForSaleType(SALE_TYPES.TON)[0]);
  const [quantity, setQuantity] = useState(1);
  const [lotPrice, setLotPrice] = useState("");
  const [piecePrice, setPiecePrice] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  function handleSaleTypeChange(v) {
    setSaleType(v);
    setCategory(categoriesForSaleType(v)[0]);
  }

  async function handleAddListing(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { location, saleType, category };
      if (saleType === SALE_TYPES.TON) payload.quantity = Number(quantity);
      if (saleType === SALE_TYPES.LOT) payload.lotPrice = Number(lotPrice);
      if (saleType === SALE_TYPES.PIECE) {
        payload.quantity = Number(quantity);
        payload.piecePrice = Number(piecePrice);
      }
      await createListing(payload, user);
      setQuantity(1);
      setLotPrice("");
      setPiecePrice("");
    } finally {
      setBusy(false);
    }
  }

  async function handleAnnouncement(e) {
    e.preventDefault();
    if (!announcement.trim()) return;
    setBusy(true);
    try {
      await postAnnouncement(location, announcement.trim(), user);
      setAnnouncement("");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)} style={{ marginBottom: 20 }}>
        + إضافة صنف / إعلان
      </button>
    );
  }

  return (
    <div
      style={{
        border: "1px dashed var(--line)",
        borderRadius: "var(--radius)",
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 14 }}>إضافة صنف جديد</strong>
        <button className="btn" style={{ padding: "2px 10px", fontSize: 12 }} onClick={() => setOpen(false)}>
          إغلاق
        </button>
      </div>

      <form onSubmit={handleAddListing} style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <select value={saleType} onChange={(e) => handleSaleTypeChange(e.target.value)}>
          <option value={SALE_TYPES.TON}>يُباع بالطن</option>
          <option value={SALE_TYPES.LOT}>يُباع باللوط</option>
          <option value={SALE_TYPES.PIECE}>يُباع بالقطعة</option>
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categoriesForSaleType(saleType).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {saleType === SALE_TYPES.TON && (
          <input
            type="number"
            min="1"
            max="20"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="عدد الأطنان"
            style={{ width: 120 }}
          />
        )}

        {saleType === SALE_TYPES.LOT && (
          <input
            type="number"
            min="0"
            value={lotPrice}
            onChange={(e) => setLotPrice(e.target.value)}
            placeholder="سعر اللوط بالكامل"
            style={{ width: 160 }}
          />
        )}

        {saleType === SALE_TYPES.PIECE && (
          <>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="عدد القطع"
              style={{ width: 110 }}
            />
            <input
              type="number"
              min="0"
              value={piecePrice}
              onChange={(e) => setPiecePrice(e.target.value)}
              placeholder="سعر القطعة"
              style={{ width: 110 }}
            />
          </>
        )}

        <button className="btn btn-primary" type="submit" disabled={busy}>
          إضافة الصنف
        </button>
      </form>

      <form onSubmit={handleAnnouncement} style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <input
          type="text"
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="اكتب إعلانًا (مثال: يوجد 10 طن حديد متاح غدًا)"
          style={{ flex: 1 }}
        />
        <button className="btn" type="submit" disabled={busy}>
          نشر الإعلان
        </button>
      </form>
    </div>
  );
}
