'use client';

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { IconCalendar, IconClock, IconLogout, IconMapPin, IconTrash2, IconX } from '@/components/icons';
import { cancelMeeting, fetchAllMeetings, fetchMeetingsByPhone, fetchServices, Meeting, Service } from '@/lib/api';
import { formatMeetingDateTime } from '@/lib/date';
import { clearProfile, getProfileSnapshot, subscribeProfile } from '@/lib/profile';

function MyMeetingsContent() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [otherMeetings, setOtherMeetings] = useState<Meeting[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [meetingToCancel, setMeetingToCancel] = useState<Meeting | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const servicesMap = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  );
  const firstName = useMemo(() => profile?.name ?? '', [profile?.name]);
  const isBarber = profile?.role === 'BARBER';

  const loadMeetings = useMemo(() => {
    return async (phone: string, currentIsBarber: boolean) => {
      try {
        const [meetingsData, servicesData, allMeetingsData] = await Promise.all([
          fetchMeetingsByPhone(phone),
          fetchServices(),
          currentIsBarber ? fetchAllMeetings() : Promise.resolve([]),
        ]);
        setMeetings(meetingsData);
        setServices(servicesData);
        if (currentIsBarber) {
          setOtherMeetings(allMeetingsData.filter((m) => m.userPhone !== phone));
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar.');
      }
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!profile) {
      router.replace('/login?next=/my-meetings');
      return;
    }

    void loadMeetings(profile.phone, isBarber);
  }, [hydrated, profile, router, isBarber, loadMeetings]);

  function askCancel(meeting: Meeting) {
    setError('');
    setMeetingToCancel(meeting);
  }

  async function confirmCancel() {
    if (!profile || !meetingToCancel) return;

    setCancelSubmitting(true);

    try {
      await cancelMeeting(meetingToCancel.id);
      await loadMeetings(profile.phone, isBarber);
      setMeetingToCancel(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível cancelar.');
    } finally {
      setCancelSubmitting(false);
    }
  }

  return (
    <main className="figma-screen">
      <section className="services-main">
        <header className="services-header">
          <div>
            <h1 className="services-name">{firstName}</h1>
            <div className="services-location">
              <IconMapPin className="icon-13" />
              <span>Natal - RN</span>
            </div>
          </div>

          <button
            className="logout-btn"
            type="button"
            onClick={() => {
              clearProfile();
              router.replace('/login');
            }}
          >
            <IconLogout className="icon-24" />
          </button>
        </header>

        <section className="schedules-container">
          <h2 className="section-title">Seus agendamentos</h2>

          {error ? <p className="error-text">{error}</p> : null}

          {meetings.length === 0 ? (
            <p className="helper-text">Nenhum horário encontrado para o seu telefone.</p>
          ) : null}

          {meetings.map((meeting) => {
            const [dateLabel, timeLabel = ''] = formatMeetingDateTime(meeting.date).split(' às ');
            const service = servicesMap.get(meeting.serviceId);
            const serviceDisplayName = service
              ? `${service.name} (${service.barber?.name || 'Barbeiro'})`
              : 'Serviço';

            return (
              <article className="schedule-card" key={meeting.id}>
                <p className="service-name">{serviceDisplayName}</p>

                <div className="schedule-date-time">
                  <div className="schedule-meta-row">
                    <IconCalendar className="schedule-meta-icon icon-16" />
                    <span>{dateLabel}</span>
                  </div>

                  <div className="schedule-meta-row">
                    <IconClock className="schedule-meta-icon icon-16" />
                    <span>{timeLabel}</span>
                  </div>
                </div>

                <button className="schedule-delete-chip" type="button" onClick={() => askCancel(meeting)}>
                  <IconTrash2/>
                  Cancelar
                </button>
              </article>
            );
          })}

          {isBarber && (
            <>
              <h2 className="section-title" style={{ marginTop: '32px' }}>Outros agendamentos</h2>
              {otherMeetings.length === 0 ? (
                <p className="helper-text">Nenhum outro agendamento encontrado.</p>
              ) : null}
              {otherMeetings.map((meeting) => {
                const [dateLabel, timeLabel = ''] = formatMeetingDateTime(meeting.date).split(' às ');
                const service = servicesMap.get(meeting.serviceId);
                const serviceDisplayName = service
                  ? `${service.name} (${service.barber?.name || 'Barbeiro'})`
                  : 'Serviço';

                return (
                  <article className="schedule-card" key={meeting.id}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                      <p className="service-name">{serviceDisplayName}</p>
                      <p className="helper-text" style={{ fontSize: '14px' }}>
                        {meeting.clientName} - {meeting.userPhone}
                      </p>
                    </div>

                    <div className="schedule-date-time" style={{ marginTop: '8px' }}>
                      <div className="schedule-meta-row">
                        <IconCalendar className="schedule-meta-icon icon-16" />
                        <span>{dateLabel}</span>
                      </div>

                      <div className="schedule-meta-row">
                        <IconClock className="schedule-meta-icon icon-16" />
                        <span>{timeLabel}</span>
                      </div>
                    </div>

                    <button className="schedule-delete-chip" type="button" onClick={() => askCancel(meeting)}>
                      <IconTrash2/>
                      Cancelar
                    </button>
                  </article>
                );
              })}
            </>
          )}
        </section>
      </section>
      <BottomNav active="my-meetings" />

      {meetingToCancel ? (
        <div className="modal-overlay">
          <article className="modal-card">
            <div className="modal-title-row">
              <h3 className="modal-title">Confirmar cancelamento?</h3>
              <button className="icon-btn" type="button" onClick={() => setMeetingToCancel(null)}>
                <IconX className="icon-20" />
              </button>
            </div>

            {(() => {
              const [dateLabel, timeLabel = ''] = formatMeetingDateTime(meetingToCancel.date).split(' às ');
              const service = servicesMap.get(meetingToCancel.serviceId);
              const serviceDisplayName = service
                ? `${service.name} (${service.barber?.name || 'Barbeiro'})`
                : 'Serviço';

              return (
                <>
                  <p className="modal-service">{serviceDisplayName}</p>
                  <div className="modal-meta">
                    <IconCalendar className="icon-16" />
                    <span>{dateLabel}</span>
                  </div>
                  <div className="modal-meta">
                    <IconClock className="icon-16" />
                    <span>{timeLabel}</span>
                  </div>
                </>
              );
            })()}

            <button
              className="cancel-confirm-btn"
              type="button"
              onClick={confirmCancel}
              disabled={cancelSubmitting}
            >
              {cancelSubmitting ? 'Cancelando...' : 'Confirmar cancelamento'}
            </button>
          </article>
        </div>
      ) : null}
    </main>
  );
}

function MyMeetingsFallback() {
  return (
    <main className="figma-screen services-main">
      <p className="helper-text">Carregando...</p>
    </main>
  );
}

export default function MyMeetingsPage() {
  return (
    <Suspense fallback={<MyMeetingsFallback />}>
      <MyMeetingsContent />
    </Suspense>
  );
}
