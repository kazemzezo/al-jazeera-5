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
  const [mode, setMode] = useState("login");
  const timerRef = useRef(null);

  useEffect(() => {
    if (user) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    timerRef.current = setTimeout(() => {
      setReason("");
      setMode("login");
      setVisible(true);
    }, AUTO_SHOW_DELAY_MS);

    return () => clearTimeout(timerRef.current);
  }, [user]);

  function promptLogin(customReason) {
    setReason(customReason || "");
    setMode("login");
    setVisible(true);
  }

  function promptVerification(customReason) {
    setReason(customReason || "");
    setMode("verify");
    setVisible(true);
  }

  function dismiss(permanent) {
    setVisible(false);
    if (permanent) sessionStorage.setItem(DISMISS_KEY, "1");
  }

  return (
    <GuestPromptContext.Provider value={{ promptLogin, promptVerification }}>
      {children}
      {visible && (
        <GuestPromptBanner reason={reason} mode={mode} onClose={() => dismiss(true)} />
      )}
    </GuestPromptContext.Provider>
  );
}

function GuestPromptBanner({ reason, mode, onClose }) {
  const navigate = useNavigate();

  const defaultReason =
    mode === "verify"
      ? "لا يمكنك الحجز بدون توثيق حسابك كتاجر"
      : "سجّل دخولك للاستفادة من كل مزايا الموقع";

  const actionLabel = mode === "verify" ? "طلب التوثيق" : "تسجيل الدخول";
  const actionTo = mode === "verify" ? "/" : "/login";

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
      <span style={{ fontSize: 13, lineHeight: 1.5 }}>{reason || defaultReason}</span>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          className="btn"
          style={{ fontSize: 12, padding: "6px 12px", background: "var(--kabbash)", borderColor: "var(--kabbash)", color: "#fff" }}
          onClick={() => {
            onClose();
            navigate(actionTo);
          }}
        >
          {actionLabel}
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
