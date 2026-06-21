import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { dashboardPath, getCurrentUser, logout, syncCurrentUser } from "../utils/auth";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export default function ProtectedRoute({ roles }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [checking, setChecking] = useState(Boolean(user && isSupabaseConfigured));

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setChecking(false);
      return undefined;
    }

    let active = true;
    syncCurrentUser().then((profile) => {
      if (!active) return;
      setUser(profile);
      setChecking(false);
    }).catch(() => {
      if (!active) return;
      logout();
      setUser(null);
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setUser(null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (checking) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Memeriksa session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={dashboardPath(user.role)} replace />;
  return <Outlet />;
}
