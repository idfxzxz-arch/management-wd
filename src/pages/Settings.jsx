import { Bell, Building2, Check, Palette, Shield } from "lucide-react";
import { useState } from "react";
import { Page } from "./Divisions";
import { useAppData } from "../data/AppDataProvider";
import { getCurrentUser } from "../utils/auth";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { APP_THEMES, validTheme } from "../utils/themes";

export default function Settings() {
  const user = getCurrentUser();
  const { settings, loading, error, reload } = useAppData();
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");
  const valueByKey = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const items = [
    { icon: Building2, key: "company_name", title: "Nama Perusahaan", value: valueByKey.company_name || "WD Group Company" },
    { icon: Bell, key: "notifications", title: "Notifikasi", value: valueByKey.notifications || "Email, dashboard alert, dan reminder deadline aktif" },
    { icon: Shield, key: "roles", title: "Pengaturan Role", value: valueByKey.roles || "Owner, Kepala Divisi, Staff, Magang, Wakil Owner, Developer" },
  ];
  const selectedTheme = validTheme(valueByKey.theme);

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
      setMessage(isPolicyError ? "Hanya Owner atau Developer yang dapat mengubah Settings." : upsertError.message);
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
      <ThemePicker
        selected={selectedTheme}
        saving={savingKey === "theme"}
        onSelect={(theme) => {
          document.documentElement.dataset.theme = theme;
          saveSetting("theme", theme);
        }}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(({ icon: Icon, key, title, value }) => (
          <SettingCard key={key} icon={Icon} title={title} settingKey={key} value={value} savingKey={savingKey} onSave={saveSetting} />
        ))}
      </div>
    </Page>
  );
}

function ThemePicker({ selected, saving, onSelect }) {
  return (
    <section className="surface-panel p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-navy-50 p-3 text-navy-700"><Palette size={22} /></div>
        <div>
          <h2 className="font-semibold text-slate-900">Tema Warna Aplikasi</h2>
          <p className="mt-1 text-sm text-slate-500">Pilih warna utama untuk seluruh tampilan WD Management.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {APP_THEMES.map((theme) => {
          const active = selected === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              disabled={saving}
              onClick={() => onSelect(theme.id)}
              className={`relative rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 ${active ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200"}`}
            >
              <span className="block h-12 rounded-lg" style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.soft})` }} />
              <span className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-800">
                {theme.label}
                {active && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white"><Check size={12} /></span>}
              </span>
            </button>
          );
        })}
      </div>
      {saving && <p className="mt-3 text-sm text-slate-500">Menyimpan tema...</p>}
    </section>
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
