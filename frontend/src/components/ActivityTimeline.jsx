export default function ActivityTimeline({ items = [], emptyText = 'No recent activity' }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-slate-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />
      {items.map((item, i) => (
        <div key={item.id || i} className="flex items-start gap-4 pb-4 last:pb-0">
          <div className={`relative z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
            item.color === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
            item.color === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
            item.color === 'green' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
            'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
          }`}>
            {item.icon || <DotIcon />}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
            {item.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>}
            <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DotIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" /></svg>
  );
}
