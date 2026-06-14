import { supabase, isSupabaseConfigured } from "../lib/supabase";

const KEY = "wd_user";

export async function login(email, password) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase belum dikonfigurasi. Isi file .env terlebih dahulu.");
  }

  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw authError;

  const { data: user, error } = await supabase
    .from("app_users")
    .select("id,name,email,role,division_id,status")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  if (!user) throw new Error("Akun Auth ditemukan, tetapi profil role belum ada di tabel app_users.");

  const safeUser = { ...user };
  const normalizedUser = {
    id: safeUser.id,
    name: safeUser.name,
    email: safeUser.email,
    role: safeUser.role,
    divisionId: safeUser.division_id,
    status: safeUser.status,
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
    return JSON.parse(raw);
  } catch {
    logout();
    return null;
  }
}

export function dashboardPath(role) {
  if (role === "Owner") return "/owner";
  if (role === "Kepala Divisi") return "/head";
  return "/staff";
}
