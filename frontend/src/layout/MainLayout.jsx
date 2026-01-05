import Sidebar from "../components/sidebar/Sidebar";
import Topbar from "../components/topbar/Topbar";

export default function MainLayout({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gridTemplateRows: "64px 1fr",
        height: "100vh"
      }}
    >
      <Sidebar />
      <Topbar />

      <main
        style={{
          gridColumn: 2,
          gridRow: 2,
          padding: 24,
          overflowY: "auto"
        }}
      >
        {children}
      </main>
    </div>
  );
}

