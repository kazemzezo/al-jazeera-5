import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ToastContext = createContext(null);

const DEFAULT_DURATION = 3500;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type, // success | error | warning | info
      duration: duration || DEFAULT_DURATION,
    };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (msg, duration) => showToast(msg, "success", duration),
    [showToast]
  );
  const error = useCallback(
    (msg, duration) => showToast(msg, "error", duration),
    [showToast]
  );
  const warning = useCallback(
    (msg, duration) => showToast(msg, "warning", duration),
    [showToast]
  );
  const info = useCallback(
    (msg, duration) => showToast(msg, "info", duration),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ showToast, success, error, warning, info, removeToast }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/* ============================================
   حاوية الإشعارات
   ============================================ */
function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={() => onRemove(t.id)} />
      ))}
      <style>{`
        .toast-container {
          position: fixed;
          top: 16px;
          inset-inline: 16px;
          z-index: 200;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          pointer-events: none;
        }
        @media (min-width: 640px) {
          .toast-container {
            inset-inline-start: auto;
            inset-inline-end: 20px;
            top: 20px;
            align-items: flex-end;
            max-width: 380px;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================
   إشعار واحد
   ============================================ */
function Toast({ toast, onClose }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => {
      setLeaving(true);
    }, toast.duration - 300);

    const removeTimer = setTimeout(() => {
      onClose();
    }, toast.duration);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.duration, onClose]);

  const meta = TOAST_META[toast.type] || TOAST_META.info;

  return (
    <div
      className={"toast" + (leaving ? " leaving" : "")}
      style={{
        background: meta.bg,
        borderColor: meta.border,
        color: meta.color,
      }}
      role="alert"
    >
      <span className="toast-icon">{meta.icon}</span>
      <span className="toast-message">{toast.message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={() => {
          setLeaving(true);
          setTimeout(onClose, 250);
        }}
        aria-label="إغلاق"
      >
        ✕
      </button>

      <style>{`
        .toast {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1.5px solid;
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
          width: 100%;
          max-width: 420px;
          animation: toast-in .28s cubic-bezier(0.22, 0.61, 0.36, 1);
          transition: opacity .25s ease, transform .25s ease;
          font-size: 13.5px;
          line-height: 1.5;
          font-weight: 600;
        }
        .toast.leaving {
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
        }

        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .toast-icon {
          font-size: 17px;
          flex-shrink: 0;
          line-height: 1;
        }
        .toast-message {
          flex: 1;
          min-width: 0;
        }
        .toast-close {
          background: transparent;
          border: none;
          color: currentColor;
          opacity: 0.6;
          cursor: pointer;
          font-size: 13px;
          padding: 2px 4px;
          border-radius: 4px;
          flex-shrink: 0;
          font-family: inherit;
          transition: opacity .2s;
        }
        .toast-close:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

/* ============================================
   ألوان وأنماط الإشعارات
   ============================================ */
const TOAST_META = {
  success: {
    icon: "✅",
    bg: "var(--kabbash-light)",
    border: "var(--kabbash)",
    color: "var(--kabbash)",
  },
  error: {
    icon: "❌",
    bg: "var(--danger-light)",
    border: "var(--danger)",
    color: "var(--danger)",
  },
  warning: {
    icon: "⚠️",
    bg: "var(--crane-light)",
    border: "var(--crane)",
    color: "var(--crane)",
  },
  info: {
    icon: "ℹ️",
    bg: "var(--paper-raised)",
    border: "var(--line-strong)",
    color: "var(--ink)",
  },
};

/* ============================================
   Hook
   ============================================ */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
