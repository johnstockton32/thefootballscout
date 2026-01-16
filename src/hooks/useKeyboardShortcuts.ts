import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ShortcutConfig {
  enabled?: boolean;
  onSave?: () => void;
}

export function useKeyboardShortcuts(config: ShortcutConfig = {}) {
  const { enabled = true, onSave } = config;
  const navigate = useNavigate();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Check if user is typing in an input field
    const target = event.target as HTMLElement;
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    // Ctrl/Cmd + S - Save
    if (modifier && event.key === 's') {
      event.preventDefault();
      if (onSave) {
        onSave();
        toast.success('Saved!', { duration: 1500 });
      }
      return;
    }

    // Only handle navigation shortcuts if not typing
    if (isTyping) return;

    // Ctrl/Cmd + Shift + P - New Player
    if (modifier && event.shiftKey && event.key === 'P') {
      event.preventDefault();
      navigate('/players/new');
      return;
    }

    // Ctrl/Cmd + Shift + R - New Report
    if (modifier && event.shiftKey && event.key === 'R') {
      event.preventDefault();
      navigate('/reports/new');
      return;
    }

    // Escape - Go back
    if (event.key === 'Escape') {
      event.preventDefault();
      navigate(-1);
      return;
    }

    // G then H - Go Home/Dashboard
    // G then P - Go Players
    // G then R - Go Reports
  }, [enabled, navigate, onSave]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleKeyDown };
}
