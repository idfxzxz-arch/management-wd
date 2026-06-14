import { NavLink } from "react-router-dom";
import {
  Activity,
  Archive,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileText,
  Gauge,
  Settings,
  ShieldCheck,
  Users,
  UserCog,
  UserCircle,
  X,
} from "lucide-react";

const menus = [
  { to: "/owner", label: "Dashboard Owner", icon: Gauge, roles: ["Owner"] },
  { to: "/head", label: "Dashboard Divisi", icon: Gauge, roles: ["Kepala Divisi"] },
  { to: "/staff", label: "Dashboard Staff", icon: Gauge, roles: ["Staff"] },
  { to: "/divisions", label: "Divisi", icon: Building2, roles: ["Owner"] },
  { to: "/employees", label: "Karyawan", icon: Users, roles: ["Owner", "Kepala Divisi"] },
  { to: "/division-jobdesk", label: "Jobdesk Divisi", icon: Briefcase, roles: ["Owner", "Kepala Divisi"] },
  { to: "/individual-jobdesk", label: "Jobdesk Individu", icon: CheckSquare, roles: ["Owner", "Kepala Divisi", "Staff"] },
  { to: "/approval", label: "Approval Tugas", icon: ShieldCheck, roles: ["Owner", "Kepala Divisi"] },
  { to: "/minutes", label: "Notulen Rapat", icon: ClipboardList, roles: ["Owner", "Kepala Divisi", "Staff"] },
  { to: "/agenda", label: "Agenda Rapat", icon: CalendarDays, roles: ["Owner", "Kepala Divisi", "Staff"] },
  { to: "/reports", label: "Laporan Kerja", icon: FileText, roles: ["Owner", "Kepala Divisi", "Staff"] },
  { to: "/announcements", label: "Pengumuman", icon: Bell, roles: ["Owner", "Kepala Divisi", "Staff"] },
  { to: "/sop", label: "SOP", icon: ClipboardList, roles: ["Owner", "Kepala Divisi", "Staff"] },
  { to: "/documents", label: "Arsip Dokumen", icon: Archive, roles: ["Owner", "Kepala Divisi", "Staff"] },
  { to: "/activity-log", label: "Activity Log", icon: Activity, roles: ["Owner"] },
  { to: "/users", label: "User Management", icon: UserCog, roles: ["Owner"] },
  { to: "/profile", label: "Profile", icon: UserCircle, roles: ["Owner", "Kepala Divisi", "Staff"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["Owner", "Kepala Divisi", "Staff"] },
];

export default function Sidebar({ user, open, onClose }) {
  const available = menus.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-slate-950/40 lg:hidden ${open ? "block" : "hidden"}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-navy-700 bg-navy-900 text-white transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div>
            <p className="text-base font-bold">WD Group</p>
            <p className="text-xs text-blue-100">Internal Management</p>
          </div>
          <button className="rounded p-2 text-blue-100 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Tutup menu">
            <X size={18} />
          </button>
        </div>
        <nav className="h-[calc(100vh-4rem)] space-y-1 overflow-y-auto p-3">
          {available.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-white text-navy-900" : "text-blue-100 hover:bg-white/10 hover:text-white"}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
