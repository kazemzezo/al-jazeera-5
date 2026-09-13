import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  subscribeAllWallets,
  subscribeAllWalletTransactions,
  addToWallet,
  deductFromWallet,
  suspendWallet,
  activateWallet,
} from "../lib/wallet";
import { subscribeSettings, calcMissingPaymentFee } from "../lib/settings";
import { subscribeAllUsers } from "../lib/users";

const TX_LABELS = {
  deposit: { label: "إضافة", icon: "➕" },
  deduction: { label: "خصم", icon: "➖" },
  refund: { label: "استرداد", icon: "↩️" },
  weight_add: { label: "تعويض نقص وزن", icon: "⚖️" },
  weight_remove: { label: "فرق وزن", icon: "⚖️" },
  adjust: { label: "تعديل", icon: "🔧" },
  adjustment: { label: "تعديل", icon: "🔧" },
  suspend: { label: "تعليق", icon: "⏸️" },
  activate: { label: "تفعيل", icon: "▶️" },
};

export default function AdminWalletsTab() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  // modalMode: "add" | "deduct" | "history" | null

  useEffect(() => {
    const unsubW = subscribeAllWallets((items) => {
      setWallets(items);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("تعذر تحميل المحافظ");
      setLoading(false);
    });
    const unsubT = subscribeAllWalletTransactions(setTransactions);
    const unsubS = subscribeSettings(setSettings);
    const unsubU = subscribeAllUsers(setUsers);
    return () => {
      unsubW();
      unsubT();
      unsubS();
      unsubU();
    };
  }, []);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach((u) => {
      m[u.id] = u;
    });
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    let list = wallets;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((w) => {
        const u = userMap[w.uid] || {};
        return (
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.phone || "").includes(q) ||
          (w.code || "").toLowerCase().includes(q)
        );
      });
    }
    if (statusFilter !== "all") {
      list = list.filter((w) => w.status === statusFilter);
    }
    if (typeFilter !== "all") {
      list = list.filter((w) => w.type === typeFilter);
    }
    return list;
  }, [wallets, userMap, search, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const total = wallets.length;
    const active = wallets.filter((w) => w.status === "active").length;
    const suspended = wallets.filter((w) => w.status === "suspended").length;
    const totalBalance = wallets.reduce(
      (s, w) => s + Number(w.balance || 0),
      0
    );
    return { total, active, suspended, totalBalance };
  }, [wallets]);

  function showSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleActionComplete(msg) {
    showSuccess(msg);
    setModalMode(null);
    setSelected(null);
  }

  if (loading) {
    return <div className="page-loading">جاري التحميل...</div>;
  }

  return (
    <div>
      {/* إحصائيات */}
      <div className="wallet-stats">
        <div className="wallet-stat">
          <div className="wallet-stat-label">📊 إجمالي المحافظ</div>
          <div className="wallet-stat-value">{stats.total}</div>
        </div>
        <div className="wallet-stat success">
          <div className="wallet-stat-label">✅ نشطة</div>
          <div className="wallet-stat-value">{stats.active}</div>
        </div>
        <div className="wallet-stat danger">
          <div className="wallet-stat-label">⏸️ معلّقة</div>
          <div className="wallet-stat-value">{stats.suspended}</div>
        </div>
        <div className="wallet-stat">
          <div className="wallet-stat-label">💰 إجمالي الأرصدة</div>
          <div className="wallet-stat-value">
            {stats.totalBalance.toLocaleString("ar-EG")}
            <span className="wallet-stat-unit">ج</span>
          </div>
        </div>
      </div>

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
          ✅ {success}
        </div>
      )}

      {/* البحث والفلاتر */}
      <input
        className="input"
        placeholder="ابحث بالاسم أو الإيميل أو الكود..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 10 }}
      />

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        {[
          { k: "all", label: "الكل" },
          { k: "active", label: "نشطة" },
          { k: "suspended", label: "معلّقة" },
        ].map((s) => (
          <button
            key={s.k}
            className="btn"
            style={{
              fontSize: 12,
              padding: "5px 12px",
              background: statusFilter === s.k ? "var(--ink)" : "transparent",
              color: statusFilter === s.k ? "var(--paper)" : "var(--ink)",
              borderColor:
                statusFilter === s.k ? "var(--ink)" : "var(--line)",
            }}
            onClick={() => setStatusFilter(s.k)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {[
          { k: "all", label: "كل الأنواع" },
          { k: "dock", label: "رصيف" },
          { k: "yard", label: "ساحة" },
        ].map((s) => (
          <button
            key={s.k}
            className="btn"
            style={{
              fontSize: 12,
              padding: "5px 12px",
              background: typeFilter === s.k ? "var(--kabbash)" : "transparent",
              color: typeFilter === s.k ? "#fff" : "var(--ink)",
              borderColor:
                typeFilter === s.k ? "var(--kabbash)" : "var(--line)",
            }}
            onClick={() => setTypeFilter(s.k)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* القائمة */}
      {filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--steel)" }}>
          {wallets.length === 0
            ? "مفيش محافظ بعد — تظهر أول لما يتم توثيق تاجر."
            : "لا توجد نتائج مطابقة."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((w) => {
            const u = userMap[w.uid] || {};
            const isSuspended = w.status === "suspended";
            const isBelowMin =
              settings &&
              Number(w.balance) <
                Number(w.type === "dock" ? settings.dockFee : settings.yardFee);

            return (
              <div
                key={w.id}
                style={{
                  background: "var(--paper-raised)",
                  border: `1px solid ${
                    isSuspended ? "var(--danger)" : "var(--line)"
                  }`,
                  borderRadius: "var(--radius)",
                  padding: 14,
                  opacity: isSuspended ? 0.85 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 220, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 4,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {u.name || "بدون اسم"}
                      </p>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            w.type === "yard"
                              ? "var(--crane-light)"
                              : "var(--kabbash-light)",
                          color:
                            w.type === "yard"
                              ? "var(--crane)"
                              : "var(--kabbash)",
                        }}
                      >
                        {w.type === "yard" ? "🏭 ساحة" : "⚓ رصيف"}
                      </span>
                      {isSuspended && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            background: "var(--danger-light)",
                            color: "var(--danger)",
                          }}
                        >
                          ⏸️ معلّقة
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: 12.5,
                        color: "var(--steel)",
                      }}
                    >
                      {u.email || "—"}
                    </p>

                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "var(--steel)",
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      {u.phone && <span>📞 {u.phone}</span>}
                      {w.code && (
                        <span>
                          🔑{" "}
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 700,
                              color: "var(--kabbash)",
                            }}
                          >
                            {w.code}
                          </span>
                        </span>
                      )}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 6,
                      minWidth: 140,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: isBelowMin
                          ? "var(--danger)"
                          : "var(--kabbash)",
                      }}
                    >
                      {Number(w.balance || 0).toLocaleString("ar-EG")}ج
                    </div>
                    {isBelowMin && (
                      <span
                        style={{
                          fontSize: 10.5,
                          color: "var(--danger)",
                          fontWeight: 700,
                        }}
                      >
                        ⚠️ أقل من الحد الأدنى
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px dashed var(--line)",
                  }}
                >
                  <button
                    className="btn"
                    style={{
                      fontSize: 12,
                      padding: "5px 12px",
                      color: "var(--kabbash)",
                      borderColor: "var(--kabbash)",
                    }}
                    onClick={() => {
                      setSelected(w);
                      setModalMode("add");
                    }}
                  >
                    ➕ إضافة رصيد
                  </button>
                  <button
                    className="btn"
                    style={{
                      fontSize: 12,
                      padding: "5px 12px",
                      color: "var(--danger)",
                      borderColor: "var(--danger)",
                    }}
                    onClick={() => {
                      setSelected(w);
                      setModalMode("deduct");
                    }}
                  >
                    ➖ خصم
                  </button>
                  <button
                    className="btn"
                    style={{ fontSize: 12, padding: "5px 12px" }}
                    onClick={() => {
                      setSelected(w);
                      setModalMode("history");
                    }}
                  >
                    📜 السجل
                  </button>
                  {!isSuspended ? (
                    <button
                      className="btn"
                      style={{
                        fontSize: 12,
                        padding: "5px 12px",
                        color: "var(--danger)",
                        borderColor: "var(--danger)",
                      }}
                      onClick={async () => {
                        const reason = window.prompt(
                          "سبب تعليق المحفظة (اختياري):"
                        );
                        if (reason === null) return;
                        try {
                          await suspendWallet(w.uid, reason, user.uid);
                          showSuccess("تم تعليق المحفظة");
                        } catch (err) {
                          setError(err.message || "تعذر التعليق");
                        }
                      }}
                    >
                      ⏸️ تعليق
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 12, padding: "5px 12px" }}
                      onClick={async () => {
                        try {
                          await activateWallet(w.uid, user.uid);
                          showSuccess("تم تفعيل المحفظة");
                        } catch (err) {
                          setError(err.message || "تعذر التفعيل");
                        }
                      }}
                    >
                      ▶️ تفعيل
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* المودالات */}
      {modalMode === "add" && selected && (
        <AmountModal
          title="➕ إضافة رصيد"
          wallet={selected}
          user={userMap[selected.uid]}
          settings={settings}
          mode="add"
          adminUid={user.uid}
          onClose={() => {
            setModalMode(null);
            setSelected(null);
          }}
          onSuccess={handleActionComplete}
          onError={setError}
        />
      )}
      {modalMode === "deduct" && selected && (
        <AmountModal
          title="➖ خصم من الرصيد"
          wallet={selected}
          user={userMap[selected.uid]}
          settings={settings}
          mode="deduct"
          adminUid={user.uid}
          onClose={() => {
            setModalMode(null);
            setSelected(null);
          }}
          onSuccess={handleActionComplete}
          onError={setError}
        />
      )}
      {modalMode === "history" && selected && (
        <HistoryModal
          wallet={selected}
          user={userMap[selected.uid]}
          transactions={transactions.filter((t) => t.uid === selected.uid)}
          onClose={() => {
            setModalMode(null);
            setSelected(null);
          }}
        />
      )}

      <style>{`
        .wallet-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }
        .wallet-stat {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .wallet-stat.success {
          border-color: var(--kabbash);
          background: var(--kabbash-light);
        }
        .wallet-stat.danger {
          border-color: var(--danger);
          background: var(--danger-light);
        }
        .wallet-stat-label {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--steel);
          margin-bottom: 4px;
        }
        .wallet-stat-value {
          font-size: 22px;
          font-weight: 900;
          color: var(--ink);
        }
        .wallet-stat-unit {
          font-size: 12px;
          font-weight: 600;
          color: var(--steel);
          margin-inline-start: 4px;
        }
      `}</style>
    </div>
  );
}

/* ============================================
   مودال إضافة/خصم
   ============================================ */
function AmountModal({
  title,
  wallet,
  user,
  settings,
  mode,
  adminUid,
  onClose,
  onSuccess,
  onError,
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");

  const deductions = settings?.deductions || [];
  const isDeduct = mode === "deduct";

  function handlePresetClick(d) {
    setSelectedReason(d.reason);
    setAmount(String(d.amount));
    setReason(d.reason);
  }

  function handleCustomReason() {
    setSelectedReason("custom");
    setAmount("");
    setReason("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setLocalError("المبلغ غير صحيح");
      return;
    }
    if (!reason.trim()) {
      setLocalError("السبب مطلوب");
      return;
    }
    if (isDeduct && numAmount > Number(wallet.balance)) {
      setLocalError(
        `المبلغ أكبر من الرصيد المتاح (${Number(wallet.balance).toLocaleString(
          "ar-EG"
        )}ج)`
      );
      return;
    }

    setBusy(true);
    try {
      if (isDeduct) {
        await deductFromWallet(wallet.uid, numAmount, reason.trim(), adminUid);
      } else {
        await addToWallet(wallet.uid, numAmount, reason.trim(), adminUid);
      }
      onSuccess(
        isDeduct
          ? `تم خصم ${numAmount.toLocaleString("ar-EG")}ج`
          : `تمت إضافة ${numAmount.toLocaleString("ar-EG")}ج`
      );
    } catch (err) {
      console.error(err);
      const msg = err.message || "حدث خطأ";
      setLocalError(msg);
      onError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="am-backdrop" onClick={onClose}>
      <div className="am-modal" onClick={(e) => e.stopPropagation()}>
        <div className="am-header">
          <div>
            <h2 className="am-title">{title}</h2>
            <p className="am-subtitle">
              {user?.name || user?.email || wallet.uid}
            </p>
          </div>
          <button
            className="am-close"
            onClick={onClose}
            type="button"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div className="am-info">
          <span>الرصيد الحالي:</span>
          <b>{Number(wallet.balance || 0).toLocaleString("ar-EG")}ج</b>
        </div>

        <form onSubmit={handleSubmit}>
          {isDeduct && deductions.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label className="am-label">اختر سبب من القايمة:</label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {deductions.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={
                      "am-preset" +
                      (selectedReason === d.reason ? " active" : "")
                    }
                    onClick={() => handlePresetClick(d)}
                  >
                    <span>{d.reason}</span>
                    <span className="am-preset-amount">
                      {Number(d.amount).toLocaleString("ar-EG")}ج
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  className={
                    "am-preset" + (selectedReason === "custom" ? " active" : "")
                  }
                  onClick={handleCustomReason}
                >
                  <span>✏️ سبب آخر (يدوي)</span>
                </button>
              </div>
            </div>
          )}

          <div className="am-field">
            <label className="am-label">المبلغ (ج)</label>
            <input
              className="input"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              autoFocus={!isDeduct}
            />
          </div>

          <div className="am-field">
            <label className="am-label">السبب</label>
            <input
              className="input"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isDeduct ? "مثال: تأخير 45 دقيقة" : "مثال: تعويض نقص وزن"
              }
              required
            />
          </div>

          {localError && <p className="am-error">{localError}</p>}

          <div className="am-actions">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={busy}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={isDeduct ? "btn btn-danger" : "btn btn-primary"}
              disabled={busy}
              style={
                isDeduct
                  ? {
                      background: "var(--danger)",
                      borderColor: "var(--danger)",
                      color: "#fff",
                    }
                  : undefined
              }
            >
              {busy
                ? "جاري التنفيذ..."
                : isDeduct
                ? "تأكيد الخصم"
                : "تأكيد الإضافة"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .am-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 18, 16, 0.65);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 95;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: am-fade .2s ease;
        }
        @keyframes am-fade {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        .am-modal {
          background: var(--paper-raised);
          color: var(--ink);
          border-radius: 16px;
          padding: 22px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 24px 48px rgba(0,0,0,0.35);
          animation: am-pop .25s cubic-bezier(0.22, 0.61, 0.36, 1);
          max-height: 92vh;
          overflow-y: auto;
        }
        @keyframes am-pop {
          from { transform: scale(0.95); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }
        .am-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }
        .am-title {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 900;
        }
        .am-subtitle {
          margin: 0;
          font-size: 12.5px;
          color: var(--steel);
        }
        .am-close {
          background: transparent;
          border: none;
          color: var(--steel);
          font-size: 16px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .am-close:hover {
          background: var(--paper-sunken);
        }
        .am-info {
          display: flex;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--paper-sunken);
          border-radius: 10px;
          margin-bottom: 14px;
          font-size: 13px;
        }
        .am-info b {
          font-size: 16px;
          font-weight: 900;
          color: var(--kabbash);
        }
        .am-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .am-field {
          margin-bottom: 12px;
        }
        .am-preset {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: "10px 12px";
          padding: 10px 12px;
          background: var(--paper-sunken);
          border: 1.5px solid var(--line);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-align: start;
          color: var(--ink);
          font-family: inherit;
          transition: all .2s;
        }
        .am-preset:hover {
          border-color: var(--kabbash);
        }
        .am-preset.active {
          background: var(--kabbash-light);
          border-color: var(--kabbash);
          color: var(--kabbash);
        }
        .am-preset-amount {
          font-weight: 900;
          color: var(--danger);
        }
        .am-preset.active .am-preset-amount {
          color: var(--kabbash);
        }
        .am-error {
          background: var(--danger-light);
          border: 1px solid var(--danger);
          color: var(--danger);
          font-size: 12.5px;
          padding: 8px 12px;
          border-radius: 8px;
          margin: 0 0 12px;
        }
        .am-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .am-actions .btn {
          flex: 1;
        }
      `}</style>
    </div>
  );
}

/* ============================================
   مودال سجل العمليات
   ============================================ */
function HistoryModal({ wallet, user, transactions, onClose }) {
  const sorted = [...transactions].sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() || 0;
    const tb = b.createdAt?.toMillis?.() || 0;
    return tb - ta;
  });

  return (
    <div className="hm-backdrop" onClick={onClose}>
      <div className="hm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hm-header">
          <div>
            <h2 className="hm-title">📜 سجل العمليات</h2>
            <p className="hm-subtitle">
              {user?.name || user?.email || wallet.uid}
            </p>
          </div>
          <button
            className="hm-close"
            onClick={onClose}
            type="button"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div className="hm-balance">
          <span>الرصيد الحالي:</span>
          <b>{Number(wallet.balance || 0).toLocaleString("ar-EG")}ج</b>
        </div>

        {sorted.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--steel)",
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            لا توجد عمليات بعد.
          </p>
        ) : (
          <div className="hm-list">
            {sorted.map((tx) => {
              const meta =
                TX_LABELS[tx.type] || { label: tx.type || "عملية", icon: "•" };
              const isPositive = [
                "deposit",
                "refund",
                "weight_add",
              ].includes(tx.type);
              const sign = isPositive ? "+" : "-";
              const dateLabel =
                tx.createdAt?.toDate?.().toLocaleString("ar-EG") || "—";

              return (
                <div key={tx.id} className="hm-item">
                  <div className="hm-item-head">
                    <span className="hm-icon">{meta.icon}</span>
                    <b
                      style={{
                        color: isPositive
                          ? "var(--kabbash)"
                          : "var(--danger)",
                      }}
                    >
                      {meta.label}
                    </b>
                    {Number(tx.amount) > 0 && (
                      <span
                        className="hm-amount"
                        style={{
                          color: isPositive
                            ? "var(--kabbash)"
                            : "var(--danger)",
                        }}
                      >
                        {sign} {Number(tx.amount).toLocaleString("ar-EG")}ج
                      </span>
                    )}
                  </div>
                  <p className="hm-reason">{tx.reason || "—"}</p>
                  <p className="hm-date">{dateLabel}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .hm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 18, 16, 0.65);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 95;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: hm-fade .2s ease;
        }
        @keyframes hm-fade {
          from { opacity: 0 } to { opacity: 1 }
        }
        .hm-modal {
          background: var(--paper-raised);
          color: var(--ink);
          border-radius: 16px;
          padding: 22px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 24px 48px rgba(0,0,0,0.35);
          animation: hm-pop .25s cubic-bezier(0.22, 0.61, 0.36, 1);
          max-height: 90vh;
          overflow-y: auto;
        }
        @keyframes hm-pop {
          from { transform: scale(0.95); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }
        .hm-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }
        .hm-title {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 900;
        }
        .hm-subtitle {
          margin: 0;
          font-size: 12.5px;
          color: var(--steel);
        }
        .hm-close {
          background: transparent;
          border: none;
          color: var(--steel);
          font-size: 16px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .hm-balance {
          display: flex;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--kabbash-light);
          border-radius: 10px;
          margin-bottom: 14px;
          font-size: 13px;
          border: 1px solid var(--kabbash);
        }
        .hm-balance b {
          font-size: 18px;
          font-weight: 900;
          color: var(--kabbash);
        }
        .hm-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hm-item {
          background: var(--paper-sunken);
          border-radius: 10px;
          padding: 10px 12px;
        }
        .hm-item-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          font-size: 13px;
        }
        .hm-icon {
          font-size: 16px;
        }
        .hm-amount {
          margin-inline-start: auto;
          font-weight: 900;
          font-size: 14px;
        }
        .hm-reason {
          margin: 0;
          font-size: 12px;
          color: var(--steel);
          line-height: 1.5;
        }
        .hm-date {
          margin: 4px 0 0;
          font-size: 10.5px;
          color: var(--steel-light);
        }
      `}</style>
    </div>
  );
}
