import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import AssetAllocation from "./pages/AssetAllocation";
import AddAsset from "./pages/AddAsset";
import EditAsset from "./pages/EditAsset";
import AssetHandover from "./pages/AssetHandover";
import Employees from "./pages/Employees";
import Login from "./pages/Login";

import Locations from "./pages/Locations";
import Departments from "./pages/Departments";
import AssetCategories from "./pages/AssetCategories";
import AddAssetCategory from "./pages/AddAssetCategory";
import OrganizationEntities from "./pages/settings/OrganizationEntities";
import UsersRoles from "./pages/settings/UsersRoles";
import AssetConfiguration from "./pages/settings/AssetConfiguration";
import LicensesCompliance from "./pages/settings/LicensesCompliance";
import AssignmentsOwnership from "./pages/settings/AssignmentsOwnership";
import Notifications from "./pages/settings/Notifications";
import SecurityAudit from "./pages/settings/SecurityAudit";
import FinancialSettings from "./pages/settings/FinancialSettings";
import SystemPreferences from "./pages/settings/SystemPreferences";
import PasswordPolicy from "./pages/settings/PasswordPolicy";
import Reports from "./pages/settings/Reports";
import Software from "./pages/Software";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";

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
        <Route path="/assets/edit/:id" element={<EditAsset />} />
        <Route path="/assets/allocate" element={<AssetAllocation />} />
        <Route path="/assets/handover" element={<AssetHandover />} />
        <Route path="employees" element={<Employees />} />

        {/* New Pages */}
        <Route path="locations" element={<Locations />} />
        <Route path="departments" element={<Departments />} />
        <Route path="asset-categories" element={<AssetCategories />} />
        <Route path="asset-categories/add" element={<AddAssetCategory />} />

        {/* Settings Sub-routes */}
        <Route path="settings/entities" element={<OrganizationEntities />} />
        <Route path="settings/users" element={<UsersRoles />} />
        <Route path="settings/licenses" element={<LicensesCompliance />} />
        <Route path="settings/assignments" element={<AssignmentsOwnership />} />
        <Route path="settings/notifications" element={<Notifications />} />
        <Route path="settings/security" element={<SecurityAudit />} />
        <Route path="settings/finance" element={<FinancialSettings />} />
        <Route path="settings/reports" element={<Reports />} />
        <Route path="software" element={<Software />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/password" element={<ChangePassword />} />
        <Route path="settings/system" element={<SystemPreferences />} />
        <Route path="settings/password" element={<PasswordPolicy />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
