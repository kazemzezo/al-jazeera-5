import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import NavDrawer from "./NavDrawer";
import Footer from "./Footer";
import CompleteProfileForm, {
  PROFILE_FORM_DISMISSED_KEY,
} from "./CompleteProfileForm";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/roles";
import { isProfileComplete } from "../lib/profile";

export default function AppLayout() {
  const { user, profile, role, loading } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isAdmin = role === ROLES.ADMIN;
  const isIncomplete =
    user && !isAdmin && !isProfileComplete(profile);

  // تحديد ما إذا كان يجب عرض الفورم
  useEffect(() => {
    if (loading) return;
    if (!isIncomplete) {
      setShowForm(false);
      setDismissed(false);
      return;
    }
    const wasDismissed =
      sessionStorage.getItem(PROFILE_FORM_DISMISSED_KEY) === "1";
    setDismissed(wasDismissed);
    setShowForm(!wasDismissed);
  }, [loading, isIncomplete]);

  function handleClose() {
    setShowForm(false);
    setDismissed(
      sessionStorage.getItem(PROFILE_FORM_DISMISSED_KEY) === "1"
    );
  }

  function openFormAgain() {
    sessionStorage.removeItem(PROFILE_FORM_DISMISSED_KEY);
    setDismissed(false);
    setShowForm(true);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavDrawer />

      {isIncomplete && dismissed && !showForm && (
        <div
          style={{
            background: "var(--crane-light)",
            borderBottom: "1px solid var(--crane)",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13.5, color: "var(--ink)" }}>
            ⚠️ بياناتك ناقصة — لن تتمكن من الحجز حتى تكملها.
          </span>
          <button
            className="btn"
            style={{ fontSize: 12.5, padding: "5px 12px" }}
            onClick={openFormAgain}
          >
            أكمل الآن
          </button>
        </div>
      )}

      <main
        className="container"
        style={{ flex: 1, paddingBlock: "32px" }}
      >
        <Outlet />
      </main>

      <Footer />

      {showForm && <CompleteProfileForm onClose={handleClose} />}
    </div>
  );
}
