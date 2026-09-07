import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Calculator from "./pages/Calculator";
import AdminPanel from "./pages/AdminPanel";
import SupervisorPanel from "./pages/SupervisorPanel";
import DriverPanel from "./pages/DriverPanel";
import { ROLES, DRIVER_ROLES } from "./lib/roles";

export default function App() {
  return (
    <BrowserRouter basename="/al-jazeera-5">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/calculator" element={<Calculator />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supervisor"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SUPERVISOR]}>
                  <SupervisorPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver"
              element={
                <ProtectedRoute allowedRoles={DRIVER_ROLES}>
                  <DriverPanel />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
