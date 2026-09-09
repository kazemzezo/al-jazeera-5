import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const GuestPromptContext = createContext(null);

const DISMISS_KEY = "aj5_guest_prompt_dismissed";
const AUTO_SHOW_DELAY_MS = 60000;

export function GuestPromptProvider({ children }) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    if (user) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    timerRef.current = setTimeout(() => {
      setReason("");
      setVisible(true);
    }, AUTO_SHOW_DELAY_MS);

    return () => clearTimeout(timerRef.current);
  }, [user]);

  function promptLogin(customReason) {
    if (user) return;
    setReason(customReason || "");
    setVisible(true);
  }

  function dismiss(permanent) {
    setVisible(false);
    if (permanent) sessionStorage.setItem(DISMISS_KEY, "1");
  }

  return (
    <GuestPromptContext.Provider value={{ promptLogin }}>
      {children}
      {visible && !user && (
        <GuestPromptBanner reason={reason} onClose={() => dismiss(true)} />
      )}
    </GuestPromptContext.Provider>
  );
}

function GuestPromptBanner({ reason, onClose }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        insetInline: 16,
        maxWidth: 420,
        margin: "0 auto",
        background: "var(--ink)",
        color: "var(--paper)",
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        zIndex: 50,
      }}
    >
      <span style={{ fontSize: 13, lineHeight: 1.5 }}>
        {reason || "سجّل دخولك للاستفادة من كل مزايا الموقع"}
      </span>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          className="btn"
          style={{ fontSize: 12, padding: "6px 12px", background: "var(--kabbash)", borderColor: "var(--kabbash)", color: "#fff" }}
          onClick={() => {
            onClose();
            navigate("/login");
          }}
        >
          تسجيل الدخول
        </button>
        <button
          className="btn"
          style={{ fontSize: 12, padding: "6px 10px", borderColor: "var(--paper)", color: "var(--paper)" }}
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function useGuestPrompt() {
  const ctx = useContext(GuestPromptContext);
  if (!ctx) throw new Error("useGuestPrompt must be used inside GuestPromptProvider");
  return ctx;
}
