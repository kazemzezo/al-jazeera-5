import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import VerificationRequestModal from "../components/VerificationRequestModal";

const GuestPromptContext = createContext(null);

const DISMISS_KEY = "aj5_guest_prompt_dismissed";
const AUTO_SHOW_DELAY_MS = 60000;

export function GuestPromptProvider({ children }) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState("login");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
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

  function openVerificationModal() {
    setVisible(false);
    setShowVerificationModal(true);
  }

  function closeVerificationModal() {
    setShowVerificationModal(false);
  }

  function dismiss(permanent) {
    setVisible(false);
    if (permanent) sessionStorage.setItem(DISMISS_KEY, "1");
  }

  return (
    <GuestPromptContext.Provider value={{ promptLogin, promptVerification }}>
      {children}
      {visible && mode === "login" && (
        <GuestPromptBanner reason={reason} onClose={() => dismiss(true)} />
      )}
      {visible && mode === "verify" && (
        <VerificationPrompt
          reason={reason}
          onClose={() => dismiss(false)}
          onOpenModal={openVerificationModal}
        />
      )}
      {showVerificationModal && (
        <VerificationRequestModal onClose={closeVerificationModal} />
      )}
    </GuestPromptContext.Provider>
  );
}

/* ============================================
   Banner تسجيل الدخول
   ============================================ */
function GuestPromptBanner({ reason, onClose }) {
  const navigate = useNavigate();
  const defaultReason = "سجّل دخولك للاستفادة من كل مزايا الموقع";

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
        {reason || defaultReason}
      </span>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          className="btn"
          style={{
            fontSize: 12,
            padding: "6px 12px",
            background: "var(--kabbash)",
            borderColor: "var(--kabbash)",
            color: "#fff",
          }}
          onClick={() => {
            onClose();
            navigate("/login");
          }}
        >
          تسجيل الدخول
        </button>
        <button
          className="btn"
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderColor: "var(--paper)",
            color: "var(--paper)",
          }}
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ============================================
   Banner طلب التوثيق
   ============================================ */
function VerificationPrompt({ reason, onClose, onOpenModal }) {
  const defaultReason =
    "لا يمكنك الحجز بدون توثيق حسابك كتاجر";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        insetInline: 16,
        maxWidth: 480,
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
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 13, lineHeight: 1.5, flex: 1, minWidth: 200 }}>
        {reason || defaultReason}
      </span>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          className="btn"
          style={{
            fontSize: 12,
            padding: "6px 14px",
            background: "var(--kabbash)",
            borderColor: "var(--kabbash)",
            color: "#fff",
            fontWeight: 700,
          }}
          onClick={() => {
            onClose();
            onOpenModal();
          }}
        >
          🔑 طلب التوثيق
        </button>
        <button
          className="btn"
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderColor: "var(--paper)",
            color: "var(--paper)",
          }}
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
  if (!ctx)
    throw new Error("useGuestPrompt must be used inside GuestPromptProvider");
  return ctx;
}
