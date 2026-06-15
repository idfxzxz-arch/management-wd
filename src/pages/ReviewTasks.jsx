import { useMemo, useState } from "react";
import { ExternalLink, Eye, RotateCcw, ShieldCheck } from "lucide-react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { Page, Search } from "./Divisions";
import { getCurrentUser } from "../utils/auth";
import { contains } from "../utils/helpers";
import { useAppData } from "../data/AppDataProvider";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { REVIEW_STATUSES, buildSubmissionRows, submissionStats } from "../utils/submissions";

export default function ReviewTasks() {
  const user = getCurrentUser();
  const { tasks, taskSubmissions, employees, divisions, divisionName, employeeName, scopedByDivision, loading, error, reload } = useAppData();
  const [query, setQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState(user?.role === "Kepala Divisi" && user.divisionId !== "all" ? user.divisionId : "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewerFilter, setReviewerFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const employeeRole = (id) => employees.find((employee) => String(employee.id) === String(id))?.role || "Staff";
  const allRows = buildSubmissionRows(scopedByDivision(tasks, user), taskSubmissions, { employeeName, employeeRole });
  const canReview = (row) => {
    if (user?.role === "Owner" || user?.role === "Administrator") return true;
    if (user?.role === "Kepala Divisi") return user.divisionId === "all" || row.divisionId === user.divisionId;
    return false;
  };
  const rows = useMemo(() => {
    return allRows.filter((row) => {
      const matchQuery = contains(`${row.taskTitle} ${row.staffName}`, query);
      const matchDivision = divisionFilter === "all" || row.divisionId === divisionFilter;
      const matchStatus = statusFilter === "all" || row.status === statusFilter;
      const matchReviewer = reviewerFilter === "all" || row.reviewerName === reviewerFilter;
      const matchDeadline = deadlineFilter === "all" || row.deadline === deadlineFilter;
      return matchQuery && matchDivision && matchStatus && matchReviewer && matchDeadline;
    });
  }, [allRows, query, divisionFilter, statusFilter, reviewerFilter, deadlineFilter]);
  const stats = submissionStats(allRows);
  const pageTitle = user?.role === "Staff" ? "Feedback Tugas" : "Review Tugas";
  const reviewers = [...new Set(allRows.map((row) => row.reviewerName).filter(Boolean))];
  const deadlines = [...new Set(allRows.map((row) => row.deadline).filter(Boolean))].sort();

  async function updateReview(row, status) {
    setMessage("");
    if (!canReview(row)) {
      setMessage("Anda tidak memiliki akses review untuk tugas ini.");
      return;
    }
    if (status === "Revisi" && !feedback.trim()) {
      setMessage("Catatan feedback wajib diisi untuk revisi.");
      return;
    }
    if (!isSupabaseConfigured) {
      setMessage("Koneksi data belum dikonfigurasi.");
      return;
    }

    setSaving(true);
    const reviewedAt = new Date().toISOString();
    const revisionHistory = status === "Revisi"
      ? [
          ...(row.revisionHistory || []),
          {
            link: row.driveLink,
            note: row.submissionNote,
            feedback: feedback.trim(),
            reviewer: user?.name || "Reviewer",
            reviewedAt,
          },
        ]
      : row.revisionHistory || [];

    const payload = {
      status,
      head_feedback: feedback.trim() || row.headFeedback || "",
      reviewed_by: user?.name || "Reviewer",
      reviewer_role: user?.role || "Reviewer",
      reviewed_at: reviewedAt,
      revision_count: status === "Revisi" ? (row.revisionCount || 0) + 1 : row.revisionCount || 0,
      revision_history: revisionHistory,
    };

    const { error: submissionError } = await supabase.from("task_submissions").update(payload).eq("id", row.id);
    if (submissionError) {
      setMessage(submissionError.message);
      setSaving(false);
      return;
    }

    const history = [
      ...(row.task?.history || []),
      `${user?.name || "Reviewer"} ${status === "Diterima" ? "approve" : "meminta revisi"} pengumpulan tugas${feedback.trim() ? ` - ${feedback.trim()}` : ""}`,
    ];
    const { error: taskError } = await supabase
      .from("tasks")
      .update({
        approval: status === "Diterima" ? "Approved" : "Revisi",
        status: status === "Diterima" ? "Selesai" : "Revisi",
        note: status === "Revisi" ? feedback.trim() : row.task?.note,
        approved_at: reviewedAt,
        approved_by: user?.name || "Reviewer",
        history,
      })
      .eq("id", row.taskId);

    if (taskError) {
      setMessage(taskError.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "Reviewer",
      division_id: row.divisionId,
      action: `${status === "Diterima" ? "approve" : "meminta revisi"} pengumpulan "${row.taskTitle}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: status === "Diterima" ? "success" : "warning",
    });

    setSaving(false);
    setFeedback("");
    setMessage(status === "Diterima" ? "Tugas berhasil diapprove." : "Status revisi berhasil dikirim.");
    reload();
  }

  return (
    <Page title={pageTitle} subtitle="Review link Google Drive, status pengumpulan, feedback, dan riwayat revisi tugas.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      {message && <div className={`rounded-lg border p-4 text-sm ${message.includes("berhasil") || message.includes("approve") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Menunggu Review" value={stats.waitingReview} />
        <Metric label="Approved" value={stats.approved} />
        <Metric label="Revisi" value={stats.revision} />
        <Metric label="Terlambat" value={stats.late} />
        <Metric label="Revisi Dikirim Ulang" value={stats.resentRevision} />
        <Metric label="Selesai Bulan Ini" value={stats.doneThisMonth} />
      </div>

      <div className="surface-panel grid gap-3 p-3 sm:p-4 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <Search value={query} setValue={setQuery} placeholder="Cari nama staf atau judul tugas" />
        <FilterSelect value={divisionFilter} onChange={setDivisionFilter} disabled={user?.role === "Kepala Divisi" && user.divisionId !== "all"}>
          <option value="all">Semua divisi</option>
          {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
        </FilterSelect>
        <FilterSelect value={statusFilter} onChange={setStatusFilter}>
          <option value="all">Semua status</option>
          {REVIEW_STATUSES.map((status) => <option key={status}>{status}</option>)}
        </FilterSelect>
        <FilterSelect value={reviewerFilter} onChange={setReviewerFilter}>
          <option value="all">Semua reviewer</option>
          {reviewers.map((reviewer) => <option key={reviewer}>{reviewer}</option>)}
        </FilterSelect>
        <FilterSelect value={deadlineFilter} onChange={setDeadlineFilter}>
          <option value="all">Semua deadline</option>
          {deadlines.map((deadline) => <option key={deadline}>{deadline}</option>)}
        </FilterSelect>
      </div>

      <DataTable
        rows={rows}
        columns={[
          { key: "taskTitle", header: "Tugas", width: "230px", render: (row) => <span className="font-semibold text-slate-800">{row.taskTitle}</span> },
          { key: "staffName", header: "Staf" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "driveLink", header: "Link Drive", render: (row) => row.driveLink ? <DriveLink href={row.driveLink} /> : "-" },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
          { key: "submittedAt", header: "Submit", render: (row) => formatDateTime(row.submittedAt) },
          { key: "deadline", header: "Deadline" },
          { key: "punctuality", header: "Ket.", render: (row) => <Badge>{row.isLate ? "Terlambat" : row.punctuality}</Badge> },
          { key: "headFeedback", header: "Feedback", wrap: true, render: (row) => row.headFeedback || "-" },
          { key: "actions", header: "Aksi", render: (row) => (
            <div className="grid gap-2 min-[420px]:grid-cols-2 md:flex md:flex-wrap">
              <button onClick={() => { setSelected(row); setFeedback(row.headFeedback || ""); setMessage(""); }} className="inline-flex items-center justify-center gap-1 rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">
                <Eye size={14} /> Detail
              </button>
              {row.driveLink && <a className="inline-flex items-center justify-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white" href={row.driveLink} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Drive</a>}
              {canReview(row) && row.driveLink && row.status !== "Diterima" && (
                <>
                  <button disabled={saving} onClick={() => updateReview(row, "Diterima")} className="inline-flex items-center justify-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"><ShieldCheck size={14} /> Approve</button>
                  <button disabled={saving} onClick={() => { setSelected(row); setFeedback(row.headFeedback || ""); }} className="inline-flex items-center justify-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"><RotateCcw size={14} /> Revisi</button>
                </>
              )}
            </div>
          ) },
        ]}
      />

      <Modal open={Boolean(selected)} title="Detail Review Tugas" onClose={() => { setSelected(null); setFeedback(""); }}>
        {selected && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Judul Tugas" value={selected.taskTitle} />
              <Info label="Pengumpul" value={`${selected.staffName} (${selected.staffRole})`} />
              <Info label="Divisi" value={divisionName(selected.divisionId)} />
              <Info label="Deadline" value={selected.deadline} />
              <Info label="Tanggal Submit" value={formatDateTime(selected.submittedAt)} />
              <Info label="Keterangan" value={<Badge>{selected.isLate ? "Terlambat" : selected.punctuality}</Badge>} />
              <Info label="Status Review" value={<Badge>{selected.status}</Badge>} />
              <Info label="Reviewer" value={selected.reviewerName ? `${selected.reviewerName} (${selected.reviewerRole || "-"})` : "-"} />
            </div>
            <Info label="Deskripsi Tugas" value={selected.taskDescription || "-"} wide />
            <Info label="Catatan Pengumpulan" value={selected.submissionNote || "-"} wide />
            <Info label="Link Google Drive" value={selected.driveLink ? <DriveLink href={selected.driveLink} /> : "-"} wide />
            <Info label="Feedback Reviewer" value={selected.headFeedback || "-"} wide />
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">Riwayat Revisi</p>
              <div className="mt-3 space-y-2">
                {(selected.revisionHistory || []).length === 0 && <p className="text-sm text-slate-500">Belum ada riwayat revisi.</p>}
                {(selected.revisionHistory || []).map((item, index) => (
                  <div key={`${item.reviewedAt}-${index}`} className="rounded border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    <p className="font-semibold">Revisi {index + 1} - {formatDateTime(item.reviewedAt)}</p>
                    <p className="mt-1">Feedback: {item.feedback || "-"}</p>
                    {item.link && <a className="mt-1 inline-flex font-semibold text-navy-700 hover:underline" href={item.link} target="_blank" rel="noreferrer">Link lama</a>}
                  </div>
                ))}
              </div>
            </section>
            {canReview(selected) && selected.driveLink && selected.status !== "Diterima" && (
              <div className="space-y-3">
                <textarea className="min-h-[110px] w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="Catatan feedback reviewer" value={feedback} onChange={(event) => setFeedback(event.target.value)} />
                <div className="grid gap-2 sm:flex sm:flex-wrap">
                  <button disabled={saving} onClick={() => updateReview(selected, "Diterima")} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-60">Approve / Diterima</button>
                  <button disabled={saving} onClick={() => updateReview(selected, "Revisi")} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-60">Kirim Revisi</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Page>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
    </div>
  );
}

function FilterSelect({ value, onChange, children, disabled = false }) {
  return (
    <select disabled={disabled} className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 disabled:bg-slate-100" value={value} onChange={(event) => onChange(event.target.value)}>
      {children}
    </select>
  );
}

function Info({ label, value, wide = false }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-3 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function DriveLink({ href }) {
  return (
    <a className="inline-flex items-center gap-1 font-semibold text-navy-700 hover:underline" href={href} target="_blank" rel="noreferrer">
      <ExternalLink size={14} /> Buka Drive
    </a>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID");
}
