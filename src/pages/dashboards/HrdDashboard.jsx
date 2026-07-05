import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  FileText,
  Megaphone,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../../components/Badge";
import DataTable from "../../components/DataTable";
import StatCard from "../../components/StatCard";
import { useAppData } from "../../data/AppDataProvider";
import { getCurrentUser } from "../../utils/auth";

export default function HrdDashboard() {
  const user = getCurrentUser();
  const { divisions, employees, weeklyReports, users, divisionName, loading, error } = useAppData();
  const activeEmployees = employees.filter((employee) => employee.status === "Aktif");
  const staff = employees.filter((employee) => employee.role === "Staff");
  const interns = employees.filter((employee) => employee.role === "Magang");
  const heads = employees.filter((employee) => employee.role === "Kepala Divisi");
  const inactiveUsers = users.filter((item) => item.status !== "Aktif");
  const recentReports = [...weeklyReports]
    .sort((a, b) => String(b.week || "").localeCompare(String(a.week || "")))
    .slice(0, 6);
  const divisionRows = divisions.map((division) => ({
    ...division,
    activeMembers: activeEmployees.filter((employee) => employee.divisionId === division.id).length,
    staffCount: staff.filter((employee) => employee.divisionId === division.id).length,
    internCount: interns.filter((employee) => employee.divisionId === division.id).length,
  }));
  const activeRate = employees.length ? Math.round((activeEmployees.length / employees.length) * 100) : 0;
  const internRate = activeEmployees.length ? Math.round((interns.length / activeEmployees.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-navy-700">
                <Users size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-700">Dashboard HRD</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">Halo, {user?.name || "HRD"}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
              Pantau data staf, magang, struktur divisi, laporan kerja, dan akses akun lintas divisi dari satu ruang kerja.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ActionLink icon={Users} label="Data Staf" to="/employees" primary />
              <ActionLink icon={Megaphone} label="Pengumuman" to="/announcements" />
              <ActionLink icon={FileText} label="Dokumen HR" to="/documents" />
            </div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/80 p-5 lg:border-l lg:border-t-0 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Ringkasan Karyawan</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Aktif" value={`${activeRate}%`} />
              <Metric label="Magang" value={`${internRate}%`} />
            </div>
            <div className="mt-5 space-y-3">
              <Progress label="Karyawan aktif" value={activeRate} />
              <Progress label="Komposisi magang" value={internRate} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Staf Aktif" value={activeEmployees.length} icon={UserCheck} tone="green" />
        <StatCard title="Staff" value={staff.length} icon={Users} tone="blue" />
        <StatCard title="Magang" value={interns.length} icon={BriefcaseBusiness} tone="purple" />
        <StatCard title="Kepala Divisi" value={heads.length} icon={Building2} tone="yellow" />
        <StatCard title="Akun Nonaktif" value={inactiveUsers.length} icon={UserX} tone="red" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <section className="space-y-3 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title font-semibold text-slate-900">Struktur Per Divisi</h2>
              <p className="mt-1 text-sm text-slate-500">Distribusi staf aktif, staff, dan magang di setiap divisi.</p>
            </div>
            <Link className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:underline" to="/divisions">
              Lihat divisi
              <ChevronRight size={16} />
            </Link>
          </div>
          <DataTable
            rows={divisionRows}
            columns={[
              { key: "name", header: "Divisi" },
              { key: "head", header: "Kepala Divisi" },
              { key: "activeMembers", header: "Aktif" },
              { key: "staffCount", header: "Staff" },
              { key: "internCount", header: "Magang" },
            ]}
          />
        </section>

        <section className="space-y-3 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title font-semibold text-slate-900">Laporan Terbaru</h2>
              <p className="mt-1 text-sm text-slate-500">Aktivitas laporan mingguan terbaru dari tim.</p>
            </div>
            <Link className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:underline" to="/reports">
              Buka laporan
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
            {recentReports.length ? recentReports.map((report) => (
              <Link key={report.id} to="/reports" className="block border-b border-slate-100 p-4 transition last:border-b-0 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{report.staff}</p>
                    <p className="mt-1 text-xs text-slate-500">{report.week} - {divisionName(report.divisionId)}</p>
                  </div>
                  <Badge>{report.status}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{report.summary || report.nextPlan || "-"}</p>
              </Link>
            )) : (
              <EmptyState icon={FileText} title="Belum ada laporan" text="Laporan mingguan terbaru akan tampil di sini." />
            )}
          </div>
        </section>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <QuickLink icon={Users} label="User Management" detail="Kelola akses dan status akun" to="/users" />
        <QuickLink icon={FileText} label="Dokumen HR" detail="Arsip dokumen perusahaan" to="/documents" />
        <QuickLink icon={Bell} label="Pengumuman" detail="Kirim informasi ke tim" to="/announcements" />
      </section>
    </div>
  );
}

function ActionLink({ icon: Icon, label, to, primary = false }) {
  return (
    <Link
      to={to}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
        primary
          ? "bg-navy-800 text-white shadow-sm hover:bg-navy-900"
          : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/70 hover:text-navy-700"
      }`}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function Progress({ label, value }) {
  const width = `${Math.min(Math.max(value, 0), 100)}%`;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="font-bold text-slate-900">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-navy-700" style={{ width }} />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon size={18} />
      </div>
      <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function QuickLink({ icon: Icon, label, detail, to }) {
  return (
    <Link to={to} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition hover:border-blue-200 hover:bg-blue-50/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-700 transition group-hover:bg-white">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
          </div>
        </div>
        <ChevronRight className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-navy-700" size={17} />
      </div>
    </Link>
  );
}
