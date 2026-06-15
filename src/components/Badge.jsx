const styles = {
  Selesai: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Diterima: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Aktif: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Sangat Baik": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Proses: "bg-blue-50 text-blue-700 ring-blue-200",
  Baik: "bg-blue-50 text-blue-700 ring-blue-200",
  Terjadwal: "bg-blue-50 text-blue-700 ring-blue-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Menunggu: "bg-amber-50 text-amber-700 ring-amber-200",
  "Menunggu Konfirmasi": "bg-amber-50 text-amber-700 ring-amber-200",
  "Menunggu Review": "bg-amber-50 text-amber-700 ring-amber-200",
  "Menunggu Approval": "bg-amber-50 text-amber-700 ring-amber-200",
  Draft: "bg-slate-50 text-slate-700 ring-slate-200",
  Review: "bg-amber-50 text-amber-700 ring-amber-200",
  Revisi: "bg-red-50 text-red-700 ring-red-200",
  "Belum Mulai": "bg-slate-50 text-slate-700 ring-slate-200",
  "Belum Dikumpulkan": "bg-slate-50 text-slate-700 ring-slate-200",
  Terlambat: "bg-rose-100 text-rose-900 ring-rose-300",
  "Revisi Dikirim Ulang": "bg-blue-50 text-blue-700 ring-blue-200",
  "Perlu Perhatian": "bg-red-50 text-red-700 ring-red-200",
  "Butuh Monitoring": "bg-red-50 text-red-700 ring-red-200",
  Pendampingan: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Nonaktif: "bg-red-50 text-red-700 ring-red-200",
  Tinggi: "bg-red-50 text-red-700 ring-red-200",
  Sedang: "bg-amber-50 text-amber-700 ring-amber-200",
  Rendah: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Owner: "bg-violet-50 text-violet-700 ring-violet-200",
  "Kepala Divisi": "bg-blue-50 text-blue-700 ring-blue-200",
  Administrator: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Staff: "bg-slate-50 text-slate-700 ring-slate-200",
  Magang: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

export default function Badge({ children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[children] || "bg-slate-50 text-slate-700 ring-slate-200"}`}>
      {children}
    </span>
  );
}
