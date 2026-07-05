import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import { supabase } from "../../lib/supabase";
import { dashboardPath, getCurrentUser, logout, syncCurrentUser } from "../../utils/auth";

export default function SetPassword() {
  const navigate = useNavigate();
  const current = getCurrentUser();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  if (!current) return <Navigate to="/login" replace />;
  if (!current.mustChangePassword) return <Navigate to={dashboardPath(current.role)} replace />;

  function updateField(key, value) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    if (form.password.length < 6) {
      setMessage("Password minimal 6 karakter.");
      return;
    }

    if (form.password !== form.confirm) {
      setMessage("Konfirmasi password belum sama.");
      return;
    }

    setSaving(true);
    const { error: passwordError } = await supabase.auth.updateUser({ password: form.password });
    if (passwordError) {
      setMessage(passwordError.message);
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase.rpc("mark_own_password_changed");
    if (profileError) {
      setMessage(profileError.message);
      setSaving(false);
      return;
    }

    const profile = await syncCurrentUser();
    setSaving(false);
    navigate(dashboardPath(profile.role), { replace: true });
  }

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <AuthLayout>
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
              <Lock size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Buat Password Baru</h1>
              <p className="text-sm text-slate-500">{current.email}</p>
            </div>
          </div>

          {message && <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}

          <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="password">Password Baru</label>
          <input
            id="password"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            autoComplete="new-password"
          />

          <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="confirm">Konfirmasi Password</label>
          <input
            id="confirm"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            type="password"
            value={form.confirm}
            onChange={(event) => updateField("confirm", event.target.value)}
            autoComplete="new-password"
          />

          <button disabled={saving} className="mt-6 w-full rounded-lg bg-navy-800 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
            {saving ? "Menyimpan..." : "Simpan Password"}
          </button>
          <button type="button" onClick={signOut} className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
            Keluar
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
