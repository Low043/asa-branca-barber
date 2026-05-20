'use client';

import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconX,
} from '@/components/icons';
import { createMeeting, fetchAvailableTimes, fetchServices, Service } from '@/lib/api';
import { formatDatePtBr, toMeetingIsoUtc, todayYmd } from '@/lib/date';
import { getProfileSnapshot, subscribeProfile } from '@/lib/profile';

function formatMonthLabel(date: Date) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const value = formatter.format(date);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ymdFromDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addMonthsUtc(baseDate: Date, amount: number) {
  return new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + amount, 1));
}

function calendarWeeks(viewMonth: Date) {
  const year = viewMonth.getUTCFullYear();
  const month = viewMonth.getUTCMonth();
  const firstWeekDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: Array<number | null> = Array(firstWeekDay).fill(null);
  for (let day = 1; day <= totalDays; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Array<Array<number | null>> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function SchedulingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryServiceId = searchParams.get('serviceId');

  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayYmd());
  const [selectedTime, setSelectedTime] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const timesCacheRef = useRef<Map<string, string[]>>(new Map());

  const initialMonth = useMemo(() => {
    const [year, month] = todayYmd().split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, 1));
  }, []);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  useEffect(() => {
    if (!hydrated) return;

    if (!profile) {
      const next = queryServiceId ? `/scheduling?serviceId=${queryServiceId}` : '/scheduling';
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    async function loadServices() {
      try {
        const data = await fetchServices();
        setServices(data);

        if (queryServiceId && data.some((service) => service.id === queryServiceId)) {
          setSelectedServiceId(queryServiceId);
        } else if (data[0]) {
          setSelectedServiceId(data[0].id);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar serviços.');
      }
    }

    void loadServices();
  }, [hydrated, profile, queryServiceId, router]);

  useEffect(() => {
    timesCacheRef.current.clear();
  }, []);

  useEffect(() => {
    async function loadTimes() {
      setSelectedTime('');
      setError('');

      const cached = timesCacheRef.current.get(selectedDate);
      if (cached) {
        setTimes(cached);
        return;
      }

      try {
        const available = await fetchAvailableTimes(selectedDate);
        timesCacheRef.current.set(selectedDate, available);
        setTimes(available);
      } catch (requestError) {
        setTimes([]);
        setError(requestError instanceof Error ? requestError.message : 'Erro ao carregar horários.');
      }
    }

    void loadTimes();
  }, [selectedDate]);

  const weeks = useMemo(() => calendarWeeks(viewMonth), [viewMonth]);
  const monthName = useMemo(() => formatMonthLabel(viewMonth), [viewMonth]);

  function selectDay(day: number) {
    const nextDate = new Date(Date.UTC(viewMonth.getUTCFullYear(), viewMonth.getUTCMonth(), day));
    setSelectedDate(ymdFromDate(nextDate));
  }

  async function confirmMeeting() {
    if (!profile || !selectedServiceId || !selectedTime) return;

    setSubmitting(true);
    setError('');

    try {
      await createMeeting({
        serviceId: selectedServiceId,
        clientName: profile.name,
        userPhone: profile.phone,
        date: toMeetingIsoUtc(selectedDate, selectedTime),
      });
      router.push('/my-meetings');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível confirmar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <main className="figma-screen">
        <section className="scheduling-main">
          <header className="scheduling-header">
            <button className="icon-btn left" type="button" onClick={() => router.push('/services')}>
              <IconArrowLeft className="icon-24" />
            </button>

            <div>
              <h1 className="scheduling-title">Agendamento</h1>
              <p className="scheduling-subtitle">{selectedService?.name ?? 'Selecione o serviço'}</p>
            </div>
          </header>

          <section className="calendar-block">
            <h2 className="section-title">Selecione a data</h2>

            <article className="calendar-card">
              <div className="month-row">
                <button className="icon-btn" type="button" onClick={() => setViewMonth(addMonthsUtc(viewMonth, -1))}>
                  <IconArrowLeft className="icon-20" />
                </button>
                <p className="month-name">{monthName}</p>
                <button className="icon-btn" type="button" onClick={() => setViewMonth(addMonthsUtc(viewMonth, 1))}>
                  <IconArrowRight className="icon-20" />
                </button>
              </div>

              <div className="days-header">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="days-grid">
                {weeks.flatMap((week, indexWeek) =>
                  week.map((day, indexDay) => {
                    if (!day) {
                      return <span className="day-cell empty" key={`empty-${indexWeek}-${indexDay}`} />;
                    }

                    const ymd = ymdFromDate(
                      new Date(Date.UTC(viewMonth.getUTCFullYear(), viewMonth.getUTCMonth(), day)),
                    );
                    const isActive = ymd === selectedDate;

                    return (
                      <button
                        key={ymd}
                        className={`day-cell ${isActive ? 'active' : ''}`}
                        type="button"
                        onClick={() => selectDay(day)}
                      >
                        {day}
                      </button>
                    );
                  }),
                )}
              </div>
            </article>
          </section>

          <section className="calendar-block">
            <div className="time-header">
              <h2 className="section-title">Selecione o horário</h2>
            </div>

            <div className="time-grid">
              {times.map((time) => (
                <button
                  key={time}
                  className={`time-chip ${selectedTime === time ? 'active' : ''}`}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </section>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="reserve-footer">
            <button className="primary-btn" disabled={!selectedTime} type="button" onClick={() => setIsModalOpen(true)}>
              Reservar
            </button>
          </div>
        </section>
      </main>

      {isModalOpen ? (
        <div className="modal-overlay">
          <article className="modal-card">
            <div className="modal-title-row">
              <h3 className="modal-title">Confirmar Agendamento?</h3>
              <button className="icon-btn" type="button" onClick={() => setIsModalOpen(false)}>
                <IconX className="icon-20" />
              </button>
            </div>

            <p className="modal-service">{selectedService?.name ?? 'Serviço não informado'}</p>

            <div className="modal-meta">
              <IconCalendar className="icon-16" />
              <span>{formatDatePtBr(selectedDate)}</span>
            </div>
            <div className="modal-meta">
              <IconClock className="icon-16" />
              <span>{selectedTime}</span>
            </div>

            <button className="confirm-btn" type="button" disabled={submitting} onClick={confirmMeeting}>
              {submitting ? 'Confirmando...' : 'Confirmar'}
            </button>
          </article>
        </div>
      ) : null}
    </>
  );
}

function SchedulingFallback() {
  return (
    <main className="figma-screen scheduling-main">
      <p className="helper-text">Carregando...</p>
    </main>
  );
}

export default function SchedulingPage() {
  return (
    <Suspense fallback={<SchedulingFallback />}>
      <SchedulingContent />
    </Suspense>
  );
}
