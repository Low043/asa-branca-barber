export function todayYmd() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function toMeetingIsoUtc(date: string, time: string) {
  return `${date}T${time}:00.000Z`;
}

export function formatDatePtBr(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatMeetingDateTime(isoDate: string) {
  const date = new Date(isoDate);

  const day = `${date.getUTCDate()}`.padStart(2, '0');
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = `${date.getUTCHours()}`.padStart(2, '0');
  const minutes = `${date.getUTCMinutes()}`.padStart(2, '0');

  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}
