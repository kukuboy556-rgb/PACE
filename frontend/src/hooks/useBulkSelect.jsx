import { useState, useCallback, useMemo } from 'react';

export default function useBulkSelect(items = [], idKey = 'id') {
  const [selected, setSelected] = useState(new Set());

  const toggle = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(prev => prev.size === items.length ? new Set() : new Set(items.map(i => i[idKey])));
  }, [items, idKey]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0;

  return { selected: useMemo(() => selected, [selected]), toggle, toggleAll, clear, allSelected, someSelected };
}
