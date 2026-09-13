import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { subscribeWallet, subscribeWalletTransactions } from "../lib/wallet";
import { subscribeSettings, getMinBalance } from "../lib/settings";

const TRANSACTION_LABELS = {
  deposit: { label: "إضافة", icon: "➕", color: "var(--kabbash)" },
  deduction: { label: "خصم", icon: "➖", color: "var(--danger)" },
  refund: { label: "استرداد", icon: "↩️", color: "var(--kabbash)" },
  weight_add: { label: "تعويض نقص وزن", icon: "⚖️", color: "var(--kabbash)" },
  weight_remove: { label: "فرق وزن", icon: "⚖️", color: "var(--danger)" },
  adjust: { label: "تعديل", icon: "🔧", color: "var(--steel)" },
  adjustment: { label: "تعديل", icon: "🔧", color: "var(--steel)" },
  suspend: { label: "تعليق", icon: "⏸️", color: "var(--danger)" },
  activate: { label: "تفعيل", icon: "▶️", color: "var(--kabbash)" },
};

export default function WalletCard({ showFullHistory = false }) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(showFullHistory);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const unsubWallet = subscribeWallet(user.uid, (w) => {
      setWallet(w);
      setLoading(false);
    });
    const unsubTx = subscribeWalletTransactions(user.uid, setTransactions);
    return () => {
      unsubWallet();
      unsubTx();
    };
  }, [user]);

  useEffect(() => {
    const unsub = subscribeSettings(setSettings);
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          padding: 18,
          marginBottom: 16,
          textAlign: "center",
          color: "var(--steel)",
          fontSize: 13,
        }}
      >
        جاري تحميل المحفظة...
      </div>
    );
  }

  if (!wallet) {
    return null;
  }

  const minBalance = getMinBalance(wallet.type, settings);
  const isBelowMin = wallet.balance < minBalance;
  const isSuspended = wallet.status === "suspended";
  const typeLabel = wallet.type === "dock" ? "تاجر رصيف" : "تاجر ساحة";

  const displayedTx = showAll ? transactions : transactions.slice(0, 5);

  return (
    <div
      style={{
        background: "var(--paper-raised)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        padding: 18,
        marginBottom: 16,
      }}
    >
      {/* رأس الكارت */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, margin: "0 0 4px" }}>
            💼 محفظتي
          </p>
          <p
            style={{
              fontSize: 11.5,
              color: "var(--steel)",
              margin: 0,
            }}
          >
            {typeLabel}
            {wallet.code && (
              <>
                {" · "}
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "var(--kabbash)",
                  }}
                >
                  {wallet.code}
                </span>
              </>
            )}
          </p>
        </div>
        {isSuspended && (
          <span
            className="badge badge-danger"
            style={{ padding: "4px 10px", fontSize: 11.5 }}
          >
            ⏸️ معلّقة
          </span>
        )}
      </div>

      {/* الرصيد */}
      <div
        style={{
          background: isBelowMin
            ? "var(--danger-light)"
            : "var(--kabbash-light)",
          border: `1.5px solid ${isBelowMin ? "var(--danger)" : "var(--kabbash)"}`,
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: isBelowMin ? "var(--danger)" : "var(--kabbash)",
            }}
          >
            💰 الرصيد الحالي
          </span>
          <span
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: isBelowMin ? "var(--danger)" : "var(--kabbash)",
            }}
          >
            {Number(wallet.balance).toLocaleString("ar-EG")}ج
          </span>
        </div>

        {isBelowMin && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: `1px dashed ${isBelowMin ? "var(--danger)" : "var(--kabbash)"}`,
              fontSize: 12,
              color: "var(--danger)",
              lineHeight: 1.7,
            }}
          >
            ⚠️ <b>تنبيه:</b> رصيدك أقل من الحد الأدنى (
            {Number(minBalance).toLocaleString("ar-EG")}ج). لازم تعيد شحن
            المحفظة قبل الحجز القادم.
          </div>
        )}

        {!isBelowMin && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 11,
              color: "var(--kabbash)",
              opacity: 0.85,
            }}
          >
            الحد الأدنى المطلوب: {Number(minBalance).toLocaleString("ar-EG")}ج
          </p>
        )}
      </div>

      {/* آخر العمليات */}
      <div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 800,
            margin: "0 0 8px",
            color: "var(--steel)",
          }}
        >
          📜 {showAll ? "كل العمليات" : "آخر العمليات"}
        </p>

        {displayedTx.length === 0 ? (
          <p
            style={{
              fontSize: 12.5,
              color: "var(--steel-light)",
              margin: 0,
              textAlign: "center",
              padding: "10px 0",
            }}
          >
            لا توجد عمليات بعد.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
          >
            {displayedTx.map((tx) => {
              const meta =
                TRANSACTION_LABELS[tx.type] || {
                  label: tx.type || "عملية",
                  icon: "•",
                  color: "var(--steel)",
                };
              const isPositive =
                tx.type === "deposit" ||
                tx.type === "refund" ||
                tx.type === "weight_add";
              const sign = isPositive ? "+" : "-";
              const amount = Number(tx.amount || 0);
              const dateLabel =
                tx.createdAt?.toDate?.().toLocaleString("ar-EG") || "—";

              return (
                <div
                  key={tx.id}
                  style={{
                    background: "var(--paper-sunken)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 12.5,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 2,
                      }}
                    >
                      <span>{meta.icon}</span>
                      <b style={{ color: meta.color }}>{meta.label}</b>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11.5,
                        color: "var(--steel)",
                        lineHeight: 1.5,
                      }}
                    >
                      {tx.reason || "—"}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 10.5,
                        color: "var(--steel-light)",
                      }}
                    >
                      {dateLabel}
                    </p>
                  </div>
                  {amount > 0 && (
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 900,
                        color: isPositive
                          ? "var(--kabbash)"
                          : "var(--danger)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sign} {amount.toLocaleString("ar-EG")}ج
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!showAll && transactions.length > 5 && (
          <button
            className="btn"
            style={{
              width: "100%",
              marginTop: 10,
              fontSize: 12,
              padding: "6px 12px",
            }}
            onClick={() => setShowAll(true)}
          >
            عرض كل العمليات ({transactions.length})
          </button>
        )}

        {showAll && transactions.length > 5 && (
          <button
            className="btn"
            style={{
              width: "100%",
              marginTop: 10,
              fontSize: 12,
              padding: "6px 12px",
            }}
            onClick={() => setShowAll(false)}
          >
            إخفاء السجل الكامل
          </button>
        )}
      </div>
    </div>
  );
}
