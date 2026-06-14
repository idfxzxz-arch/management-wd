import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCurrentUser } from "../utils/auth";

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const user = getCurrentUser();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar user={user} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={user} onMenu={() => setOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
