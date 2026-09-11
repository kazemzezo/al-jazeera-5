import { Outlet } from "react-router-dom";
import NavDrawer from "./NavDrawer";
import Footer from "./Footer";

export default function AppLayout() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavDrawer />
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px", flex: 1, width: "100%" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
