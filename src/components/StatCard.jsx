export default function StatCard({ title, value, icon: Icon, tone = "blue", compact = false }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className={`group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5 ${compact ? "min-h-[108px]" : "min-h-[124px]"}`}>
      <div className="flex h-full items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-5 text-slate-500">{title}</p>
          <p className={`${compact ? "mt-1.5 text-xl" : "mt-2 text-2xl"} break-words font-bold leading-tight tracking-tight text-slate-950`}>{value}</p>
        </div>
        {Icon && (
          <div className={`shrink-0 rounded-xl p-3 transition group-hover:scale-105 ${tones[tone]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
