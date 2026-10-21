// Formats ISO dates the same way Postgres TO_CHAR does with 'Mon' (English,
// three letters), so pages that used to format in SQL render identically.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// 'YYYY-MM-DD' -> 'Mon DD'
export function formatMonthDay(isoDate: string) {
  const [, month, day] = isoDate.split('-')
  return `${MONTHS[Number(month) - 1]} ${day}`
}

// 'YYYY-MM' -> 'Mon YYYY'
export function formatMonthYear(isoMonth: string) {
  const [year, month] = isoMonth.split('-')
  return `${MONTHS[Number(month) - 1]} ${year}`
}

// 'YYYY-MM-DD' -> 'DD Mon YYYY'
export function formatDayMonthYear(isoDate: string) {
  const [year, month, day] = isoDate.split('-')
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`
}
