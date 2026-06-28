import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/Login";
import SetPassword from "../pages/SetPassword";
import OwnerDashboard from "../pages/OwnerDashboard";
import HeadDashboard from "../pages/HeadDashboard";
import StaffDashboard from "../pages/StaffDashboard";
import Divisions from "../pages/Divisions";
import Employees from "../pages/Employees";
import Interns from "../pages/Interns";
import DivisionJobdesk from "../pages/DivisionJobdesk";
import IndividualJobdesk from "../pages/IndividualJobdesk";
import JobdeskDetail from "../pages/JobdeskDetail";
import ReviewTasks from "../pages/ReviewTasks";
import MeetingAgenda from "../pages/MeetingAgenda";
import Minutes from "../pages/Minutes";
import MinuteDetail from "../pages/MinuteDetail";
import WorkReports from "../pages/WorkReports";
import Announcements from "../pages/Announcements";
import SOP from "../pages/SOP";
import Documents from "../pages/Documents";
import ActivityLog from "../pages/ActivityLog";
import UserManagement from "../pages/UserManagement";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute roles={["Owner", "Kepala Divisi", "Staff", "Magang", "Wakil Owner"]} allowPasswordChange />}>
        <Route path="/set-password" element={<SetPassword />} />
      </Route>
      <Route element={<ProtectedRoute roles={["Owner", "Kepala Divisi", "Staff", "Magang", "Wakil Owner"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route element={<ProtectedRoute roles={["Owner", "Wakil Owner", "Kepala Divisi", "Staff", "Magang"]} />}>
            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/admin" element={<OwnerDashboard />} />
            <Route path="/divisions" element={<Divisions />} />
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>
          <Route element={<ProtectedRoute roles={["Owner"]} />}>
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route element={<ProtectedRoute roles={["Kepala Divisi"]} />}>
            <Route path="/head" element={<HeadDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={["Staff", "Magang"]} />}>
            <Route path="/staff" element={<StaffDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={["Owner", "Kepala Divisi", "Staff", "Magang", "Wakil Owner"]} />}>
            <Route path="/employees" element={<Employees />} />
            <Route path="/interns" element={<Interns />} />
            <Route path="/division-jobdesk" element={<DivisionJobdesk />} />
            <Route path="/approval" element={<Navigate to="/reviews" replace />} />
          </Route>
          <Route element={<ProtectedRoute roles={["Owner", "Kepala Divisi", "Staff", "Magang", "Wakil Owner"]} />}>
            <Route path="/reviews" element={<ReviewTasks />} />
          </Route>
          <Route path="/individual-jobdesk" element={<IndividualJobdesk />} />
          <Route path="/jobdesk/:id" element={<JobdeskDetail />} />
          <Route path="/minutes" element={<Minutes />} />
          <Route path="/minutes/:id" element={<MinuteDetail />} />
          <Route path="/agenda" element={<MeetingAgenda />} />
          <Route path="/reports" element={<WorkReports />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/sop" element={<SOP />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
