import { Bell, Building2, Palette, Shield } from "lucide-react";
import { useState } from "react";
import { Page } from "./Divisions";
import { useAppData } from "../data/AppDataProvider";
import { getCurrentUser } from "../utils/auth";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function Settings() {
  const user = getCurrentUser();
  const { settings, loading, error, reload } = useAppData();
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");
  const valueByKey = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const items = [
    { icon: Building2, key: "company_name", title: "Nama Perusahaan", value: valueByKey.company_name || "WD Group Company" },
    { icon: Palette, key: "theme", title: "Tema Aplikasi", value: valueByKey.theme || "Biru tua, putih, abu-abu muda" },
    { icon: Bell, key: "notifications", title: "Notifikasi", value: valueByKey.notifications || "Email, dashboard alert, dan reminder deadline aktif" },
    { icon: Shield, key: "roles", title: "Pengaturan Role", value: valueByKey.roles || "Owner, Kepala Divisi, Staff, Administrator" },
  ];

  async function saveSetting(key, value) {
    setMessage("");

    if (!isSupabaseConfigured) {
      setMessage("Koneksi data belum dikonfigurasi.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Session login belum aktif. Silakan logout lalu login ulang.");
      return;
    }

    setSavingKey(key);
    const { error: upsertError } = await supabase
      .from("app_settings")
      .upsert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() }, { onConflict: "setting_key" });

    if (upsertError) {
      const isPolicyError = upsertError.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Akses simpan settings belum aktif. Jalankan SQL write policy lalu login ulang." : upsertError.message);
      setSavingKey("");
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "User",
      division_id: "all",
      action: `mengubah setting "${key}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: "info",
    });

    setSavingKey("");
    setMessage("Settings berhasil disimpan.");
    reload();
  }

  return (
    <Page title="Settings" subtitle="Pengaturan dasar aplikasi internal WD Group.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(({ icon: Icon, key, title, value }) => (
          <SettingCard key={key} icon={Icon} title={title} settingKey={key} value={value} savingKey={savingKey} onSave={saveSetting} />
        ))}
      </div>
    </Page>
  );
}

function SettingCard({ icon: Icon, title, settingKey, value, savingKey, onSave }) {
  const [draft, setDraft] = useState(value);

  return (
    <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded bg-navy-50 p-3 text-navy-700"><Icon size={22} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <textarea className="mt-3 min-h-[88px] w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-700" value={draft} onChange={(event) => setDraft(event.target.value)} />
          <button disabled={savingKey === settingKey} onClick={() => onSave(settingKey, draft)} className="mt-3 rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
            {savingKey === settingKey ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </section>
  );
}
