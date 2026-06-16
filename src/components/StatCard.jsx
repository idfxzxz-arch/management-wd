export default function StatCard({ title, value, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="group min-h-[112px] rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex h-full items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-5 text-slate-500">{title}</p>
          <p className="mt-2 break-words text-2xl font-bold leading-tight text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`shrink-0 rounded-lg p-3 transition group-hover:scale-105 ${tones[tone]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
