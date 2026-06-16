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
    <div className="app-bg flex min-h-screen overflow-x-hidden">
      <Sidebar user={user} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={user} onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
