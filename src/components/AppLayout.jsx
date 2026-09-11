import { Outlet } from "react-router-dom";
import NavDrawer from "./NavDrawer";
import Footer from "./Footer";

export default function AppLayout() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavDrawer />
      <main className="container" style={{ flex: 1, paddingBlock: "32px" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
