import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGuestPrompt } from "../context/GuestPromptContext";
import { ROLES, canReserve as canReserveRole } from "../lib/roles";
import { LOCATIONS } from "../lib/catalog";
import { requestVerification } from "../lib/verification";
import { subscribeListings, subscribeTonPrices, markListingReserved } from "../lib/listings";
import { DEMO_LISTINGS, DEMO_TON_PRICES } from "../lib/demoData";
import PriceBar from "../components/PriceBar";
import AnnouncementBanner from "../components/AnnouncementBanner";
import ListingCard from "../components/ListingCard";
import AddListingForm from "../components/AddListingForm";

export default function Home() {
  const { user, profile, role } = useAuth();
  const { promptLogin, promptVerification } = useGuestPrompt();
  const [sent, setSent] = useState(false);
  const [location, setLocation] = useState(LOCATIONS.DOCK);
  const [listings, setListings] = useState([]);
  const [tonPrices, setTonPrices] = useState({});

  const isUnverifiedTrader = role === ROLES.TRADER;
  const canManage = role === ROLES.ADMIN || (role === ROLES.SUPERVISOR && location === LOCATIONS.DOCK);

  const realListingsForLocation = listings;
  const showDemo = realListingsForLocation.length === 0;
  const displayListings = showDemo
    ? DEMO_LISTINGS.filter((l) => l.location === location)
    : realListingsForLocation;
  const displayTonPrices = Object.keys(tonPrices).length > 0 ? tonPrices : DEMO_TON_PRICES;

  useEffect(() => {
    const unsub = subscribeListings(location, setListings);
    return () => unsub();
  }, [location]);

  useEffect(() => {
    const unsub = subscribeTonPrices(setTonPrices);
    return () => unsub();
  }, []);

  async function handleRequest() {
    await requestVerification(user, profile);
    setSent(true);
  }

  async function handleReserve(listing) {
    if (!user) {
      promptLogin("لازم تسجل دخولك الأول عشان تقدر تحجز");
      return;
    }
    if (!canReserveRole(role)) {
      promptVerification("لا يمكنك الحجز بدون توثيق حسابك كتاجر أولاً. تواصل مع إدارة الموقع للتوثيق.");
      return;
    }
    await markListingReserved(listing.id, user.uid);
  }

  return (
    <div>
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
          <span style={{ fontSize: 14 }}>
            حسابك غير موثق حاليًا، يمكنك استخدام أدوات الحساب للاطلاع فقط. للحجز
            والشراء، تواصل مع إدارة الموقع للتوثيق.
          </span>
          <button className="btn" onClick={handleRequest} disabled={sent}>
            {sent ? "تم إرسال الطلب" : "طلب التوثيق الآن"}
          </button>
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
              onReserve={() => handleReserve(l)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
