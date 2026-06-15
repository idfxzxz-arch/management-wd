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
  MessageSquareText,
  Settings,
  ShieldCheck,
  Users,
  UserCog,
  UserCircle,
  X,
} from "lucide-react";

const menus = [
  { to: "/owner", label: "Dashboard Owner", icon: Gauge, roles: ["Owner", "Administrator"] },
  { to: "/head", label: "Dashboard Divisi", icon: Gauge, roles: ["Kepala Divisi", "Administrator"] },
  { to: "/staff", label: "Dashboard Staff", icon: Gauge, roles: ["Staff"] },
  { to: "/divisions", label: "Divisi", icon: Building2, roles: ["Owner", "Administrator"] },
  { to: "/employees", label: "Karyawan", icon: Users, roles: ["Owner", "Kepala Divisi", "Administrator"] },
  { to: "/division-jobdesk", label: "Jobdesk Divisi", icon: Briefcase, roles: ["Owner", "Kepala Divisi", "Administrator"] },
  { to: "/individual-jobdesk", label: "Jobdesk Individu", icon: CheckSquare, roles: ["Owner", "Kepala Divisi", "Staff", "Administrator"] },
  { to: "/approval", label: "Approval Tugas", icon: ShieldCheck, roles: ["Owner", "Kepala Divisi", "Administrator"] },
  { to: "/reviews", label: "Review Tugas", staffLabel: "Feedback Tugas", icon: MessageSquareText, roles: ["Owner", "Kepala Divisi", "Staff", "Administrator"] },
  { to: "/minutes", label: "Notulen Rapat", icon: ClipboardList, roles: ["Owner", "Kepala Divisi", "Staff", "Administrator"] },
  { to: "/agenda", label: "Agenda Rapat", icon: CalendarDays, roles: ["Owner", "Kepala Divisi", "Staff", "Administrator"] },
  { to: "/reports", label: "Laporan Kerja", icon: FileText, roles: ["Owner", "Kepala Divisi", "Staff", "Administrator"] },
  { to: "/announcements", label: "Pengumuman", icon: Bell, roles: ["Owner", "Kepala Divisi", "Staff", "Administrator"] },
  { to: "/sop", label: "SOP", icon: ClipboardList, roles: ["Owner", "Kepala Divisi", "Staff", "Administrator"] },
  { to: "/documents", label: "Arsip Dokumen", icon: Archive, roles: ["Owner", "Kepala Divisi", "Staff", "Administrator"] },
  { to: "/activity-log", label: "Activity Log", icon: Activity, roles: ["Owner", "Administrator"] },
  { to: "/users", label: "User Management", icon: UserCog, roles: ["Owner", "Administrator"] },
  { to: "/profile", label: "Profile", icon: UserCircle, roles: ["Owner", "Kepala Divisi", "Staff", "Administrator"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["Owner", "Kepala Divisi", "Staff", "Administrator"] },
];

export default function Sidebar({ user, open, onClose }) {
  const available = menus.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden ${open ? "block" : "hidden"}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-1rem))] border-r border-white/10 bg-[linear-gradient(180deg,#081a32_0%,#0b1f3a_55%,#10294a_100%)] text-white shadow-2xl shadow-slate-950/20 transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-black text-navy-900">WD</div>
            <div>
            <p className="text-base font-bold">WD Group</p>
            <p className="text-xs text-blue-100">Internal Management</p>
            </div>
          </div>
          <button className="rounded-lg p-2 text-blue-100 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Tutup menu">
            <X size={18} />
          </button>
        </div>
        <nav className="h-[calc(100vh-4rem)] space-y-1 overflow-y-auto p-3">
          {available.map(({ to, label, staffLabel, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-white text-navy-900 shadow-sm" : "text-blue-100 hover:bg-white/10 hover:text-white"}`
              }
            >
              <Icon size={18} />
              <span>{user?.role === "Staff" && staffLabel ? staffLabel : label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
