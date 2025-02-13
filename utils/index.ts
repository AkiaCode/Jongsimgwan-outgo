export function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1)) as unknown as number
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return weekNo
}

export function getDateNumber (now) {
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = (now as unknown as number) - (start as unknown as number)
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}