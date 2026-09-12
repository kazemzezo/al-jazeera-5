import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { TON_CATEGORIES, LOCATIONS } from "../lib/catalog";
import { EQUIPMENT } from "../lib/equipment";
import { DEMO_TON_PRICES } from "../lib/demoData";
import {
  subscribeTonPrices,
  setTonPrice,
  subscribeEquipmentPrices,
  setEquipmentPrice,
  subscribeAllReservations,
  updateReservationStatus,
  subscribeAnnouncements,
  deleteAnnouncement,
} from "../lib/listings";
import {
  subscribeAllVerifications,
  approveVerification,
  rejectVerification,
} from "../lib/verification";
import { subscribeMessages, markMessageRead } from "../lib/messages";
import {
  subscribeAllAds,
  deleteAd,
  closeAd,
  reopenAd,
  markAdAsLoading,
  markAdAsInactive,
  reactivateAd,
  AD_STATUS,
  AD_STATUS_LABELS,
  AD_STATUS_COLORS,
  getAdTotal,
  getAvailableItems,
  getAdsStats,
  ACTIVE_STATUSES,
  ARCHIVE_STATUSES,
} from "../lib/ads";
import {
  subscribeAllUsers,
  changeUserRole,
  toggleUserSuspended,
  getRoleLabel,
  roleBadgeStyle,
  ROLE_OPTIONS,
} from "../lib/users";
import InvoiceView from "../components/InvoiceView";
import AddAdForm from "../components/AddAdForm";
import AdminCategoriesTab from "../components/AdminCategoriesTab";

export default function AdminPanel() {
  const { user, isPrimaryAdmin } = useAuth();
  const [tab, setTab] = useState("reservations");
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const unsub = subscribeAllReservations((items) => {
      setNewCount(items.filter((r) => r.status === "new").length);
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 16 }}>
        لوحة الإدمن
      </h1>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <Pill
          active={tab === "reservations"}
          onClick={() => setTab("reservations")}
        >
          الحجوزات {newCount > 0 && <Badge>{newCount}</Badge>}
        </Pill>
        <Pill active={tab === "ads"} onClick={() => setTab("ads")}>
          الإعلانات
        </Pill>
        <Pill active={tab === "categories"} onClick={() => setTab("categories")}>
          📋 الأصناف
        </Pill>
        {isPrimaryAdmin && (
          <Pill active={tab === "users"} onClick={() => setTab("users")}>
            🔐 المستخدمين
          </Pill>
        )}
        <Pill
          active={tab === "verification"}
          onClick={() => setTab("verification")}
        >
          طلبات التوثيق
        </Pill>
        <Pill
          active={tab === "announcements"}
          onClick={() => setTab("announcements")}
        >
          الإعلانات السريعة
        </Pill>
        <Pill active={tab === "prices"} onClick={() => setTab("prices")}>
          الأسعار
        </Pill>
        <Pill active={tab === "equipment"} onClick={() => setTab("equipment")}>
          المعدات
        </Pill>
        <Pill active={tab === "messages"} onClick={() => setTab("messages")}>
          رسائل التواصل
        </Pill>
      </div>

      {tab === "reservations" && <ReservationsTab uid={user.uid} />}
      {tab === "ads" && <AdsTab uid={user.uid} />}
      {tab === "categories" && <AdminCategoriesTab />}
      {tab === "users" && isPrimaryAdmin && <UsersTab adminUid={user.uid} />}
      {tab === "verification" && <VerificationTab />}
      {tab === "announcements" && <AnnouncementsTab />}
      {tab === "prices" && <PricesTab uid={user.uid} />}
      {tab === "equipment" && <EquipmentTab uid={user.uid} />}
      {tab === "messages" && <MessagesTab />}

      <style>{`
        .admin-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
        .admin-row .unit { color: var(--steel-light); font-size: 12px; }
      `}</style>
    </div>
  );
}

/* ===================== الإعلانات ===================== */

function adStatusStyle(status) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  };
  const colors = AD_STATUS_COLORS[status] || AD_STATUS_COLORS.active;
  return { ...base, background: colors.light, color: colors.bg };
}

