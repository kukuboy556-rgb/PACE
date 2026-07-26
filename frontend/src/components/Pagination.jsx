export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  if (start > 1) pages.push(1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('...');
  if (end < totalPages) pages.push(totalPages);

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-300 text-sm">...</span>
        ) : (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
            {p}
          </button>
        )
      )}

      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
