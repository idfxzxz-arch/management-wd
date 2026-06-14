export default function ProgressBar({ value = 0 }) {
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
