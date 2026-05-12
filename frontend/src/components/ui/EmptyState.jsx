import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data', message = 'Nothing to display yet.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--border-subtle)] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[var(--text-muted)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}
