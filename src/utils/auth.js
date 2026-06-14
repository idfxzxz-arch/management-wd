import { users } from "../data/users";

const KEY = "wd_user";

export function login(email, password) {
  const user = users.find((item) => item.email === email && item.password === password);
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  localStorage.setItem(KEY, JSON.stringify(safeUser));
  return safeUser;
}

export function logout() {
  localStorage.removeItem(KEY);
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
