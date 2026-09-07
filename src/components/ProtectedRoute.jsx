import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// allowedRoles: array of role strings. If omitted, only requires login.
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">جاري التحقق من الحساب...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="page-loading">
        ليس لديك صلاحية للوصول إلى هذه الصفحة.
      </div>
    );
  }

  return children;
}
