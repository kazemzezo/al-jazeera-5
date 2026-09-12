import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GuestPromptProvider } from "./context/GuestPromptContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dock from "./pages/Dock";
import Yard from "./pages/Yard";
import AdDetails from "./pages/AdDetails";
import Calculator from "./pages/Calculator";
import AdminPanel from "./pages/AdminPanel";
import SupervisorPanel from "./pages/SupervisorPanel";
import DriverPanel from "./pages/DriverPanel";
import Profile from "./pages/Profile";
import { About, Contact, Guide, Terms, Privacy } from "./pages/StaticPages";
import { ROLES, DRIVER_ROLES } from "./lib/roles";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename="/al-jazeera-5">
        <AuthProvider>
          <GuestPromptProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/dock" element={<Dock />} />
                <Route path="/yard" element={<Yard />} />
                <Route path="/ads/:id" element={<AdDetails />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/guide" element={<Guide />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
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
          </GuestPromptProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
