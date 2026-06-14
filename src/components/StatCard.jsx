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
    <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`rounded p-3 ${tones[tone]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
