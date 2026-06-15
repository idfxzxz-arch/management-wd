import { LogOut, Menu, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";
import { divisionName } from "../utils/helpers";

export default function Navbar({ user, onMenu }) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/82 px-3 shadow-sm shadow-slate-200/50 backdrop-blur-xl sm:px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={onMenu} aria-label="Buka menu">
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="max-w-[180px] truncate text-sm font-semibold text-slate-900 sm:max-w-none">WD Group Internal Management System</p>
          <p className="text-xs text-slate-500">{divisionName(user?.divisionId)}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.role}</p>
        </div>
        <UserCircle className="text-navy-700" size={28} />
        <button className="rounded-lg p-2 text-slate-600 hover:bg-red-50 hover:text-red-600" onClick={handleLogout} aria-label="Logout">
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
