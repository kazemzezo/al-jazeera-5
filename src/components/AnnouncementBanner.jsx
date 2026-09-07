import { useEffect, useState } from "react";
import { subscribeAnnouncements } from "../lib/listings";

export default function AnnouncementBanner({ location }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = subscribeAnnouncements(location, setItems);
    return () => unsub();
  }, [location]);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: "var(--kabbash-light)",
        border: "1px solid var(--kabbash)",
        borderRadius: "var(--radius)",
        padding: "12px 14px",
        marginBottom: 16,
        fontSize: 13,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {items.slice(0, 3).map((a) => (
        <span key={a.id}>{a.text}</span>
      ))}
    </div>
  );
}
