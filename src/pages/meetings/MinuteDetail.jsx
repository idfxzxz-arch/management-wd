import { Link, useParams } from "react-router-dom";
import { useAppData } from "../../data/AppDataProvider";
import { Page } from "../../components/PageShell";
import { getCurrentUser } from "../../utils/auth";

export default function MinuteDetail() {
  const { id } = useParams();
  const user = getCurrentUser();
  const { minutes, divisionName, scopedByDivision, loading, error } = useAppData();
  const minute = scopedByDivision(minutes, user).find((item) => String(item.id) === id);
  if (loading) return <Page title="Detail Notulen"><p className="text-slate-500">Memuat data...</p></Page>;
  if (error) return <Page title="Detail Notulen"><p className="text-amber-700">{error}</p></Page>;
  if (!minute) return <Page title="Detail Notulen"><p className="text-slate-500">Notulen tidak ditemukan.</p></Page>;

  return (
    <Page title="Detail Notulen" subtitle={minute.title} action={<Link to="/minutes" className="rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold">Kembali</Link>}>
      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Tanggal" value={minute.date} />
          <Info label="Waktu" value={minute.time} />
          <Info label="Divisi" value={divisionName(minute.divisionId)} />
          <Info label="Pemimpin" value={minute.leader} />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Block title="Daftar Peserta" text={minute.participants.join(", ")} />
          <Block title="Isi Pembahasan" text={minute.discussion} />
          <Block title="Keputusan Rapat" text={minute.decision} />
          <Block title="Action Plan" text={minute.followUp} />
        </div>
        <p className="mt-5 rounded bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">Deadline tindak lanjut: {minute.actionDeadline}</p>
      </section>
    </Page>
  );
}

function Info({ label, value }) {
  return <div className="rounded bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value}</p></div>;
}

function Block({ title, text }) {
  return <div className="rounded border border-slate-100 p-4"><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>;
}
