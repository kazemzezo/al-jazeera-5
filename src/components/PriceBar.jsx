import { useEffect, useState } from "react";
import { subscribeTonPrices } from "../lib/listings";
import { TON_CATEGORIES } from "../lib/catalog";
import { DEMO_TON_PRICES } from "../lib/demoData";

export default function PriceBar() {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const unsub = subscribeTonPrices(setPrices);
    return () => unsub();
  }, []);

  const displayPrices = Object.keys(prices).length > 0 ? prices : DEMO_TON_PRICES;
  const isDemo = Object.keys(prices).length === 0;

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
        alignItems: "center",
      }}
    >
      {isDemo && (
        <span style={{ fontSize: 11, color: "var(--steel-light)", whiteSpace: "nowrap" }}>
          (تجريبي)
        </span>
      )}
      {TON_CATEGORIES.map((cat) => {
        const p = displayPrices[cat]?.pricePerTon;
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
