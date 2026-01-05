import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import AssetAllocation from "./pages/AssetAllocation";
import AddAsset from "./pages/AddAsset";
import AssetHandover from "./pages/AssetHandover";
import Employees from "./pages/Employees";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Protected layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="/assets" element={<Assets />} />
	<Route path="/assets/add" element={<AddAsset />} />
	<Route path="/assets/allocate" element={<AssetAllocation />} />
	<Route path="/assets/handover" element={<AssetHandover />} />
        <Route path="employees" element={<Employees />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

