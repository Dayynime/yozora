interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = 'Tidak ada komik yang ditemukan.' }: EmptyStateProps) {
  return (
    <div className="py-12 px-4 text-center border border-line bg-surface rounded-sm">
      <p className="text-muted text-sm">{message}</p>
    </div>
  );
}
