import { Link } from 'react-router-dom';

interface SectionHeaderProps {
  title: string;
  linkTo?: string;
  linkText?: string;
  count?: number;
}

export function SectionHeader({
  title,
  linkTo,
  linkText = 'Lihat semua',
  count,
}: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between border-b border-line pb-2 mb-3">
      <div className="flex items-baseline gap-2">
        <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-main">
          {title}
        </h2>
        {count !== undefined && (
          <span className="text-xs font-mono text-muted tabular-nums">
            ({count})
          </span>
        )}
      </div>

      {linkTo && (
        <Link
          to={linkTo}
          className="text-xs text-muted hover:text-accent font-medium transition-colors"
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}
