'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconTrash2,
  IconX,
} from '@/components/icons';
import {
  cancelMeeting,
  CompletedMeeting,
  fetchCompletedMeetings,
  fetchMonthlyReport,
  MonthlyReport,
} from '@/lib/api';
import { formatMeetingDateTime } from '@/lib/date';
import { getProfileSnapshot, subscribeProfile } from '@/lib/profile';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function ReportsPage() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [completed, setCompleted] = useState<CompletedMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [meetingToCancel, setMeetingToCancel] = useState<CompletedMeeting | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && !profile) {
      router.replace('/login?next=/settings/reports');
    }
  }, [hydrated, profile, router]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [reportData, completedData] = await Promise.all([
          fetchMonthlyReport(year, month),
          fetchCompletedMeetings(year, month),
        ]);
        if (!cancelled) {
          setReport(reportData);
          setCompleted(completedData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar relatório.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [profile, year, month]);

  if (!profile) return null;

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  async function confirmCancel() {
    if (!meetingToCancel) return;

    setCancelSubmitting(true);
    setError('');
    try {
      await cancelMeeting(meetingToCancel.id);
      setCompleted((prev) => prev.filter((m) => m.id !== meetingToCancel.id));
      setReport((prev) =>
        prev
          ? {
              ...prev,
              clientsAttended: Math.max(0, prev.clientsAttended - 1),
              balanceCents: Math.max(0, prev.balanceCents - meetingToCancel.priceCents),
            }
          : prev,
      );
      setMeetingToCancel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível cancelar.');
    } finally {
      setCancelSubmitting(false);
    }
  }

  return (
    <main className="figma-screen">
      <section className="scheduling-main">
        <header className="scheduling-header">
          <button className="left icon-btn" onClick={() => router.back()}>
            <IconArrowLeft />
          </button>
          <h1 className="scheduling-title">Relatórios</h1>
        </header>

        <section className="services-list" style={{ marginTop: '16px' }}>
          <div className="calendar-card">
            <div className="month-row">
              <button
                className="icon-btn left"
                onClick={prevMonth}
                aria-label="Mês anterior"
              >
                <IconArrowLeft />
              </button>
              <p className="month-name">
                {MONTHS[month]} {year}
              </p>
              <button
                className="icon-btn right"
                onClick={nextMonth}
                aria-label="Próximo mês"
                disabled={year === now.getFullYear() && month === now.getMonth()}
                style={{
                  opacity:
                    year === now.getFullYear() && month === now.getMonth() ? 0.35 : 1,
                  cursor:
                    year === now.getFullYear() && month === now.getMonth()
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                <IconArrowRight />
              </button>
            </div>
          </div>

          {loading ? (
            <p className="helper-text">Carregando relatório...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : report ? (
            <>
              <article
                className="calendar-card"
                style={{ display: 'grid', gap: '4px', background: '#ffb228' }}
              >
                <p style={{ margin: 0, fontSize: '13px', color: '#ffffff' }}>Saldo</p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '32px',
                    fontWeight: 600,
                    lineHeight: 1.1,
                    color: '#ffffff',
                  }}
                >
                  {formatBRL(report.balanceCents)}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#ffffff',
                    marginTop: '2px',
                  }}
                >
                  recebido no mês
                </p>
              </article>

              <article className="calendar-card" style={{ display: 'grid', gap: '4px' }}>
                <p className="helper-text" style={{ fontSize: '13px' }}>
                  Clientes atendidos
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '32px',
                    fontWeight: 600,
                    lineHeight: 1.1,
                    color: '#1e1e1e',
                  }}
                >
                  {report.clientsAttended}
                </p>
                <p className="helper-text" style={{ fontSize: '13px', marginTop: '2px' }}>
                  {report.clientsAttended === 1 ? 'cliente' : 'clientes'} no mês
                </p>
              </article>

              <h2 className="section-title" style={{ marginTop: '16px' }}>
                Atendimentos concluídos
              </h2>

              {completed.length === 0 ? (
                <p
                  className="helper-text"
                  style={{ textAlign: 'center', marginTop: '16px' }}
                >
                  Nenhum atendimento concluído neste mês.
                </p>
              ) : (
                completed.map((meeting) => {
                  const [dateLabel, timeLabel = ''] = formatMeetingDateTime(
                    meeting.date,
                  ).split(' às ');

                  return (
                    <article className="schedule-card" key={meeting.id}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0px',
                        }}
                      >
                        <p className="service-name">{meeting.service.name}</p>
                        <p className="helper-text" style={{ fontSize: '14px' }}>
                          {meeting.clientName} - {formatBRL(meeting.priceCents)}
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

                      <button
                        className="schedule-delete-chip"
                        type="button"
                        onClick={() => setMeetingToCancel(meeting)}
                      >
                        <IconTrash2 />
                        Cancelar
                      </button>
                    </article>
                  );
                })
              )}
            </>
          ) : null}
        </section>
      </section>

      {meetingToCancel ? (
        <div className="modal-overlay">
          <article className="modal-card">
            <div className="modal-title-row">
              <h3 className="modal-title">Confirmar cancelamento?</h3>
              <button
                className="icon-btn"
                type="button"
                onClick={() => setMeetingToCancel(null)}
              >
                <IconX className="icon-20" />
              </button>
            </div>

            {(() => {
              const [dateLabel, timeLabel = ''] = formatMeetingDateTime(
                meetingToCancel.date,
              ).split(' às ');

              return (
                <>
                  <p className="modal-service">{meetingToCancel.service.name}</p>
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
              onClick={() => void confirmCancel()}
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
