import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { dashboardPath, getCurrentUser, login } from "../utils/auth";
import AuthLayout from "../layouts/AuthLayout";

export default function Login() {
  const navigate = useNavigate();
  const current = getCurrentUser();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (current) return <Navigate to={dashboardPath(current.role)} replace />;

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(form.email, form.password);
      if (!user) {
        setError("Email atau password tidak sesuai.");
        return;
      }
      navigate(user.mustChangePassword ? "/set-password" : dashboardPath(user.role), { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="login-hero flex min-h-[42vh] items-center p-6 text-white sm:p-8 lg:min-h-screen lg:p-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-slate-950/20 ring-1 ring-white/20 sm:h-20 sm:w-20">
                <img className="h-full w-full object-cover" src="/wd-group-logo.jpeg" alt="Logo WD Group" />
              </div>
              <div>
                <p className="text-lg font-bold">WD Group Company</p>
                <p className="text-sm text-blue-100">Internal Management</p>
              </div>
            </div>
            <div className="mt-6 inline-flex rounded-lg bg-white/10 px-3 py-1 text-sm font-semibold text-blue-100 ring-1 ring-white/10">Prototype Internal Company</div>
            <h1 className="mt-7 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">WD Group Internal Management System</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
              Sistem untuk mengelola divisi, staf, jobdesk, approval, notulen, laporan, SOP, dokumen, dan aktivitas internal berdasarkan role user.
            </p>
          </div>
        </section>
        <section className="app-bg flex items-center justify-center p-4 sm:p-6">
          <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white/92 p-5 shadow-soft backdrop-blur sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-white">
                <img className="h-full w-full object-cover" src="/wd-group-logo.jpeg" alt="Logo WD Group" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">WD Group Company</p>
                <p className="text-xs text-slate-500">Internal Management</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Login</h2>
            <p className="mt-2 text-sm text-slate-500">Masuk menggunakan email pribadi yang sudah dibuat di Supabase Authentication.</p>
            {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <label className="mt-6 block text-sm font-semibold text-slate-700">Email</label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-navy-700 focus-within:ring-2 focus-within:ring-blue-100">
              <Mail size={18} className="text-slate-400" />
              <input className="w-full outline-none" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <label className="mt-4 block text-sm font-semibold text-slate-700">Password</label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 focus-within:border-navy-700 focus-within:ring-2 focus-within:ring-blue-100">
              <Lock size={18} className="text-slate-400" />
              <input type="password" className="w-full outline-none" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </div>
            <button disabled={loading} className="mt-6 w-full rounded-lg bg-navy-800 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? "Memeriksa akun..." : "Masuk Dashboard"}
            </button>
          </form>
        </section>
      </div>
    </AuthLayout>
  );
}
