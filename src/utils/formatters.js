export function formatDateTime(epochMs) {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleString();
}

export function formatDate(epochMs) {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleDateString();
}

export function formatTime(epochMs) {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleTimeString();
}

export function formatRelative(epochMs) {
  if (!epochMs) return '—';
  const diff = Date.now() - epochMs;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
