export function scheduleToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToSchedule(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function dateToMinutes(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function dateWithoutTime(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function getLocalDateTime() {
  const now = new Date();
  // Fuso horário do Brasil (UTC-3) = 3 horas em milissegundos
  const BRAZIL_OFFSET = 3 * 60 * 60 * 1000;

  // Retorna um objeto Date onde os métodos getUTC*() vão retornar a hora local do Brasil
  return new Date(now.getTime() - BRAZIL_OFFSET);
}
