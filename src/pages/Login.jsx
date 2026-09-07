import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, loading, loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  if (loading) {
    return <div className="page-loading">جاري التحقق من الحساب...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleLogin() {
    setError("");
    setSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError("تعذر تسجيل الدخول. حاول مرة أخرى.");
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: "var(--kabbash)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 20,
            margin: "0 auto 16px",
          }}
        >
          ج٥
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>
          الجزيره خمسه
        </h1>
        <p style={{ fontSize: 14, color: "var(--steel)", margin: "0 0 28px" }}>
          سوق الخردة الإلكتروني - الرصيف البحري وساحة الجزيره
        </p>

        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={signingIn}
          style={{ width: "100%" }}
        >
          {signingIn ? "جاري تسجيل الدخول..." : "تسجيل الدخول عبر جوجل"}
        </button>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 12 }}>
            {error}
          </p>
        )}

        <p style={{ fontSize: 12, color: "var(--steel-light)", marginTop: 24 }}>
          بالمتابعة أنت توافق على{" "}
          <a href="/privacy" style={{ textDecoration: "underline" }}>
            سياسة الخصوصية وشروط الاستخدام
          </a>
        </p>
      </div>
    </div>
  );
}
