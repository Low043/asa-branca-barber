export interface Schedule {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  lunchStart: string;
  lunchEnd: string;
}

export async function fetchSchedules(): Promise<Schedule[]> {
  const apiBaseUrl = process.env.API_BASE_URL;

  const data = await fetch(`${apiBaseUrl}/schedules`, {
    next: { revalidate: 60 },
  }).catch(() => null);

  if (!data || !data.ok) return [];

  return data.json();
}

export function Schedule(data: Schedule) {
  const title = `${data.openTime} - ${data.closeTime}`;
  const info = `${data.lunchStart} - ${data.lunchEnd}`;

  return (
    <li key={data.dayOfWeek}>
      <h2>{title}</h2>
      <p>{info}</p>
    </li>
  );
}
