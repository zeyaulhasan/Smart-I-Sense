import { format, formatDistanceToNow } from 'date-fns';

export function formatWatts(value) {
  if (value == null) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}kW`;
  return `${Math.round(value)}W`;
}

export function formatWater(value) {
  if (value == null) return '—';
  return `${value.toFixed(1)} L/min`;
}

export function formatTimestamp(date) {
  if (!date) return '—';
  return format(new Date(date), 'HH:mm:ss');
}

export function formatDate(date) {
  if (!date) return '—';
  return format(new Date(date), 'MMM dd, HH:mm');
}

export function timeAgo(date) {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getStatusColor(electricity, water) {
  if (electricity > 500 || water > 6) return 'danger';
  if (electricity > 300 || water > 4) return 'warn';
  return 'ok';
}

export function getStatusLabel(status) {
  switch (status) {
    case 'danger': return 'Alert';
    case 'warn': return 'Warning';
    default: return 'Normal';
  }
}

export function roomLabel(key) {
  const labels = {
    livingRoom: 'Living Room',
    bedroom: 'Bedroom',
    kitchen: 'Kitchen',
    bathroom: 'Bathroom'
  };
  return labels[key] || key;
}

export function roomIcon(key) {
  const icons = {
    livingRoom: '🛋️',
    bedroom: '🛏️',
    kitchen: '🍳',
    bathroom: '🚿'
  };
  return icons[key] || '🏠';
}

export function exportToCSV(data, filename = 'smart-i-sense-data') {
  if (!data || data.length === 0) return;

  // Detect room keys from first record that has rooms
  const sampleWithRooms = data.find(d => d.rooms && typeof d.rooms === 'object');
  const roomKeys = sampleWithRooms ? Object.keys(sampleWithRooms.rooms) : [];

  const headers = ['Timestamp', 'Electricity (W)', 'Water (L/min)'];
  roomKeys.forEach(key => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    headers.push(`${label} Elec (W)`, `${label} Water (L/min)`);
  });

  const rows = data.map(d => {
    const row = [
      new Date(d.timestamp).toISOString(),
      d.electricity,
      d.water
    ];
    roomKeys.forEach(key => {
      const room = d.rooms?.[key];
      row.push(room?.electricity ?? '', room?.water ?? '');
    });
    return row;
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
