import { Navigate, Outlet } from "react-router-dom";
import { dashboardPath, getCurrentUser } from "../utils/auth";

export default function ProtectedRoute({ roles }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={dashboardPath(user.role)} replace />;
  return <Outlet />;
}
