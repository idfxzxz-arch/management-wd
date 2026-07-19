import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/auth/Login";
import SetPassword from "../pages/auth/SetPassword";
import OwnerDashboard from "../pages/dashboards/OwnerDashboard";
import HeadDashboard from "../pages/dashboards/HeadDashboard";
import HrdDashboard from "../pages/dashboards/HrdDashboard";
import StaffDashboard from "../pages/dashboards/StaffDashboard";
import Divisions from "../pages/organization/Divisions";
import Employees from "../pages/organization/Employees";
import Interns from "../pages/organization/Interns";
import DivisionJobdesk from "../pages/tasks/DivisionJobdesk";
import IndividualJobdesk from "../pages/tasks/IndividualJobdesk";
import JobdeskDetail from "../pages/tasks/JobdeskDetail";
import ReviewTasks from "../pages/tasks/ReviewTasks";
import MeetingAgenda from "../pages/meetings/MeetingAgenda";
import Minutes from "../pages/meetings/Minutes";
import MinuteDetail from "../pages/meetings/MinuteDetail";
import WorkReports from "../pages/reports/WorkReports";
import Announcements from "../pages/content/Announcements";
import SOP from "../pages/content/SOP";
import Documents from "../pages/content/Documents";
import ActivityLog from "../pages/reports/ActivityLog";
import UserManagement from "../pages/organization/UserManagement";
import Profile from "../pages/account/Profile";
import Settings from "../pages/account/Settings";

const allRoles = ["Owner", "Kepala Divisi", "Staff", "Magang", "Wakil Owner", "Developer", "HRD"];
const managementAndAllRoles = ["Owner", "Wakil Owner", "Developer", "Kepala Divisi", "Staff", "Magang", "HRD"];
const taskManagerRoles = ["Owner", "Kepala Divisi", "Staff", "Magang", "Wakil Owner", "Developer"];
const taskAssigneeRoles = [...taskManagerRoles, "HRD"];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute roles={allRoles} allowPasswordChange />}>
        <Route path="/set-password" element={<SetPassword />} />
      </Route>
      <Route element={<ProtectedRoute roles={allRoles} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route element={<ProtectedRoute roles={managementAndAllRoles} />}>
            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/admin" element={<OwnerDashboard />} />
            <Route path="/developer" element={<OwnerDashboard />} />
            <Route path="/hrd" element={<HrdDashboard />} />
            <Route path="/divisions" element={<Divisions />} />
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>
          <Route element={<ProtectedRoute roles={["Owner", "Developer"]} />}>
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route element={<ProtectedRoute roles={["Kepala Divisi"]} />}>
            <Route path="/head" element={<HeadDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={["Staff", "Magang"]} />}>
            <Route path="/staff" element={<StaffDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={allRoles} />}>
            <Route path="/employees" element={<Employees />} />
            <Route path="/interns" element={<Interns />} />
            <Route path="/reports" element={<WorkReports />} />
          </Route>
          <Route element={<ProtectedRoute roles={taskManagerRoles} />}>
            <Route path="/division-jobdesk" element={<DivisionJobdesk />} />
            <Route path="/approval" element={<Navigate to="/reviews" replace />} />
          </Route>
          <Route element={<ProtectedRoute roles={taskManagerRoles} />}>
            <Route path="/reviews" element={<ReviewTasks />} />
          </Route>
          <Route element={<ProtectedRoute roles={taskAssigneeRoles} />}>
            <Route path="/individual-jobdesk" element={<IndividualJobdesk />} />
            <Route path="/jobdesk/:id" element={<JobdeskDetail />} />
          </Route>
          <Route element={<ProtectedRoute roles={taskManagerRoles} />}>
            <Route path="/minutes" element={<Minutes />} />
            <Route path="/minutes/:id" element={<MinuteDetail />} />
            <Route path="/agenda" element={<MeetingAgenda />} />
            <Route path="/sop" element={<SOP />} />
          </Route>
          <Route element={<ProtectedRoute roles={allRoles} />}>
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/documents" element={<Documents />} />
          </Route>
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
