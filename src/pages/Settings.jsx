import { Bell, Building2, Palette, Shield } from "lucide-react";
import { Page } from "./Divisions";

export default function Settings() {
  const items = [
    { icon: Building2, title: "Nama Perusahaan", value: "WD Group Company" },
    { icon: Palette, title: "Tema Aplikasi", value: "Biru tua, putih, abu-abu muda" },
    { icon: Bell, title: "Notifikasi Dummy", value: "Email, dashboard alert, dan reminder deadline aktif" },
    { icon: Shield, title: "Pengaturan Role Dummy", value: "Owner, Kepala Divisi, Staff" },
  ];

  return (
    <Page title="Settings" subtitle="Pengaturan dummy untuk kebutuhan presentasi prototype.">
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(({ icon: Icon, title, value }) => (
          <section key={title} className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded bg-navy-50 p-3 text-navy-700"><Icon size={22} /></div>
              <div>
                <h2 className="font-semibold text-slate-900">{title}</h2>
                <p className="mt-2 text-sm text-slate-600">{value}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </Page>
  );
}
