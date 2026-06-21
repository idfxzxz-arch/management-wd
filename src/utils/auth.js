import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { displayPersonName } from "./company";

const KEY = "wd_user";

export async function login(email, password) {
  if (!isSupabaseConfigured) {
    throw new Error("Koneksi data belum dikonfigurasi. Isi file .env terlebih dahulu.");
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw authError;

  if (!authData.user?.email) throw new Error("Email akun tidak ditemukan pada session login.");
  return syncCurrentUser();
}

export async function syncCurrentUser() {
  if (!isSupabaseConfigured) throw new Error("Koneksi data belum dikonfigurasi.");
  const { data: sessionData } = await supabase.auth.getSession();
  const authenticatedEmail = sessionData.session?.user?.email;
  if (!authenticatedEmail) throw new Error("Session login tidak aktif.");

  const { data: user, error } = await supabase
    .from("app_users")
    .select("*")
    .eq("email", authenticatedEmail)
    .maybeSingle();
  if (error) throw error;
  if (!user) throw new Error("Profil role akun tidak ditemukan.");
  if (user.status !== "Aktif") {
    await supabase.auth.signOut();
    localStorage.removeItem(KEY);
    throw new Error("Akun Anda sedang nonaktif. Hubungi Owner atau Administrator.");
  }

  let employeeId = user.employee_id;
  if (!employeeId && user.role === "Staff") {
    const { data: employee } = await supabase.from("employees").select("id").eq("email", user.email).maybeSingle();
    employeeId = employee?.id || null;
  }
  const normalizedUser = {
    id: user.id,
    name: displayPersonName(user.name, user.role),
    email: user.email,
    role: user.role,
    divisionId: user.division_id,
    employeeId,
    status: user.status,
  };
  localStorage.setItem(KEY, JSON.stringify(normalizedUser));
  return normalizedUser;
}

export function logout() {
  localStorage.removeItem(KEY);
  if (isSupabaseConfigured) {
    supabase.auth.signOut();
  }
}

export function getCurrentUser() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    return { ...user, name: displayPersonName(user.name, user.role) };
  } catch {
    logout();
    return null;
  }
}

export function dashboardPath(role) {
  if (role === "Owner") return "/owner";
  if (role === "Kepala Divisi") return "/head";
  if (role === "Administrator") return "/admin";
  return "/staff";
}
