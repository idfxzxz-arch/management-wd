import { Link, useParams } from "react-router-dom";
import Badge from "../components/Badge";
import ProgressBar from "../components/ProgressBar";
import { useAppData } from "../data/AppDataProvider";
import { Page } from "./Divisions";

export default function JobdeskDetail() {
  const { id } = useParams();
  const { tasks, divisionName, employeeName, loading, error } = useAppData();
  const task = tasks.find((item) => String(item.id) === id);

  if (loading) return <Page title="Detail Jobdesk"><p className="text-slate-500">Memuat data Supabase...</p></Page>;
  if (error) return <Page title="Detail Jobdesk"><p className="text-amber-700">{error}</p></Page>;
  if (!task) return <Page title="Detail Jobdesk"><p className="text-slate-500">Tugas tidak ditemukan.</p></Page>;

  return (
    <Page title="Detail Jobdesk" subtitle={task.title} action={<Link className="rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700" to="/individual-jobdesk">Kembali</Link>}>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{task.title}</h2>
          <p className="mt-2 text-slate-600">{task.description}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info label="Penanggung Jawab" value={employeeName(task.assigneeId)} />
            <Info label="Divisi" value={divisionName(task.divisionId)} />
            <Info label="Sumber Tugas" value={<Badge>{task.assignedBy}</Badge>} />
            <Info label="Pemberi Tugas" value={task.assignedByName} />
            <Info label="Deadline" value={task.deadline} />
            <Info label="Prioritas" value={<Badge>{task.priority}</Badge>} />
            <Info label="Status" value={<Badge>{task.status}</Badge>} />
            <Info label="Approval" value={<Badge>{task.approval}</Badge>} />
          </div>
          <div className="mt-5"><ProgressBar value={task.progress} /></div>
          <p className="mt-5 rounded bg-amber-50 px-4 py-3 text-sm text-amber-800">Catatan: {task.note}</p>
        </section>
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Riwayat Update</h2>
          <div className="mt-4 space-y-3">
            {task.history.map((item, index) => (
              <div key={item} className="flex gap-3 rounded border border-slate-100 p-3">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-navy-50 text-sm font-bold text-navy-700">{index + 1}</span>
                <p className="text-sm text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}

function Info({ label, value }) {
  return <div className="rounded bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><div className="mt-1 text-sm font-semibold text-slate-800">{value}</div></div>;
}
