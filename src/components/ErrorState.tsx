interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Gagal memuat data. Coba lagi.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="py-10 px-4 text-center border border-line bg-surface rounded-sm">
      <p className="text-sm text-main mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-block px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-sm transition-colors cursor-pointer"
        >
          Muat ulang
        </button>
      )}
    </div>
  );
}
