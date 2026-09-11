import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ROLES, isDriver } from "../lib/roles";
import Logo from "./Logo";

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
    <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
    <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
  </svg>
);

const IconShare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

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
      try {
        await navigator.clipboard.writeText(url);
        alert("تم نسخ رابط الموقع");
      } catch (e) {}
    }
  }

  // قفل تمرير الصفحة + إغلاق بمفتاح Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-brand" onClick={() => go("/")}>
            <Logo />
          </div>

          <div className="app-header-actions">
            <button className="btn btn-ghost btn-icon" onClick={share} aria-label="مشاركة">
              <IconShare />
            </button>
            <button className="btn btn-ghost btn-icon" onClick={toggle} aria-label="تبديل الوضع الليلي">
              {mode === "light" ? <IconMoon /> : <IconSun />}
            </button>
            <button className="btn btn-ghost btn-icon" onClick={() => setOpen(true)} aria-label="القائمة">
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="drawer-backdrop" onClick={() => setOpen(false)} role="presentation">
          <aside
            className="drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="قائمة التنقل"
          >
            <div className="drawer-head">
              <Logo size={26} />
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="إغلاق">
                <IconClose />
              </button>
            </div>

            <nav className="drawer-nav">
              <DrawerLink onClick={() => go("/")}>الرئيسية</DrawerLink>
              <DrawerLink onClick={() => go(user ? "/profile" : "/login")}>
                {user ? "حسابي" : "تسجيل الدخول"}
              </DrawerLink>

              <button
                className="drawer-section-toggle"
                onClick={() => setSectionsOpen((v) => !v)}
                aria-expanded={sectionsOpen}
              >
                <span>الأقسام</span>
                <span className={`drawer-caret ${sectionsOpen ? "open" : ""}`}>▾</span>
              </button>

              <div className={`drawer-sublist ${sectionsOpen ? "open" : ""}`}>
                <DrawerLink onClick={() => go("/dock")}>الرصيف البحري</DrawerLink>
<DrawerLink onClick={() => go("/yard")}>ساحة الجزيره</DrawerLink>
                {(role === ROLES.ADMIN || isPrimaryAdmin) && (
                  <DrawerLink onClick={() => go("/admin")}>لوحة الإدمن</DrawerLink>
                )}
                {role === ROLES.SUPERVISOR && (
                  <DrawerLink onClick={() => go("/supervisor")}>لوحة الإشراف</DrawerLink>
                )}
                {isDriver(role) && <DrawerLink onClick={() => go("/driver")}>حالة المعدة</DrawerLink>}
              </div>

              <div className="drawer-sep" />

              <DrawerLink onClick={() => go("/contact")}>تواصل معنا</DrawerLink>
              <DrawerLink onClick={() => go("/about")}>عن الموقع</DrawerLink>
              <DrawerLink onClick={() => go("/guide")}>دليل الاستخدام</DrawerLink>
              <DrawerLink onClick={() => go("/terms")}>شروط الاستخدام</DrawerLink>
              <DrawerLink onClick={() => go("/privacy")}>سياسة الخصوصية</DrawerLink>

              {user && (
                <>
                  <div className="drawer-sep" />
                  <button
                    className="btn btn-primary drawer-logout"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                  >
                    خروج
                  </button>
                </>
              )}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

function DrawerLink({ onClick, children }) {
  return (
    <button className="drawer-link" onClick={onClick}>
      {children}
    </button>
  );
}
