/** lib/format — small display helpers. */
export function formatDuration(ms) {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
export const formatDate = (iso) => dateFmt.format(new Date(iso));

export function languageLabel(code) {
  if (!code || code === 'auto') return 'Auto';
  return code
    .split(',')
    .map((c) => ({ 'hi-IN': 'Hindi', 'en-IN': 'English', 'en-US': 'English' })[c] ?? c)
    .join(' + ');
}
