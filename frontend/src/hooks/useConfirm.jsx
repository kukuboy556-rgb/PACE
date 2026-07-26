import { useState, useCallback, useRef } from 'react';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function useConfirm() {
  const [state, setState] = useState({ open: false, title: '', message: '', confirmLabel: 'Confirm', variant: 'danger' });
  const resolveRef = useRef(null);

  const confirm = useCallback((title, message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, title, message, confirmLabel: options.confirmLabel || 'Confirm', variant: options.variant || 'danger' });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setState(s => ({ ...s, open: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    setState(s => ({ ...s, open: false }));
  }, []);

  const dialog = (
    <ConfirmationDialog
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      variant={state.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, dialog };
}
