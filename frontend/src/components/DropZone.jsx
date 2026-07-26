import { useState, useRef, useCallback } from 'react';

export default function DropZone({ onFiles, accept = '.jpg,.jpeg,.png,.pdf,.docx,.xlsx', maxSize = 10 * 1024 * 1024, multiple = false }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const files = Array.from(e.dataTransfer.files).filter(f => {
      if (f.size > maxSize) { console.warn('File too large:', f.name); return false; }
      return true;
    });
    if (files.length) onFiles(multiple ? files : [files[0]]);
  }, [onFiles, maxSize, multiple]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
        drag ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/5' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
      }`}>
      <input ref={inputRef} type="file" hidden multiple={multiple} accept={accept} onChange={e => { if (e.target.files.length) onFiles(multiple ? Array.from(e.target.files) : [e.target.files[0]]); e.target.value = ''; }} />
      <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{drag ? 'Drop files here' : 'Click or drag files to upload'}</p>
      <p className="text-xs text-slate-400 mt-1">Max {maxSize / 1024 / 1024}MB per file</p>
    </div>
  );
}
