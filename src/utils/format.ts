const MONTHS_FALLBACK = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS_FALLBACK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Format a YYYY-MM-DD string as e.g. "Jan 5" in the given locale. */
export function formatShortDate(dateStr: string, locale: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d))
  } catch {
    return `${MONTHS_FALLBACK[m - 1]} ${d}`
  }
}

/** Format a Date as e.g. "Monday, Jan 5" in the given locale. */
export function formatDayLabel(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' }).format(date)
  } catch {
    return `${DAYS_FALLBACK[date.getDay()]}, ${MONTHS_FALLBACK[date.getMonth()]} ${date.getDate()}`
  }
}
