import { useCallback } from 'react';

export default function useExport(filename = 'export') {
  const exportCSV = useCallback((data, columns) => {
    const header = columns.map(c => `"${c.label}"`).join(',');
    const rows = data.map(row =>
      columns.map(c => {
        const val = c.accessor(row);
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filename]);

  return { exportCSV };
}
