import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { dashboardPath, getCurrentUser, login } from "../utils/auth";
import AuthLayout from "../layouts/AuthLayout";

const demos = [
  ["Owner", "owner@wdgroup.com"],
  ["Kepala Divisi", "head@wdgroup.com"],
  ["Staff Umum", "staff@wdgroup.com"],
];

export default function Login() {
  const navigate = useNavigate();
  const current = getCurrentUser();
  const [form, setForm] = useState({ email: "owner@wdgroup.com", password: "123456" });
  const [error, setError] = useState("");

  if (current) return <Navigate to={dashboardPath(current.role)} replace />;

  function submit(event) {
    event.preventDefault();
    const user = login(form.email, form.password);
    if (!user) {
      setError("Email atau password dummy tidak sesuai.");
      return;
    }
    navigate(dashboardPath(user.role), { replace: true });
  }

  return (
    <AuthLayout>
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between bg-navy-900 p-8 text-white lg:p-12">
          <div>
            <div className="inline-flex rounded bg-white/10 px-3 py-1 text-sm font-semibold text-blue-100">Prototype Internal Company</div>
            <h1 className="mt-8 max-w-2xl text-4xl font-bold leading-tight lg:text-5xl">WD Group Internal Management System</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-blue-100">
              Sistem dummy untuk mengelola divisi, karyawan, jobdesk, approval, notulen, laporan, SOP, dokumen, dan aktivitas internal berdasarkan role user.
            </p>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            {demos.map(([role, email]) => (
              <button
                key={email}
                type="button"
                onClick={() => setForm({ email, password: "123456" })}
                className="rounded border border-white/15 bg-white/10 p-4 text-left hover:bg-white/15"
              >
                <p className="text-sm font-semibold">{role}</p>
                <p className="mt-1 break-all text-xs text-blue-100">{email}</p>
                <p className="mt-2 text-xs text-blue-200">Password: 123456</p>
              </button>
            ))}
          </div>
        </section>
        <section className="flex items-center justify-center p-6">
          <form onSubmit={submit} className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-slate-900">Login</h2>
            <p className="mt-2 text-sm text-slate-500">Masuk menggunakan akun demo yang tersedia.</p>
            {error && <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <label className="mt-6 block text-sm font-semibold text-slate-700">Email</label>
            <div className="mt-2 flex items-center gap-2 rounded border border-slate-200 px-3 py-2 focus-within:border-navy-700">
              <Mail size={18} className="text-slate-400" />
              <input className="w-full outline-none" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <label className="mt-4 block text-sm font-semibold text-slate-700">Password</label>
            <div className="mt-2 flex items-center gap-2 rounded border border-slate-200 px-3 py-2 focus-within:border-navy-700">
              <Lock size={18} className="text-slate-400" />
              <input type="password" className="w-full outline-none" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </div>
            <button className="mt-6 w-full rounded bg-navy-800 px-4 py-3 font-semibold text-white hover:bg-navy-900">Masuk Dashboard</button>
          </form>
        </section>
      </div>
    </AuthLayout>
  );
}
