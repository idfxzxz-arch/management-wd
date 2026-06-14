export const roleAccess = {
  Owner: ["Owner"],
  Head: ["Owner", "Kepala Divisi"],
  Staff: ["Owner", "Kepala Divisi", "Staff"],
};

export function divisionName(id) {
  if (id === "all") return "Semua Divisi";
  return id || "-";
}

export function employeeName(id) {
  return id || "-";
}

export function scopedByDivision(items, user) {
  if (!user || user.role === "Owner" || user.divisionId === "all") return items;
  return items.filter((item) => item.divisionId === user.divisionId || item.divisionId === "all");
}

export function currencyDate(value) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export function contains(value, query) {
  return String(value).toLowerCase().includes(query.toLowerCase());
}

export function detectPerformance({ averageProgress = 0, completedTasks = 0, targetTasks = 1, lateTasks = 0, revisionTasks = 0 }) {
  const completionRate = Math.round((completedTasks / Math.max(targetTasks, 1)) * 100);
  const score = Math.max(0, Math.round(averageProgress * 0.55 + completionRate * 0.35 - lateTasks * 12 - revisionTasks * 5));

  if (score >= 85) {
    return { label: "Sangat Baik", tone: "green", score, recommendation: "Pertahankan ritme kerja dan jadikan contoh untuk anggota lain." };
  }

  if (score >= 70) {
    return { label: "Baik", tone: "blue", score, recommendation: "Kinerja stabil, tinggal rapikan kendala kecil dan dokumentasi." };
  }

  if (score >= 55) {
    return { label: "Perlu Perhatian", tone: "yellow", score, recommendation: "Perlu follow up target, blocker, dan revisi agar tidak menumpuk." };
  }

  return { label: "Butuh Monitoring", tone: "red", score, recommendation: "Perlu monitoring harian dan prioritas ulang tugas yang terlambat." };
}
