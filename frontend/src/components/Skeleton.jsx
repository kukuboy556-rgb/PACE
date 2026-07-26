export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4 mb-3 px-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3 px-4 border-t border-surface-border dark:border-surface-dark-border">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3" />
          <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-full mb-2" />
          <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card animate-pulse" style={{ background: '#cbd5e1' }}>
          <div className="relative z-10 space-y-2">
            <div className="h-3 bg-white/30 rounded w-1/2" />
            <div className="h-8 bg-white/30 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
