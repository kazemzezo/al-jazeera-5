import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ROLES, isDriver } from "../lib/roles";
import Logo from "./Logo";

export default function NavDrawer() {
  const [open, setOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const { user, role, logout, isPrimaryAdmin } = useAuth();
  const { mode, toggle } = useTheme();
  const navigate = useNavigate();

  function go(path) {
    setOpen(false);
    navigate(path);
  }

  async function share() {
    const url = window.location.origin + window.location.pathname;
    if (navigator.share) {
      try {
        await navigator.share({ title: "الجزيره خمسه", url });
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("تم نسخ رابط الموقع");
    }
  }

  return (
    <>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 20px",
          borderBottom: "1px solid var(--line)",
          background: "var(--paper-raised)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn" style={{ padding: "6px 10px" }} onClick={() => setOpen(true)} aria-label="القائمة">
            ☰
          </button>
          <button className="btn" style={{ padding: "6px 10px" }} onClick={toggle} aria-label="الوضع الليلي">
            {mode === "light" ? "🌙" : "☀️"}
          </button>
          <button className="btn" style={{ padding: "6px 10px" }} onClick={share} aria-label="مشاركة">
            🔗
          </button>
        </div>

        <div onClick={() => go("/")} style={{ cursor: "pointer" }}>
          <Logo />
        </div>
      </header>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 60 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              insetInlineStart: 0,
              width: 280,
              maxWidth: "85vw",
              height: "100%",
              background: "var(--paper-raised)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Logo size={26} />
              <button className="btn" style={{ padding: "4px 10px" }} onClick={() => setOpen(false)}>✕</button>
            </div>

            <DrawerLink onClick={() => go("/")}>الرئيسية</DrawerLink>
            <DrawerLink onClick={() => go(user ? "/profile" : "/login")}>
              {user ? "حسابي" : "تسجيل الدخول"}
            </DrawerLink>

            <button
              className="btn"
              style={{ textAlign: "start", border: "none", padding: "10px 4px", fontWeight: 700 }}
              onClick={() => setSectionsOpen(!sectionsOpen)}
            >
              الأقسام {sectionsOpen ? "▲" : "▼"}
            </button>
            {sectionsOpen && (
              <div style={{ paddingInlineStart: 12 }}>
                <DrawerLink onClick={() => go("/calculator")}>أداة الحساب والفاتورة</DrawerLink>
                {(role === ROLES.ADMIN || isPrimaryAdmin) && (
                  <DrawerLink onClick={() => go("/admin")}>لوحة الإدمن</DrawerLink>
                )}
                {role === ROLES.SUPERVISOR && (
                  <DrawerLink onClick={() => go("/supervisor")}>لوحة الإشراف</DrawerLink>
                )}
                {isDriver(role) && <DrawerLink onClick={() => go("/driver")}>حالة المعدة</DrawerLink>}
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--line)", margin: "10px 0" }} />

            <DrawerLink onClick={() => go("/contact")}>تواصل معنا</DrawerLink>
            <DrawerLink onClick={() => go("/about")}>عن الموقع</DrawerLink>
            <DrawerLink onClick={() => go("/guide")}>دليل الاستخدام</DrawerLink>
            <DrawerLink onClick={() => go("/terms")}>شروط الاستخدام</DrawerLink>
            <DrawerLink onClick={() => go("/privacy")}>سياسة الخصوصية</DrawerLink>

            {user && (
              <>
                <div style={{ borderTop: "1px solid var(--line)", margin: "10px 0" }} />
                <button
                  className="btn"
                  style={{ marginTop: 4 }}
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                >
                  خروج
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DrawerLink({ onClick, children }) {
  return (
    <button
      className="btn"
      style={{ textAlign: "start", border: "none", padding: "10px 4px", fontSize: 14, fontWeight: 400 }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
