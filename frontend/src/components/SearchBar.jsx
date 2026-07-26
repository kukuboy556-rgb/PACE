import { useState, useEffect, useRef } from 'react';

export default function SearchBar({ value, onChange, placeholder = 'Search...', debounce = 300 }) {
  const [local, setLocal] = useState(value || '');
  const initial = useRef(true);

  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    const timer = setTimeout(() => onChange(local), debounce);
    return () => clearTimeout(timer);
  }, [local, debounce, onChange]);

  useEffect(() => {
    if (value !== local) setLocal(value || '');
  }, [value]);

  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        data-search-input
        type="text"
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 pr-8 text-sm"
      />
      {local && (
        <button onClick={() => { setLocal(''); onChange(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
