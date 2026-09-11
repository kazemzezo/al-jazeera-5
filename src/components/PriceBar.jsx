import { useEffect, useState } from "react";
import { subscribeTonPrices, getPriceDirection } from "../lib/listings";
import { TON_CATEGORIES } from "../lib/catalog";
import { DEMO_TON_PRICES } from "../lib/demoData";

// ألوان المؤشرات (مختارة بعناية)
const COLORS = {
  up: {
    bar: "#16a34a",
    text: "#16a34a",
    bg: "rgba(22, 163, 74, 0.08)",
    icon: "▲",
    label: "ارتفع",
  },
  down: {
    bar: "#dc2626",
    text: "#dc2626",
    bg: "rgba(220, 38, 38, 0.08)",
    icon: "▼",
    label: "انخفض",
  },
  stable: {
    bar: "#f59e0b",
    text: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.08)",
    icon: "▬",
    label: "ثابت",
  },
};

export default function PriceBar() {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const unsub = subscribeTonPrices(setPrices);
    return () => unsub();
  }, []);

  const displayPrices =
    Object.keys(prices).length > 0 ? prices : DEMO_TON_PRICES;

  return (
    <div className="pb-bar">
      {TON_CATEGORIES.map((cat) => {
        const data = displayPrices[cat];
        if (!data) return null;
        const p = Number(data.pricePerTon || 0);
        const direction = getPriceDirection(data);
        const colors = COLORS[direction];

        return (
          <div
            key={cat}
            className="pb-chip"
            style={{ background: colors.bg }}
            title={`${colors.label} — ${cat}`}
          >
            <span
              className="pb-chip-bar"
              style={{ background: colors.bar }}
            />
            <span className="pb-chip-category">{cat}</span>
            <b className="pb-chip-price">
              {p ? `${p.toLocaleString("ar-EG")}ج` : "—"}
            </b>
            <span
              className="pb-chip-icon"
              style={{ color: colors.text }}
            >
              {colors.icon}
            </span>
          </div>
        );
      })}

      <style>{`
        .pb-bar {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 10px 12px;
          margin-bottom: 20px;
          align-items: center;
          scrollbar-width: thin;
        }
        .pb-bar::-webkit-scrollbar {
          height: 6px;
        }
        .pb-bar::-webkit-scrollbar-thumb {
          background: var(--line-strong);
          border-radius: 3px;
        }
        .pb-chip {
          position: relative;
          white-space: nowrap;
          font-size: 13px;
          padding: 6px 12px 6px 14px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background .3s;
          flex-shrink: 0;
        }
        .pb-chip-bar {
          position: absolute;
          inset-inline-start: 4px;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          border-radius: 2px;
        }
        .pb-chip-category {
          color: var(--steel);
          font-weight: 500;
        }
        .pb-chip-price {
          color: var(--ink);
          font-weight: 900;
        }
        .pb-chip-icon {
          font-size: 11px;
          font-weight: 900;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}