function AdsTab({ uid }) {
  const [ads, setAds] = useState([]);
  const [filter, setFilter] = useState("active");
  const [locationFilter, setLocationFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const unsub = subscribeAllAds(setAds, (err) => {
      console.error("فشل تحميل الإعلانات:", err);
      setError("تعذر تحميل الإعلانات.");
    });
    return () => unsub();
  }, []);

  const stats = useMemo(() => getAdsStats(ads), [ads]);

  const filtered = useMemo(() => {
    let list = ads;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          (a.title || "").toLowerCase().includes(q) ||
          (a.description || "").toLowerCase().includes(q) ||
          (a.items || []).some((it) =>
            (it.category || "").toLowerCase().includes(q)
          )
      );
    } else {
      // فلتر الحالة
      if (filter === "active") {
        list = list.filter((a) => ACTIVE_STATUSES.includes(a.status));
      } else if (filter === "archive") {
        list = list.filter((a) => ARCHIVE_STATUSES.includes(a.status));
      } else if (filter !== "all") {
        list = list.filter((a) => a.status === filter);
      }

      // فلتر القسم
      if (locationFilter !== "all") {
        list = list.filter((a) => a.location === locationFilter);
      }
    }
    return list;
  }, [ads, filter, locationFilter, search]);

  const counts = useMemo(
    () => ({
      all: ads.length,
      active: ads.filter((a) => a.status === AD_STATUS.ACTIVE).length,
      partial: ads.filter((a) => a.status === AD_STATUS.PARTIAL).length,
      loading: ads.filter((a) => a.status === AD_STATUS.LOADING).length,
      soldOut: ads.filter((a) => a.status === AD_STATUS.SOLD_OUT).length,
      inactive: ads.filter((a) => a.status === AD_STATUS.INACTIVE).length,
      closed: ads.filter((a) => a.status === AD_STATUS.CLOSED).length,
    }),
    [ads]
  );

  async function handleClose(id) {
    if (!window.confirm("تأكيد غلق الإعلان؟")) return;
    setBusyId(id);
    try {
      await closeAd(id, uid);
    } catch (err) {
      console.error(err);
      setError("تعذر غلق الإعلان.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReopen(id) {
    setBusyId(id);
    try {
      await reopenAd(id, uid);
    } catch (err) {
      console.error(err);
      setError("تعذر إعادة فتح الإعلان.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkLoading(id) {
    if (
      !window.confirm(
        "تحويل الإعلان إلى 'جاري التحميل'؟ الإعلان هيختفي من العرض للتاجر."
      )
    )
      return;
    setBusyId(id);
    try {
      await markAdAsLoading(id, uid);
    } catch (err) {
      console.error(err);
      setError("تعذر تحديث حالة الإعلان.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleArchive(id) {
    if (
      !window.confirm(
        "أرشفة الإعلان؟ الإعلان هيبقى 'غير نشط' ومش هيظهر للتاجر."
      )
    )
      return;
    setBusyId(id);
    try {
      await markAdAsInactive(id, uid);
    } catch (err) {
      console.error(err);
      setError("تعذر أرشفة الإعلان.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReactivate(id) {
    setBusyId(id);
    try {
      await reactivateAd(id, uid);
    } catch (err) {
      console.error(err);
      setError("تعذر إعادة تنشيط الإعلان.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("حذف الإعلان نهائياً؟ لا يمكن التراجع.")) return;
    setBusyId(id);
    try {
      await deleteAd(id);
    } catch (err) {
      console.error(err);
      setError("تعذر حذف الإعلان.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {/* إحصائيات سريعة */}
      <div className="ads-stats">
        <div className="ads-stat-card">
          <div className="ads-stat-label">📦 الرصيف البحري</div>
          <div className="ads-stat-value">
            {stats.dock.active}{" "}
            <span className="ads-stat-unit">نشط</span>
          </div>
          <div className="ads-stat-sub">
            من إجمالي {stats.dock.total}
          </div>
        </div>
        <div className="ads-stat-card">
          <div className="ads-stat-label">🏭 ساحة الجزيره</div>
          <div className="ads-stat-value">
            {stats.yard.active}{" "}
            <span className="ads-stat-unit">نشط</span>
          </div>
          <div className="ads-stat-sub">
            من إجمالي {stats.yard.total}
          </div>
        </div>
        <div className="ads-stat-card warn">
          <div className="ads-stat-label">🟡 جاري التحميل</div>
          <div className="ads-stat-value">{counts.loading}</div>
          <div className="ads-stat-sub">بحاجة متابعة</div>
        </div>
        <div className="ads-stat-card danger">
          <div className="ads-stat-label">🔴 أرشيف (غير نشط)</div>
          <div className="ads-stat-value">{counts.inactive}</div>
          <div className="ads-stat-sub">تم تسليمها</div>
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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <input
          className="input"
          placeholder="ابحث بالعنوان أو الصنف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          style={{ whiteSpace: "nowrap" }}
        >
          + إعلان جديد
        </button>
      </div>

      {!search.trim() && (
        <>
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            {[
              { k: "active", label: "🟢 النشطة" },
              { k: "loading", label: "🟡 جاري التحميل" },
              { k: "inactive", label: "🔴 غير نشط" },
              { k: "archive", label: "📦 الأرشيف" },
              { k: "all", label: "الكل" },
            ].map((s) => (
              <button
                key={s.k}
                className="btn"
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  background: filter === s.k ? "var(--ink)" : "transparent",
                  color: filter === s.k ? "var(--paper)" : "var(--ink)",
                  borderColor: filter === s.k ? "var(--ink)" : "var(--line)",
                }}
                onClick={() => setFilter(s.k)}
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
              { k: "all", label: "كل الأقسام" },
              { k: LOCATIONS.DOCK, label: "الرصيف البحري" },
              { k: LOCATIONS.YARD, label: "ساحة الجزيره" },
            ].map((s) => (
              <button
                key={s.k}
                className="btn"
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  background:
                    locationFilter === s.k ? "var(--kabbash)" : "transparent",
                  color: locationFilter === s.k ? "#fff" : "var(--ink)",
                  borderColor:
                    locationFilter === s.k ? "var(--kabbash)" : "var(--line)",
                }}
                onClick={() => setLocationFilter(s.k)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}

      {filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--steel)" }}>
          {search.trim()
            ? "لا توجد نتائج مطابقة للبحث."
            : "لا توجد إعلانات في هذه الحالة."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((ad) => {
            const total = getAdTotal(ad);
            const available = getAvailableItems(ad);
            const isExpanded = expandedId === ad.id;
            const isActive = ACTIVE_STATUSES.includes(ad.status);
            const isArchive = ARCHIVE_STATUSES.includes(ad.status);
            const colors = AD_STATUS_COLORS[ad.status] || AD_STATUS_COLORS.active;
            const needsAttention =
              ad.status === AD_STATUS.LOADING ||
              ad.status === AD_STATUS.INACTIVE;

            return (
              <div
                key={ad.id}
                style={{
                  background: "var(--paper-raised)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  padding: 14,
                  position: "relative",
                }}
              >
                {needsAttention && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      insetInlineStart: -4,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: colors.bg,
                      boxShadow: `0 0 0 4px ${colors.light}`,
                      animation: "ad-pulse 1.5s ease-in-out infinite",
                    }}
                  />
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      flex: 1,
                      minWidth: 240,
                    }}
                  >
                    {ad.imageUrl ? (
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        style={{
                          width: 70,
                          height: 70,
                          objectFit: "cover",
                          borderRadius: 8,
                          flexShrink: 0,
                          background: "var(--paper-sunken)",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: 8,
                          background: "var(--paper-sunken)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 26,
                          flexShrink: 0,
                        }}
                      >
                        📦
                      </div>
                    )}

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                          marginBottom: 4,
                        }}
                      >
                        <span style={adStatusStyle(ad.status)}>
                          {AD_STATUS_LABELS[ad.status]}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--steel-light)",
                          }}
                        >
                          {ad.location === LOCATIONS.DOCK
                            ? "الرصيف البحري"
                            : "ساحة الجزيره"}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {ad.title}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 12,
                          color: "var(--steel)",
                        }}
                      >
                        {ad.items?.length || 0} صنف · إجمالي{" "}
                        {total.toLocaleString("ar-EG")}ج
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 11,
                          color: "var(--steel-light)",
                        }}
                      >
                        بواسطة {ad.createdByName} ·{" "}
                        {ad.createdAt?.toDate?.().toLocaleString("ar-EG") ||
                          "—"}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    <button
                      className="btn"
                      style={{
                        fontSize: 12,
                        padding: "5px 10px",
                        color: "var(--kabbash)",
                        borderColor: "var(--kabbash)",
                      }}
                      onClick={() => setEditingAd(ad)}
                      disabled={busyId === ad.id}
                    >
                      ✏️ تعديل
                    </button>

                    <button
                      className="btn"
                      style={{ fontSize: 12, padding: "5px 10px" }}
                      onClick={() =>
                        setExpandedId(isExpanded ? null : ad.id)
                      }
                    >
                      {isExpanded ? "إخفاء" : "الأصناف"}
                    </button>

                    {/* أزرار الحالة */}
                    {isActive && (
                      <>
                        <button
                          className="btn"
                          style={{
                            fontSize: 12,
                            padding: "5px 10px",
                            color: "var(--crane)",
                            borderColor: "var(--crane)",
                          }}
                          onClick={() => handleMarkLoading(ad.id)}
                          disabled={busyId === ad.id}
                          title="تعليم الإعلان كـ 'جاري التحميل'"
                        >
                          🟡 جاري التحميل
                        </button>
                        <button
                          className="btn"
                          style={{
                            fontSize: 12,
                            padding: "5px 10px",
                            color: "var(--danger)",
                            borderColor: "var(--danger)",
                          }}
                          onClick={() => handleArchive(ad.id)}
                          disabled={busyId === ad.id}
                          title="أرشفة الإعلان (غير نشط)"
                        >
                          🔴 أرشفة
                        </button>
                      </>
                    )}

                    {ad.status === AD_STATUS.LOADING && (
                      <button
                        className="btn"
                        style={{
                          fontSize: 12,
                          padding: "5px 10px",
                          color: "var(--danger)",
                          borderColor: "var(--danger)",
                        }}
                        onClick={() => handleArchive(ad.id)}
                        disabled={busyId === ad.id}
                      >
                        🔴 أرشفة
                      </button>
                    )}

                    {isArchive && (
                      <>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: 12, padding: "5px 10px" }}
                          onClick={() => handleReactivate(ad.id)}
                          disabled={busyId === ad.id}
                        >
                          ♻️ إعادة تنشيط
                        </button>
                        <button
                          className="btn"
                          style={{
                            fontSize: 12,
                            padding: "5px 10px",
                            color: "var(--danger)",
                            borderColor: "var(--danger)",
                          }}
                          onClick={() => handleDelete(ad.id)}
                          disabled={busyId === ad.id}
                        >
                          🗑️ حذف
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px dashed var(--line)",
                    }}
                  >
                    {ad.description && (
                      <p
                        style={{
                          margin: "0 0 10px",
                          fontSize: 13,
                          color: "var(--steel)",
                          lineHeight: 1.6,
                        }}
                      >
                        {ad.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {(ad.items || []).map((it, i) => {
                        const avail =
                          Number(it.qty || 0) - Number(it.reservedQty || 0);
                        const unit =
                          it.saleType === "piece"
                            ? "قطعة"
                            : it.saleType === "deal"
                            ? "صفقة"
                            : "طن";
                        return (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 13,
                              padding: "4px 8px",
                              background: "var(--paper-sunken)",
                              borderRadius: 6,
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              {it.category}
                            </span>
                            <span style={{ color: "var(--steel)" }}>
                              متاح {avail} / {it.qty} {unit} ·{" "}
                              {Number(it.unitPrice).toLocaleString("ar-EG")}ج
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {available.length === 0 && (
                      <p
                        style={{
                          fontSize: 12.5,
                          color: "var(--danger)",
                          margin: "8px 0 0",
                        }}
                      >
                        ⚠️ لا توجد أصناف متاحة للحجز.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && <AddAdForm onClose={() => setShowForm(false)} />}
      {editingAd && (
        <AddAdForm ad={editingAd} onClose={() => setEditingAd(null)} />
      )}

      <style>{`
        .ads-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }
        .ads-stat-card {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .ads-stat-card.warn {
          border-color: var(--crane);
          background: var(--crane-light);
        }
        .ads-stat-card.danger {
          border-color: var(--danger);
          background: var(--danger-light);
        }
        .ads-stat-label {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--steel);
          margin-bottom: 4px;
        }
        .ads-stat-value {
          font-size: 22px;
          font-weight: 900;
          color: var(--ink);
          line-height: 1.1;
        }
        .ads-stat-unit {
          font-size: 12px;
          font-weight: 600;
          color: var(--steel);
        }
        .ads-stat-sub {
          font-size: 11px;
          color: var(--steel-light);
          margin-top: 4px;
        }
        @keyframes ad-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
}

/* ===================== الحجوزات ===================== */

const STATUS_LABELS = {
  new: "🟡 جديد",
  contacted: "🔵 تم التواصل",
  in_progress: "🟣 قيد التنفيذ",
  completed: "🟢 مكتمل",
  cancelled: "🔴 ملغي",
};

function statusBadgeStyle(status) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  };
  if (status === "new")
    return { ...base, background: "var(--crane-light)", color: "var(--crane)" };
  if (status === "contacted")
    return { ...base, background: "var(--kabbash-light)", color: "var(--steel)" };
  if (status === "in_progress")
    return {
      ...base,
      background: "var(--kabbash-light)",
      color: "var(--kabbash)",
    };
  if (status === "completed")
    return {
      ...base,
      background: "var(--kabbash-light)",
      color: "var(--kabbash)",
    };
  if (status === "cancelled")
    return { ...base, background: "var(--danger-light)", color: "var(--danger)" };
  return base;
}

function ReservationsTab({ uid }) {
  const [filter, setFilter] = useState("new");
  const [search, setSearch] = useState("");
  const [all, setAll] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = subscribeAllReservations(setAll, (err) => {
      console.error("فشل تحميل الحجوزات:", err);
      setError("تعذر تحميل الحجوزات. جرب تحديث الصفحة.");
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return all.filter(
        (r) =>
          (r.traderName || "").toLowerCase().includes(q) ||
          (r.traderEmail || "").toLowerCase().includes(q) ||
          (r.category || "").toLowerCase().includes(q) ||
          (r.adTitle || "").toLowerCase().includes(q) ||
          (r.invoiceId || "").toLowerCase().includes(q)
      );
    }
    if (filter === "all") return all;
    return all.filter((r) => r.status === filter);
  }, [all, filter, search]);

  const counts = useMemo(
    () => ({
      new: all.filter((r) => r.status === "new").length,
      contacted: all.filter((r) => r.status === "contacted").length,
      in_progress: all.filter((r) => r.status === "in_progress").length,
      completed: all.filter((r) => r.status === "completed").length,
      cancelled: all.filter((r) => r.status === "cancelled").length,
      all: all.length,
    }),
    [all]
  );

  async function setStatus(id, status) {
    setBusyId(id);
    setError("");
    try {
      await updateReservationStatus(id, status, { uid });
    } catch (err) {
      console.error("خطأ تحديث حالة الحجز:", err);
      setError(
        `تعذر تحديث الحالة: ${err.message || err.code || "خطأ غير معروف"}`
      );
    } finally {
      setBusyId(null);
    }
  }

  async function confirmCancel(id) {
    setBusyId(id);
    setError("");
    try {
      await updateReservationStatus(id, "cancelled", {
        uid,
        reason: cancelReason.trim(),
      });
      setCancelingId(null);
      setCancelReason("");
    } catch (err) {
      console.error("خطأ إلغاء الحجز:", err);
      setError(
        `تعذر إلغاء الحجز: ${err.message || err.code || "خطأ غير معروف"}`
      );
    } finally {
      setBusyId(null);
    }
  }

  if (viewing) {
    return (
      <InvoiceView
        invoice={viewing}
        onBack={() => setViewing(null)}
        adminActions={
          <InvoiceAdminActions
            invoice={viewing}
            onBack={() => setViewing(null)}
            onStatusChange={(s) => setStatus(viewing.id, s)}
          />
        }
      />
    );
  }

  return (
    <div>
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

      <input
        className="input"
        placeholder="ابحث باسم التاجر أو الإيميل أو الصنف أو رقم الفاتورة..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {["new", "contacted", "in_progress", "completed", "cancelled", "all"].map(
          (s) => (
            <button
              key={s}
              className="btn"
              style={{
                fontSize: 12,
                padding: "5px 12px",
                background: filter === s ? "var(--ink)" : "transparent",
                color: filter === s ? "var(--paper)" : "var(--ink)",
                borderColor: filter === s ? "var(--ink)" : "var(--line)",
              }}
              onClick={() => setFilter(s)}
            >
              {s === "all" ? "الكل" : STATUS_LABELS[s]} ({counts[s]})
            </button>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--steel)" }}>
          {search.trim()
            ? "لا توجد نتائج مطابقة للبحث."
            : "لا توجد حجوزات في هذه الحالة."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((r) => (
            <div
              key={r.id}
              style={{
                background: "var(--paper-raised)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 200 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={statusBadgeStyle(r.status)}>
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                    <span
                      style={{ fontSize: 11, color: "var(--steel-light)" }}
                    >
                      {r.type === "calculator"
                        ? "من الحاسبة"
                        : r.type === "ad"
                        ? "من إعلان"
                        : "من الرئيسية"}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "8px 0 2px",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {r.traderName || r.traderEmail || "—"}
                  </p>
                  {r.traderEmail && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "var(--steel)",
                      }}
                    >
                      {r.traderEmail}
                    </p>
                  )}
                  <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>
                    {r.type === "calculator" ? (
                      <>
                        فاتورة من الحاسبة ·{" "}
                        {r.location === LOCATIONS.DOCK ? "الرصيف" : "الساحة"}
                      </>
                    ) : r.type === "ad" ? (
                      <>
                        {r.adTitle || "إعلان"} · {r.items?.length || 0} صنف
                      </>
                    ) : (
                      <>
                        {r.category} · {r.qty}{" "}
                        {r.saleType === "lot"
                          ? "لوط"
                          : r.saleType === "piece"
                          ? "قطعة"
                          : "طن"}
                      </>
                    )}
                  </p>
                  {r.invoiceId && (
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 11,
                        color: "var(--steel-light)",
                      }}
                    >
                      رقم: {r.invoiceId}
                    </p>
                  )}
                  {r.status === "cancelled" && r.cancelReason && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 12,
                        color: "var(--danger)",
                      }}
                    >
                      <b>سبب الإلغاء:</b> {r.cancelReason}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 900 }}>
                    {Number(r.grandTotal || 0).toLocaleString("ar-EG")}ج
                  </span>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      className="btn"
                      style={{ fontSize: 12, padding: "5px 12px" }}
                      onClick={() => setViewing(r)}
                    >
                      عرض الفاتورة
                    </button>

                    {r.status === "new" && (
                      <button
                        className="btn"
                        style={{ fontSize: 12, padding: "5px 12px" }}
                        onClick={() => setStatus(r.id, "contacted")}
                        disabled={busyId === r.id}
                      >
                        {busyId === r.id ? "..." : "تم التواصل"}
                      </button>
                    )}

                    {(r.status === "new" || r.status === "contacted") && (
                      <button
                        className="btn"
                        style={{ fontSize: 12, padding: "5px 12px" }}
                        onClick={() => setStatus(r.id, "in_progress")}
                        disabled={busyId === r.id}
                      >
                        {busyId === r.id ? "..." : "قيد التنفيذ"}
                      </button>
                    )}

                    {(r.status === "new" ||
                      r.status === "contacted" ||
                      r.status === "in_progress") && (
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: 12, padding: "5px 12px" }}
                        onClick={() => setStatus(r.id, "completed")}
                        disabled={busyId === r.id}
                      >
                        {busyId === r.id ? "..." : "إتمام"}
                      </button>
                    )}

                    {r.status !== "cancelled" && r.status !== "completed" && (
                      <button
                        className="btn"
                        style={{
                          fontSize: 12,
                          padding: "5px 12px",
                          color: "var(--danger)",
                          borderColor: "var(--danger)",
                        }}
                        onClick={() => {
                          setCancelingId(r.id);
                          setCancelReason("");
                        }}
                        disabled={busyId === r.id}
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {cancelingId === r.id && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px dashed var(--line)",
                  }}
                >
                  <input
                    className="input"
                    placeholder="سبب الإلغاء (اختياري)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn"
                      style={{
                        background: "var(--danger)",
                        borderColor: "var(--danger)",
                        color: "#fff",
                        fontSize: 13,
                      }}
                      onClick={() => confirmCancel(r.id)}
                      disabled={busyId === r.id}
                    >
                      {busyId === r.id ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: 13 }}
                      onClick={() => {
                        setCancelingId(null);
                        setCancelReason("");
                      }}
                    >
                      تراجع
                    </button>
                  </div>
                  <p
                    style={{
                      fontSize: 11.5,
                      color: "var(--steel)",
                      margin: "8px 0 0",
                    }}
                  >
                    ملاحظة: إلغاء الحجز سيرجّع الكمية للمخزون تلقائياً.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceAdminActions({ invoice, onBack, onStatusChange }) {
  return (
    <>
      {invoice.status === "new" && (
        <button
          className="btn"
          onClick={async () => {
            await onStatusChange("contacted");
            onBack();
          }}
        >
          تحديد كـ "تم التواصل"
        </button>
      )}
      {(invoice.status === "new" || invoice.status === "contacted") && (
        <button
          className="btn"
          onClick={async () => {
            await onStatusChange("in_progress");
            onBack();
          }}
        >
          تحديد كـ "قيد التنفيذ"
        </button>
      )}
      {(invoice.status === "new" ||
        invoice.status === "contacted" ||
        invoice.status === "in_progress") && (
        <button
          className="btn btn-primary"
          onClick={async () => {
            await onStatusChange("completed");
            onBack();
          }}
        >
          تحديد كـ "مكتمل"
        </button>
      )}
    </>
  );
}

/* ===================== الإعلانات السريعة ===================== */

function AnnouncementsTab() {
  const [dock, setDock] = useState([]);
  const [yard, setYard] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const unsub1 = subscribeAnnouncements(LOCATIONS.DOCK, setDock);
    const unsub2 = subscribeAnnouncements(LOCATIONS.YARD, setYard);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("تأكيد حذف الإعلان؟")) return;
    setBusyId(id);
    try {
      await deleteAnnouncement(id);
    } finally {
      setBusyId(null);
    }
  }

  function Section({ title, items }) {
    if (items.length === 0) {
      return (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>
            {title}
          </h3>
          <p style={{ fontSize: 13, color: "var(--steel)" }}>
            لا توجد إعلانات.
          </p>
        </div>
      );
    }
    return (
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>
          {title}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((a) => (
            <div
              key={a.id}
              style={{
                background: "var(--paper-raised)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 13.5 }}>{a.text}</p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 11,
                    color: "var(--steel-light)",
                  }}
                >
                  {a.createdByName} ·{" "}
                  {a.createdAt?.toDate?.().toLocaleString("ar-EG") || "—"}
                </p>
              </div>
              <button
                className="btn"
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  color: "var(--danger)",
                  borderColor: "var(--danger)",
                }}
                onClick={() => handleDelete(a.id)}
                disabled={busyId === a.id}
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--steel)", marginBottom: 16 }}>
        الإعلانات السريعة بتتضاف من الصفحة الرئيسية. تقدر تحذف أي إعلان من
        هنا.
      </p>
      <Section title="الرصيف البحري" items={dock} />
      <Section title="ساحة الجزيره" items={yard} />
    </div>
  );
}

/* ===================== الأسعار ===================== */

function PricesTab({ uid }) {
  const [prices, setPrices] = useState({});
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeTonPrices(setPrices);
    return () => unsub();
  }, []);

  useEffect(() => {
    const source = Object.keys(prices).length > 0 ? prices : DEMO_TON_PRICES;
    const v = {};
    TON_CATEGORIES.forEach((c) => (v[c] = source[c]?.pricePerTon ?? 0));
    setValues(v);
  }, [prices]);

  async function saveAll() {
    setSaving(true);
    try {
      await Promise.all(
        TON_CATEGORIES.map((c) => setTonPrice(c, values[c] || 0, uid))
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {TON_CATEGORIES.map((c) => {
        const currentData = prices[c];
        const currentPrice = currentData?.pricePerTon ?? 0;
        const newPrice = values[c] ?? 0;
        const hasChange = Number(newPrice) !== Number(currentPrice);

        return (
          <div key={c} className="admin-row">
            <span style={{ flex: 1 }}>{c}</span>
            {currentData && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--steel-light)",
                  marginInlineEnd: 6,
                }}
              >
                الحالي: {Number(currentPrice).toLocaleString("ar-EG")}
              </span>
            )}
            <span className="unit">ج/طن</span>
            <input
              type="number"
              value={values[c] ?? 0}
              onChange={(e) => setValues({ ...values, [c]: e.target.value })}
              style={{
                width: 110,
                borderColor: hasChange ? "var(--crane)" : undefined,
              }}
            />
          </div>
        );
      })}
      <button
        className="btn btn-primary"
        style={{ marginTop: 14 }}
        onClick={saveAll}
        disabled={saving}
      >
        {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
      </button>
      <p
        style={{
          fontSize: 11.5,
          color: "var(--steel-light)",
          marginTop: 10,
          lineHeight: 1.7,
        }}
      >
        ملاحظة: المؤشرات في شريط الأسعار هتتحدّث تلقائياً (⬆ أخضر، ⬇ أحمر، ▬
        أصفر للثبات 5 أيام).
      </p>
    </div>
  );
}

/* ===================== المعدات ===================== */

function EquipmentTab({ uid }) {
  const [prices, setPrices] = useState({});
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeEquipmentPrices(setPrices);
    return () => unsub();
  }, []);

  useEffect(() => {
    const v = {};
    EQUIPMENT.forEach(
      (eq) => (v[eq.id] = prices[eq.id]?.pricePerHour ?? eq.pricePerHour)
    );
    setValues(v);
  }, [prices]);

  async function saveAll() {
    setSaving(true);
    try {
      await Promise.all(
        EQUIPMENT.map((eq) =>
          setEquipmentPrice(eq.id, values[eq.id] || 0, uid)
        )
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {EQUIPMENT.map((eq) => (
        <div key={eq.id} className="admin-row">
          <span style={{ flex: 1 }}>{eq.name}</span>
          <span className="unit">ج/ساعة</span>
          <input
            type="number"
            value={values[eq.id] ?? 0}
            onChange={(e) => setValues({ ...values, [eq.id]: e.target.value })}
            style={{ width: 110 }}
          />
        </div>
      ))}
      <button
        className="btn btn-primary"
        style={{ marginTop: 14 }}
        onClick={saveAll}
        disabled={saving}
      >
        {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
      </button>
    </div>
  );
}

/* ===================== التوثيق ===================== */

function VerificationTab() {
  const [filter, setFilter] = useState("pending");
  const [allRequests, setAllRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = subscribeAllVerifications(setAllRequests, (err) => {
      console.error("فشل تحميل طلبات التوثيق:", err);
      setError("تعذر تحميل الطلبات. جرب تحديث الصفحة.");
    });
    return () => unsub();
  }, []);

  const requests = allRequests.filter((r) =>
    filter === "all" ? true : r.status === filter
  );

  async function handleApprove(req) {
    setBusyId(req.id);
    try {
      await approveVerification(req);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(req) {
    if (!rejectingId) return;
    setBusyId(req.id);
    try {
      await rejectVerification(req.id, rejectReason.trim(), req.uid);
      setRejectingId(null);
      setRejectReason("");
    } finally {
      setBusyId(null);
    }
  }

  const labels = {
    pending: "معلق",
    approved: "مقبول",
    rejected: "مرفوض",
    all: "الكل",
  };
  const counts = {
    pending: allRequests.filter((r) => r.status === "pending").length,
    approved: allRequests.filter((r) => r.status === "approved").length,
    rejected: allRequests.filter((r) => r.status === "rejected").length,
    all: allRequests.length,
  };

  return (
    <div>
      {error && (
        <p
          style={{
            fontSize: 13,
            color: "var(--danger)",
            marginBottom: 10,
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button
            key={s}
            className="btn"
            style={{
              fontSize: 12,
              padding: "5px 12px",
              background: filter === s ? "var(--ink)" : "transparent",
              color: filter === s ? "var(--paper)" : "var(--ink)",
              borderColor: filter === s ? "var(--ink)" : "var(--line)",
            }}
            onClick={() => setFilter(s)}
          >
            {labels[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--steel)" }}>
          لا توجد طلبات في هذه الحالة.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map((req) => (
            <div
              key={req.id}
              style={{
                background: "var(--paper-raised)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {req.name || req.email}
                  </p>
                  <p
                    style={{
                      margin: "2px 0",
                      fontSize: 12,
                      color: "var(--steel)",
                    }}
                  >
                    {req.email}
                  </p>
                  {req.phone && (
                    <p
                      style={{
                        margin: "2px 0",
                        fontSize: 12,
                        color: "var(--steel)",
                      }}
                    >
                      📞 {req.phone}
                    </p>
                  )}
                  {req.notes && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 12.5,
                        color: "var(--ink)",
                      }}
                    >
                      <b>ملاحظات:</b> {req.notes}
                    </p>
                  )}
                  {req.status === "rejected" && req.rejectReason && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 12.5,
                        color: "var(--danger)",
                      }}
                    >
                      <b>سبب الرفض:</b> {req.rejectReason}
                    </p>
                  )}
                </div>

                {req.status === "pending" && rejectingId !== req.id && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: "6px 14px", fontSize: 13 }}
                      onClick={() => handleApprove(req)}
                      disabled={busyId === req.id}
                    >
                      توثيق
                    </button>
                    <button
                      className="btn"
                      style={{
                        padding: "6px 14px",
                        fontSize: 13,
                        color: "var(--danger)",
                        borderColor: "var(--danger)",
                      }}
                      onClick={() => {
                        setRejectingId(req.id);
                        setRejectReason("");
                      }}
                      disabled={busyId === req.id}
                    >
                      رفض
                    </button>
                  </div>
                )}

                {req.status === "approved" && (
                  <span className="badge" style={{ alignSelf: "flex-start" }}>
                    ✅ موثق
                  </span>
                )}
                {req.status === "rejected" && (
                  <span
                    className="badge badge-danger"
                    style={{ alignSelf: "flex-start" }}
                  >
                    ❌ مرفوض
                  </span>
                )}
              </div>

              {rejectingId === req.id && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px dashed var(--line)",
                  }}
                >
                  <input
                    className="input"
                    placeholder="سبب الرفض (سيظهر للتاجر)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn"
                      style={{
                        background: "var(--danger)",
                        borderColor: "var(--danger)",
                        color: "#fff",
                        fontSize: 13,
                      }}
                      onClick={() => confirmReject(req)}
                      disabled={busyId === req.id}
                    >
                      تأكيد الرفض
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: 13 }}
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== المستخدمين ===================== */

function UsersTab({ adminUid }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [pendingRole, setPendingRole] = useState("");

  useEffect(() => {
    const unsub = subscribeAllUsers(setUsers, (err) => {
      console.error("فشل تحميل المستخدمين:", err);
      setError("تعذر تحميل المستخدمين.");
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.phone || "").includes(q) ||
          (u.company || "").toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    }
    return list;
  }, [users, search, roleFilter]);

  const counts = useMemo(() => {
    const c = { all: users.length };
    ROLE_OPTIONS.forEach((r) => {
      c[r.value] = users.filter((u) => u.role === r.value).length;
    });
    return c;
  }, [users]);

  async function handleRoleChange(u) {
    if (!pendingRole || pendingRole === u.role) {
      setEditingRoleId(null);
      return;
    }
    setBusyId(u.id);
    setError("");
    setSuccess("");
    try {
      await changeUserRole(u.id, pendingRole, adminUid);
      setSuccess(`تم تحديث دور ${u.name || u.email}`);
      setEditingRoleId(null);
      setPendingRole("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "تعذر تحديث الدور");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleSuspend(u) {
    const action = u.suspended ? "تفعيل" : "تعليق";
    if (!window.confirm(`${action} حساب ${u.name || u.email}؟`)) return;
    setBusyId(u.id);
    setError("");
    setSuccess("");
    try {
      await toggleUserSuspended(u.id, !u.suspended, adminUid);
      setSuccess(`تم ${action} الحساب`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "تعذر تحديث الحساب");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div
        style={{
          background: "var(--crane-light)",
          border: "1px solid var(--crane)",
          borderRadius: "var(--radius)",
          padding: "10px 14px",
          marginBottom: 14,
          fontSize: 12.5,
          lineHeight: 1.7,
        }}
      >
        🔐 تاب مخصص للأدمن الأساسي فقط.
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

      <input
        className="input"
        placeholder="ابحث بالاسم أو الإيميل أو الهاتف أو الشركة..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn"
          style={{
            fontSize: 12,
            padding: "5px 12px",
            background: roleFilter === "all" ? "var(--ink)" : "transparent",
            color: roleFilter === "all" ? "var(--paper)" : "var(--ink)",
            borderColor: roleFilter === "all" ? "var(--ink)" : "var(--line)",
          }}
          onClick={() => setRoleFilter("all")}
        >
          الكل ({counts.all})
        </button>
        {ROLE_OPTIONS.map((r) => (
          <button
            key={r.value}
            className="btn"
            style={{
              fontSize: 12,
              padding: "5px 12px",
              background:
                roleFilter === r.value ? "var(--ink)" : "transparent",
              color: roleFilter === r.value ? "var(--paper)" : "var(--ink)",
              borderColor:
                roleFilter === r.value ? "var(--ink)" : "var(--line)",
            }}
            onClick={() => setRoleFilter(r.value)}
          >
            {r.label} ({counts[r.value] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--steel)" }}>
          {search.trim() || roleFilter !== "all"
            ? "لا توجد نتائج مطابقة."
            : "لا يوجد مستخدمين بعد."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((u) => {
            const isEditing = editingRoleId === u.id;
            const isBusy = busyId === u.id;

            return (
              <div
                key={u.id}
                style={{
                  background: "var(--paper-raised)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  padding: 14,
                  opacity: u.suspended ? 0.6 : 1,
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
                        marginBottom: 4,
                        flexWrap: "wrap",
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
                      <span style={roleBadgeStyle(u.role)}>
                        {getRoleLabel(u.role)}
                      </span>
                      {u.suspended && (
                        <span
                          className="badge badge-danger"
                          style={{ fontSize: 11 }}
                        >
                          معلق
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12.5,
                        color: "var(--steel)",
                      }}
                    >
                      {u.email}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        marginTop: 6,
                        fontSize: 12,
                        color: "var(--steel)",
                      }}
                    >
                      {u.phone && <span>📞 {u.phone}</span>}
                      {u.governorate && <span>📍 {u.governorate}</span>}
                      {u.company && <span>🏢 {u.company}</span>}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    {!isEditing && (
                      <button
                        className="btn"
                        style={{
                          fontSize: 12,
                          padding: "5px 12px",
                          color: "var(--kabbash)",
                          borderColor: "var(--kabbash)",
                        }}
                        onClick={() => {
                          setEditingRoleId(u.id);
                          setPendingRole(u.role || "");
                        }}
                        disabled={isBusy}
                      >
                        تغيير الدور
                      </button>
                    )}

                    <button
                      className="btn"
                      style={{
                        fontSize: 12,
                        padding: "5px 12px",
                        color: u.suspended ? "var(--kabbash)" : "var(--danger)",
                        borderColor: u.suspended
                          ? "var(--kabbash)"
                          : "var(--danger)",
                      }}
                      onClick={() => handleToggleSuspend(u)}
                      disabled={isBusy}
                    >
                      {u.suspended ? "تفعيل الحساب" : "تعليق الحساب"}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px dashed var(--line)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      اختر الدور الجديد:
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <button
                          key={r.value}
                          className="btn"
                          style={{
                            fontSize: 12,
                            padding: "5px 12px",
                            background:
                              pendingRole === r.value
                                ? "var(--kabbash)"
                                : "transparent",
                            color:
                              pendingRole === r.value
                                ? "#fff"
                                : "var(--ink)",
                            borderColor:
                              pendingRole === r.value
                                ? "var(--kabbash)"
                                : "var(--line)",
                          }}
                          onClick={() => setPendingRole(r.value)}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: 13 }}
                        onClick={() => handleRoleChange(u)}
                        disabled={isBusy || !pendingRole}
                      >
                        {isBusy ? "جاري الحفظ..." : "تأكيد التغيير"}
                      </button>
                      <button
                        className="btn"
                        style={{ fontSize: 13 }}
                        onClick={() => {
                          setEditingRoleId(null);
                          setPendingRole("");
                        }}
                        disabled={isBusy}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===================== الرسائل ===================== */

function MessagesTab() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsub = subscribeMessages(setMessages);
    return () => unsub();
  }, []);

  if (messages.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "var(--steel)" }}>
        لا توجد رسائل حتى الآن.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            background: "var(--paper-raised)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            padding: 14,
          }}
          onClick={() => !m.read && markMessageRead(m.id)}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
              {m.name || "بدون اسم"}
            </p>
            {!m.read && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--kabbash)",
                  fontWeight: 700,
                }}
              >
                جديدة
              </span>
            )}
          </div>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 12,
              color: "var(--steel)",
            }}
          >
            {m.email}
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>{m.text}</p>
        </div>
      ))}
    </div>
  );
}

/* ===================== مكونات مساعدة ===================== */

function Pill({ active, onClick, children }) {
  return (
    <button
      className="btn"
      style={{
        fontSize: 12.5,
        padding: "7px 14px",
        background: active ? "var(--kabbash)" : "transparent",
        color: active ? "#fff" : "var(--ink)",
        borderColor: active ? "var(--kabbash)" : "var(--line)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Badge({ children }) {
  return (
    <span
      style={{
        background: "#fff",
        color: "var(--danger)",
        borderRadius: 999,
        padding: "1px 7px",
        fontSize: 11,
        fontWeight: 900,
        minWidth: 18,
        textAlign: "center",
      }}
    >
      {children}
    </span>
  );
}
