import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES, isDriver } from "../lib/roles";

const linkStyle = ({ isActive }) => ({
  padding: "8px 14px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: isActive ? 700 : 400,
  color: isActive ? "var(--kabbash)" : "var(--ink)",
  background: isActive ? "var(--kabbash-light)" : "transparent",
  whiteSpace: "nowrap",
});

export default function AppLayout() {
  const { user, profile, role, logout, isPrimaryAdmin } = useAuth();

  return (
    <div style={{ minHeight: "100vh" }}>
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
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--kabbash)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            ج٥
          </div>
          <strong style={{ fontSize: 16 }}>الجزيره خمسه</strong>
        </div>

        <nav style={{ display: "flex", gap: 4, overflowX: "auto" }}>
          <NavLink to="/" style={linkStyle} end>
            الرئيسية
          </NavLink>
          <NavLink to="/calculator" style={linkStyle}>
            أداة الحساب
          </NavLink>
          {(role === ROLES.ADMIN || isPrimaryAdmin) && (
            <NavLink to="/admin" style={linkStyle}>
              لوحة الإدمن
            </NavLink>
          )}
          {role === ROLES.SUPERVISOR && (
            <NavLink to="/supervisor" style={linkStyle}>
              لوحة الإشراف
            </NavLink>
          )}
          {isDriver(role) && (
            <NavLink to="/driver" style={linkStyle}>
              حالة المعدة
            </NavLink>
          )}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user && (
            <>
              <span style={{ fontSize: 13, color: "var(--steel)" }}>
                {profile?.name || user.email}
              </span>
              <button className="btn" onClick={logout} style={{ padding: "6px 14px", fontSize: 13 }}>
                خروج
              </button>
            </>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px" }}>
        <Outlet />
      </main>
    </div>
  );
}
