import { useEffect, useState } from "react";
import { subscribeTonPrices } from "../lib/listings";
import { TON_CATEGORIES } from "../lib/catalog";

export default function PriceBar() {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const unsub = subscribeTonPrices(setPrices);
    return () => unsub();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        background: "var(--paper-raised)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius)",
        padding: "10px 12px",
        marginBottom: 20,
      }}
    >
      {TON_CATEGORIES.map((cat) => {
        const p = prices[cat]?.pricePerTon;
        return (
          <div
            key={cat}
            style={{
              whiteSpace: "nowrap",
              fontSize: 13,
              color: "var(--steel)",
              padding: "4px 10px",
              background: "var(--paper)",
              borderRadius: 8,
            }}
          >
            {cat}{" "}
            <b style={{ color: "var(--ink)" }}>
              {p ? `${Number(p).toLocaleString("ar-EG")}ج` : "—"}
            </b>
          </div>
        );
      })}
    </div>
  );
}
