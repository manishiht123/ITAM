import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoadingOverlay } from "./components/ui";
import RoleGuard from "./components/RoleGuard";

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
const Disposals     = lazy(() => import("./pages/Disposals"));
const Employees = lazy(() => import("./pages/Employees"));
const Software = lazy(() => import("./pages/Software"));
const Profile = lazy(() => import("./pages/Profile"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));

// Organization Pages (merged into one)
const OrgSettings = lazy(() => import("./pages/OrgSettings"));

// Settings Pages
const OrganizationEntities = lazy(() => import("./pages/settings/OrganizationEntities"));
const UsersRoles = lazy(() => import("./pages/settings/UsersRoles"));
const AssetConfiguration = lazy(() => import("./pages/settings/AssetConfiguration"));
const LicensesCompliance = lazy(() => import("./pages/settings/LicensesCompliance"));
const AssignmentsOwnership = lazy(() => import("./pages/settings/AssignmentsOwnership"));
const Notifications = lazy(() => import("./pages/settings/Notifications"));
const SecurityAudit = lazy(() => import("./pages/settings/SecurityAudit"));
const SystemPreferences = lazy(() => import("./pages/settings/SystemPreferences"));
const PasswordPolicy = lazy(() => import("./pages/settings/PasswordPolicy"));
const Reports = lazy(() => import("./pages/settings/Reports"));
const BackupRestore = lazy(() => import("./pages/settings/BackupRestore"));
const AIIntelligence = lazy(() => import("./pages/AIIntelligence"));

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

        {/* Dashboard — available to all */}
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          }
        />

        {/* Asset routes — requires assets access */}
        <Route
          path="/assets"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard module="assets"><Assets /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="/assets/add"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard module="assets"><AddAsset /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="/assets/edit/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard module="assets"><EditAsset /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="/assets/allocate"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard module="assets"><AssetAllocation /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="/assets/handover"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard module="assets"><AssetHandover /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="/assets/disposals"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard module="assets"><Disposals /></RoleGuard>
            </Suspense>
          }
        />

        {/* Employees — requires employees access */}
        <Route
          path="employees"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard module="employees"><Employees /></RoleGuard>
            </Suspense>
          }
        />

        {/* Software — requires assets access */}
        <Route
          path="software"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard module="assets"><Software /></RoleGuard>
            </Suspense>
          }
        />

        {/* AI Intelligence — available to all */}
        <Route
          path="ai-intelligence"
          element={
            <Suspense fallback={<PageLoader />}>
              <AIIntelligence />
            </Suspense>
          }
        />

        {/* Profile — available to all */}
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

        {/* Organisation Configuration — Departments, Locations, Asset Categories (merged) */}
        <Route
          path="org-settings"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard module="assets"><OrgSettings /></RoleGuard>
            </Suspense>
          }
        />
        {/* Legacy redirects so old bookmarks still work */}
        <Route path="departments"        element={<Navigate to="/org-settings" />} />
        <Route path="locations"          element={<Navigate to="/org-settings" />} />
        <Route path="asset-categories"   element={<Navigate to="/org-settings" />} />
        <Route path="asset-categories/add" element={<Navigate to="/org-settings" />} />

        {/* Settings Routes — admin only */}
        <Route
          path="settings/entities"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard adminOnly><OrganizationEntities /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="settings/users"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard adminOnly><UsersRoles /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="settings/asset-config"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard adminOnly><AssetConfiguration /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="settings/licenses"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard adminOnly><LicensesCompliance /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="settings/assignments"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard adminOnly><AssignmentsOwnership /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="settings/notifications"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard adminOnly><Notifications /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="settings/security"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard adminOnly><SecurityAudit /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="settings/reports"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard module="reports"><Reports /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="settings/system"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard adminOnly><SystemPreferences /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="settings/password"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard adminOnly><PasswordPolicy /></RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="settings/backup"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleGuard adminOnly><BackupRestore /></RoleGuard>
            </Suspense>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
