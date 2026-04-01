import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated, isAdmin } from "./auth/auth";
import LoginPage       from "./pages/LoginPage";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import OverviewPage    from "./pages/dashboard/OverviewPage";
import AttendancePage  from "./pages/dashboard/AttendancePage";
import DTRPage         from "./pages/dashboard/DTRPage";
import EmployeesPage   from "./pages/dashboard/EmployeesPage";
import SettingsPage    from "./pages/dashboard/SettingsPage";
import MyAttendancePage from "./pages/dashboard/MyAttendancePage";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() && isAdmin() ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard"     element={<OverviewPage />} />
          <Route path="/my-attendance" element={<MyAttendancePage />} />
          <Route path="/dtr"           element={<DTRPage />} />

          {/* Admin only */}
          <Route path="/attendance" element={<AdminRoute><AttendancePage /></AdminRoute>} />
          <Route path="/employees"  element={<AdminRoute><EmployeesPage /></AdminRoute>} />
          <Route path="/settings"   element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}