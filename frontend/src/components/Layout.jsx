import Sidebar from "./sidebar/Sidebar";
import Topbar from "./topbar/Topbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <Sidebar />
      <Topbar />

      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}

