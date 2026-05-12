export default function Skeleton({ className = '', variant = 'rect' }) {
  const base = 'animate-pulse bg-[var(--border-subtle)]';
  const shapes = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-md h-4',
  };

  return <div className={`${base} ${shapes[variant] || shapes.rect} ${className}`} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card-base p-6 flex flex-col gap-4 ${className}`}>
      <Skeleton className="h-4 w-24" variant="text" />
      <Skeleton className="h-8 w-32" variant="text" />
      <Skeleton className="h-3 w-16" variant="text" />
    </div>
  );
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`card-base p-6 flex flex-col gap-4 ${className}`}>
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32" variant="text" />
        <Skeleton className="h-5 w-20" variant="text" />
      </div>
      <div className="flex items-end gap-1 h-48">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  );
}
