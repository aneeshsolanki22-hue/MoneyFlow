/** Format a number with digit grouping according to locale */
export function formatNumber(value: number, locale = 'en-IN'): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** Format an amount with a given currency symbol and locale, optionally signed. */
export function formatCurrency(
  value: number,
  symbol = '₹',
  opts: { sign?: boolean; locale?: string } = {},
): string {
  const prefix = value < 0 ? '-' : opts.sign && value > 0 ? '+' : '';
  const numStr = formatNumber(Math.abs(value), opts.locale ?? (symbol === '₹' ? 'en-IN' : 'en-US'));
  return `${prefix}${symbol}${numStr}`;
}

/** Format an amount with the rupee symbol, optionally signed. e.g. -450 -> "-₹450" */
export function formatINR(value: number, opts: { sign?: boolean } = {}): string {
  return formatCurrency(value, '₹', opts);
}

/** 12:30 PM style time. */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  const h24 = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h = h24 % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** TODAY / YESTERDAY / 16 AUGUST style group headers. */
export function formatDayHeader(ts: number): string {
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / 86400000);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'YESTERDAY';
  const d = new Date(ts);
  const currentYear = new Date().getFullYear();
  const yearSuffix = d.getFullYear() !== currentYear ? ` ${d.getFullYear()}` : '';
  return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'long' }).toUpperCase()}${yearSuffix}`;
}

/** 'YYYY-MM' key used to group transactions by month. */
export function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatLastBackup(ts: number | null): string {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
