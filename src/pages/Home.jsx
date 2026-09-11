import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGuestPrompt } from "../context/GuestPromptContext";
import { ROLES, canReserve as canReserveRole } from "../lib/roles";
import { LOCATIONS, SALE_TYPES } from "../lib/catalog";
import {
  requestVerification,
  subscribeMyLatestVerification,
} from "../lib/verification";
import {
  subscribeListings,
  subscribeTonPrices,
  reserveListingQuantity,
  reserveLot,
} from "../lib/listings";
import { DEMO_LISTINGS, DEMO_TON_PRICES } from "../lib/demoData";
import PriceBar from "../components/PriceBar";
import AnnouncementBanner from "../components/AnnouncementBanner";
import ListingCard from "../components/ListingCard";
import AddListingForm from "../components/AddListingForm";

export default function Home() {
  const { user, profile, role } = useAuth();
  const { promptLogin, promptVerification } = useGuestPrompt();
  const [location, setLocation] = useState(LOCATIONS.DOCK);
  const [listings, setListings] = useState([]);
  const [tonPrices, setTonPrices] = useState({});
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [myVerif, setMyVerif] = useState(null);
  const [sending, setSending] = useState(false);

  const isUnverifiedTrader = role === ROLES.TRADER;
  const canManage =
    role === ROLES.ADMIN ||
    (role === ROLES.SUPERVISOR && location === LOCATIONS.DOCK);

  const showDemo = listings.length === 0;
  const displayListings = showDemo
    ? DEMO_LISTINGS.filter((l) => l.location === location)
    : listings;
  const displayTonPrices =
    Object.keys(tonPrices).length > 0 ? tonPrices : DEMO_TON_PRICES;

  useEffect(() => {
    const unsub = subscribeListings(location, setListings);
    return () => unsub();
  }, [location]);

  useEffect(() => {
    const unsub = subscribeTonPrices(setTonPrices);
    return () => unsub();
  }, []);

  // راقب حالة التوثيق للتاجر
  useEffect(() => {
    if (!user) {
      setMyVerif(null);
      return;
    }
    const unsub = subscribeMyLatestVerification(user.uid, setMyVerif);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  function showNotice(text, type = "success") {
    setNotice(text);
    setNoticeType(type);
  }

  async function handleRequest() {
    if (sending) return;
    setSending(true);
    try {
      await requestVerification(user, profile);
      showNotice("تم إرسال طلب التوثيق بنجاح. سيتم مراجعته قريبًا.", "success");
    } catch (err) {
      console.error(err);
      showNotice(err.message || "تعذر إرسال الطلب، حاول مرة أخرى.", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleReserve(listing, qty) {
    if (!user) {
      promptLogin("لازم تسجل دخولك الأول عشان تقدر تحجز");
      return;
    }
    if (!canReserveRole(role)) {
      promptVerification("لإتمام الحجز، لازم توثق حسابك أولاً.");
      return;
    }

    if (listing.saleType === SALE_TYPES.LOT) {
      const res = await reserveLot(listing.id, user);
      if (!res.ok) showNotice("تم حجز هذا اللوط بالفعل من تاجر آخر.", "error");
      else showNotice("تم تأكيد الحجز بنجاح.");
      return;
    }

    const res = await reserveListingQuantity(listing.id, Number(qty || 1), user);
    if (!res.ok) {
      showNotice(
        `الكمية المطلوبة أكبر من المتاح. المتاح حاليًا: ${res.available}.`,
        "error"
      );
    } else {
      showNotice("تم تأكيد الحجز بنجاح.");
    }
  }

  const noticeBg =
    noticeType === "error" ? "var(--danger-light)" : "var(--kabbash-light)";
  const noticeBorder =
    noticeType === "error" ? "var(--danger)" : "var(--kabbash)";
  const noticeColor =
    noticeType === "error" ? "var(--danger)" : "var(--ink)";

  // نص بانر التوثيق حسب الحالة
  let verifText = "";
  let verifBtnLabel = null;
  if (isUnverifiedTrader) {
    if (myVerif?.status === "pending") {
      verifText = "طلب التوثيق تحت المراجعة ⏳ — سيتم إشعارك عند الرد.";
    } else if (myVerif?.status === "rejected") {
      verifText = `تم رفض طلب التوثيق${myVerif.rejectReason ? ": " + myVerif.rejectReason : ""}`;
      verifBtnLabel = "إعادة إرسال الطلب";
    } else {
      verifText =
        "حسابك غير موثق حاليًا. يمكنك استخدام أدوات الحساب للاطلاع فقط. للحجز، أرسل طلب توثيق.";
      verifBtnLabel = "طلب التوثيق الآن";
    }
  }

  return (
    <div>
      {notice && (
        <div
          style={{
            background: noticeBg,
            border: `1px solid ${noticeBorder}`,
            color: noticeColor,
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            marginBottom: 14,
            fontSize: 13,
          }}
        >
          {notice}
        </div>
      )}

      {isUnverifiedTrader && (
        <div
          style={{
            background: "var(--crane-light)",
            border: "1px solid var(--crane)",
            borderRadius: "var(--radius)",
            padding: "14px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1.7 }}>{verifText}</span>
          {verifBtnLabel && myVerif?.status !== "pending" && (
            <button className="btn" onClick={handleRequest} disabled={sending}>
              {sending ? "جاري الإرسال..." : verifBtnLabel}
            </button>
          )}
        </div>
      )}

      <PriceBar />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className="btn"
          style={{
            background: location === LOCATIONS.DOCK ? "var(--kabbash)" : "transparent",
            color: location === LOCATIONS.DOCK ? "#fff" : "var(--ink)",
            borderColor: location === LOCATIONS.DOCK ? "var(--kabbash)" : "var(--ink)",
          }}
          onClick={() => setLocation(LOCATIONS.DOCK)}
        >
          الرصيف البحري
        </button>
        <button
          className="btn"
          style={{
            background: location === LOCATIONS.YARD ? "var(--kabbash)" : "transparent",
            color: location === LOCATIONS.YARD ? "#fff" : "var(--ink)",
            borderColor: location === LOCATIONS.YARD ? "var(--kabbash)" : "var(--ink)",
          }}
          onClick={() => setLocation(LOCATIONS.YARD)}
        >
          ساحة الجزيره
        </button>
      </div>

      <AnnouncementBanner location={location} />

      {canManage && <AddListingForm location={location} />}

      {showDemo && (
        <p style={{ fontSize: 12, color: "var(--steel-light)", marginBottom: 10 }}>
          الأصناف دي بيانات تجريبية للعرض فقط، هتختفي أول ما تُضاف أصناف حقيقية.
        </p>
      )}

      {displayListings.length === 0 ? (
        <p style={{ color: "var(--steel)", fontSize: 14 }}>
          لا توجد أصناف مدرجة حاليًا في{" "}
          {location === LOCATIONS.DOCK ? "الرصيف البحري" : "ساحة الجزيره"}.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {displayListings.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              tonPrice={displayTonPrices[l.category]?.pricePerTon}
              canReserve={!l.demo}
              onReserve={(qty) => handleReserve(l, qty)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
