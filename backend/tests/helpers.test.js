const { formatWatts, formatWater, getStatusColor, getStatusLabel, roomLabel, roomIcon } = (() => {
  // Replicate helper functions for testing
  function formatWatts(value) {
    if (value == null) return '—';
    if (value >= 1000) return `${(value / 1000).toFixed(1)}kW`;
    return `${Math.round(value)}W`;
  }

  function formatWater(value) {
    if (value == null) return '—';
    return `${value.toFixed(1)} L/min`;
  }

  function getStatusColor(electricity, water) {
    if (electricity > 500 || water > 6) return 'danger';
    if (electricity > 300 || water > 4) return 'warn';
    return 'ok';
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'danger': return 'Alert';
      case 'warn': return 'Warning';
      default: return 'Normal';
    }
  }

  function roomLabel(key) {
    const labels = {
      livingRoom: 'Living Room',
      bedroom: 'Bedroom',
      kitchen: 'Kitchen',
      bathroom: 'Bathroom'
    };
    return labels[key] || key;
  }

  function roomIcon(key) {
    const icons = {
      livingRoom: '🛋️',
      bedroom: '🛏️',
      kitchen: '🍳',
      bathroom: '🚿'
    };
    return icons[key] || '🏠';
  }

  return { formatWatts, formatWater, getStatusColor, getStatusLabel, roomLabel, roomIcon };
})();

describe('formatWatts', () => {
  test('returns dash for null', () => {
    expect(formatWatts(null)).toBe('—');
    expect(formatWatts(undefined)).toBe('—');
  });

  test('formats watts correctly', () => {
    expect(formatWatts(500)).toBe('500W');
    expect(formatWatts(0)).toBe('0W');
  });

  test('converts to kW for values >= 1000', () => {
    expect(formatWatts(1000)).toBe('1.0kW');
    expect(formatWatts(2500)).toBe('2.5kW');
  });
});

describe('formatWater', () => {
  test('returns dash for null', () => {
    expect(formatWater(null)).toBe('—');
  });

  test('formats water correctly', () => {
    expect(formatWater(3.5)).toBe('3.5 L/min');
    expect(formatWater(0)).toBe('0.0 L/min');
  });
});

describe('getStatusColor', () => {
  test('returns danger for high values', () => {
    expect(getStatusColor(600, 1)).toBe('danger');
    expect(getStatusColor(100, 7)).toBe('danger');
  });

  test('returns warn for moderate values', () => {
    expect(getStatusColor(400, 1)).toBe('warn');
    expect(getStatusColor(100, 5)).toBe('warn');
  });

  test('returns ok for normal values', () => {
    expect(getStatusColor(200, 3)).toBe('ok');
  });
});

describe('getStatusLabel', () => {
  test('maps status correctly', () => {
    expect(getStatusLabel('danger')).toBe('Alert');
    expect(getStatusLabel('warn')).toBe('Warning');
    expect(getStatusLabel('ok')).toBe('Normal');
    expect(getStatusLabel('unknown')).toBe('Normal');
  });
});

describe('roomLabel', () => {
  test('maps known rooms', () => {
    expect(roomLabel('livingRoom')).toBe('Living Room');
    expect(roomLabel('kitchen')).toBe('Kitchen');
  });

  test('returns key for unknown rooms', () => {
    expect(roomLabel('garage')).toBe('garage');
  });
});

describe('roomIcon', () => {
  test('maps known rooms', () => {
    expect(roomIcon('kitchen')).toBe('🍳');
    expect(roomIcon('bathroom')).toBe('🚿');
  });

  test('returns default for unknown rooms', () => {
    expect(roomIcon('garage')).toBe('🏠');
  });
});
