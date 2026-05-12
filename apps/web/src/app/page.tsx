import { Schedule, fetchSchedules } from '@/components/Schedule';

export default async function Home() {
  const schedules = await fetchSchedules();
  const schedulesList = schedules.map((s) => <Schedule key={s.dayOfWeek} {...s} />);

  return (
    <div>
      <h1>Schedules</h1>
      <ul>{schedulesList}</ul>
    </div>
  );
}
