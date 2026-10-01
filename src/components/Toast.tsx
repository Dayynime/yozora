import { useToast } from '../context/ToastContext';

export function ToastContainer() {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-18 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 bg-surface text-main border border-line rounded-sm shadow-sm text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <span className="truncate">{toast.text}</span>
          {toast.actionText && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                hideToast(toast.id);
              }}
              className="text-accent hover:text-accent-hover font-bold uppercase tracking-wider shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              {toast.actionText}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
