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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button className="rounded p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={onMenu} aria-label="Buka menu">
          <Menu size={20} />
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-900">WD Group Internal Management System</p>
          <p className="text-xs text-slate-500">{divisionName(user?.divisionId)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.role}</p>
        </div>
        <UserCircle className="text-navy-700" size={28} />
        <button className="rounded p-2 text-slate-600 hover:bg-red-50 hover:text-red-600" onClick={handleLogout} aria-label="Logout">
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
