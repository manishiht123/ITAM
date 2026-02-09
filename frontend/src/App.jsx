import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoadingOverlay } from "./components/ui";

// Eager load critical components (needed immediately)
import Layout from "./components/Layout";
import Login from "./pages/Login";

// Lazy load all other pages for code splitting
// Main Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Assets = lazy(() => import("./pages/Assets"));
const AddAsset = lazy(() => import("./pages/AddAsset"));
const EditAsset = lazy(() => import("./pages/EditAsset"));
const AssetAllocation = lazy(() => import("./pages/AssetAllocation"));
const AssetHandover = lazy(() => import("./pages/AssetHandover"));
const Employees = lazy(() => import("./pages/Employees"));
const Software = lazy(() => import("./pages/Software"));
const Profile = lazy(() => import("./pages/Profile"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));

// Organization Pages
const Locations = lazy(() => import("./pages/Locations"));
const Departments = lazy(() => import("./pages/Departments"));
const AssetCategories = lazy(() => import("./pages/AssetCategories"));
const AddAssetCategory = lazy(() => import("./pages/AddAssetCategory"));

// Settings Pages
const OrganizationEntities = lazy(() => import("./pages/settings/OrganizationEntities"));
const UsersRoles = lazy(() => import("./pages/settings/UsersRoles"));
const AssetConfiguration = lazy(() => import("./pages/settings/AssetConfiguration"));
const LicensesCompliance = lazy(() => import("./pages/settings/LicensesCompliance"));
const AssignmentsOwnership = lazy(() => import("./pages/settings/AssignmentsOwnership"));
const Notifications = lazy(() => import("./pages/settings/Notifications"));
const SecurityAudit = lazy(() => import("./pages/settings/SecurityAudit"));
const FinancialSettings = lazy(() => import("./pages/settings/FinancialSettings"));
const SystemPreferences = lazy(() => import("./pages/settings/SystemPreferences"));
const PasswordPolicy = lazy(() => import("./pages/settings/PasswordPolicy"));
const Reports = lazy(() => import("./pages/settings/Reports"));

// Loading fallback component
const PageLoader = () => <LoadingOverlay visible={true} message="Loading page..." />;

export default function App() {
  return (
    <Routes>
      {/* Login - No suspense needed, eager loaded */}
      <Route path="/login" element={<Login />} />

      {/* Protected layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" />} />

        {/* Main Routes */}
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/assets"
          element={
            <Suspense fallback={<PageLoader />}>
              <Assets />
            </Suspense>
          }
        />
        <Route
          path="/assets/add"
          element={
            <Suspense fallback={<PageLoader />}>
              <AddAsset />
            </Suspense>
          }
        />
        <Route
          path="/assets/edit/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <EditAsset />
            </Suspense>
          }
        />
        <Route
          path="/assets/allocate"
          element={
            <Suspense fallback={<PageLoader />}>
              <AssetAllocation />
            </Suspense>
          }
        />
        <Route
          path="/assets/handover"
          element={
            <Suspense fallback={<PageLoader />}>
              <AssetHandover />
            </Suspense>
          }
        />
        <Route
          path="employees"
          element={
            <Suspense fallback={<PageLoader />}>
              <Employees />
            </Suspense>
          }
        />
        <Route
          path="software"
          element={
            <Suspense fallback={<PageLoader />}>
              <Software />
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          }
        />
        <Route
          path="profile/password"
          element={
            <Suspense fallback={<PageLoader />}>
              <ChangePassword />
            </Suspense>
          }
        />

        {/* Organization Pages */}
        <Route
          path="locations"
          element={
            <Suspense fallback={<PageLoader />}>
              <Locations />
            </Suspense>
          }
        />
        <Route
          path="departments"
          element={
            <Suspense fallback={<PageLoader />}>
              <Departments />
            </Suspense>
          }
        />
        <Route
          path="asset-categories"
          element={
            <Suspense fallback={<PageLoader />}>
              <AssetCategories />
            </Suspense>
          }
        />
        <Route
          path="asset-categories/add"
          element={
            <Suspense fallback={<PageLoader />}>
              <AddAssetCategory />
            </Suspense>
          }
        />

        {/* Settings Routes */}
        <Route
          path="settings/entities"
          element={
            <Suspense fallback={<PageLoader />}>
              <OrganizationEntities />
            </Suspense>
          }
        />
        <Route
          path="settings/users"
          element={
            <Suspense fallback={<PageLoader />}>
              <UsersRoles />
            </Suspense>
          }
        />
        <Route
          path="settings/asset-config"
          element={
            <Suspense fallback={<PageLoader />}>
              <AssetConfiguration />
            </Suspense>
          }
        />
        <Route
          path="settings/licenses"
          element={
            <Suspense fallback={<PageLoader />}>
              <LicensesCompliance />
            </Suspense>
          }
        />
        <Route
          path="settings/assignments"
          element={
            <Suspense fallback={<PageLoader />}>
              <AssignmentsOwnership />
            </Suspense>
          }
        />
        <Route
          path="settings/notifications"
          element={
            <Suspense fallback={<PageLoader />}>
              <Notifications />
            </Suspense>
          }
        />
        <Route
          path="settings/security"
          element={
            <Suspense fallback={<PageLoader />}>
              <SecurityAudit />
            </Suspense>
          }
        />
        <Route
          path="settings/finance"
          element={
            <Suspense fallback={<PageLoader />}>
              <FinancialSettings />
            </Suspense>
          }
        />
        <Route
          path="settings/reports"
          element={
            <Suspense fallback={<PageLoader />}>
              <Reports />
            </Suspense>
          }
        />
        <Route
          path="settings/system"
          element={
            <Suspense fallback={<PageLoader />}>
              <SystemPreferences />
            </Suspense>
          }
        />
        <Route
          path="settings/password"
          element={
            <Suspense fallback={<PageLoader />}>
              <PasswordPolicy />
            </Suspense>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
