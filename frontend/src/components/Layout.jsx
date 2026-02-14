import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";
import Topbar from "./topbar/Topbar";
import AISmartSearch from "./ai/AISmartSearch";

export default function Layout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <>
      <Sidebar />
      <Topbar />

      <main className="app-main">
        <Outlet />
      </main>

      {/* Global AI Chat Widget */}
      <AISmartSearch />
    </>
  );
}
