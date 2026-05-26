'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconEdit, IconX } from '@/components/icons';
import { fetchSchedules, updateSchedule, Schedule } from '@/lib/api';
import { getProfileSnapshot, subscribeProfile } from '@/lib/profile';

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export default function SchedulesPage() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    if (hydrated && !profile) {
      router.replace('/login?next=/settings/schedules');
      return;
    }

    async function load() {
      try {
        setSchedules(await fetchSchedules());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar horários.');
      } finally {
        setLoading(false);
      }
    }

    if (profile) void load();
  }, [hydrated, profile, router]);

  async function handleSave() {
    if (!editingSchedule) return;
    setSaving(true);
    setError('');
    try {
      await updateSchedule(editingSchedule.dayOfWeek, editingSchedule);
      setSchedules((prev) =>
        prev.map((s) => (s.id === editingSchedule.id ? editingSchedule : s))
      );
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar horário.');
    } finally {
      setSaving(false);
    }
  }

  function formatSchedule(s: Schedule) {
    if (s.openTime === '00:00' && s.closeTime === '00:00') {
      return 'Fechado';
    }
    if (!s.lunchStart || !s.lunchEnd || s.lunchStart === s.lunchEnd || (s.lunchStart === '00:00' && s.lunchEnd === '00:00')) {
      return `${s.openTime} - ${s.closeTime}`;
    }
    return `${s.openTime} - ${s.lunchStart}, ${s.lunchEnd} - ${s.closeTime}`;
  }

  if (!profile) return null;

  return (
    <main className="figma-screen">
      <section className="scheduling-main">
        <header className="scheduling-header">
          <button className="left icon-btn" onClick={() => router.back()}>
            <IconArrowLeft />
          </button>
          <h1 className="scheduling-title">Horários da Semana</h1>
        </header>

        <section className="services-list" style={{ marginTop: '16px' }}>
          {loading ? (
            <p className="helper-text">Carregando horários...</p>
          ) : (
            schedules.map((schedule) => (
              <article className="service-card" key={schedule.dayOfWeek}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  <p className="service-name">{DAYS_OF_WEEK[schedule.dayOfWeek]}</p>
                  <p className="helper-text" style={{ fontSize: '14px' }}>
                    {formatSchedule(schedule)}
                  </p>
                </div>

                <button
                  className="reserve-chip"
                  style={{ width: '32px' }}
                  onClick={() => {
                    setEditingSchedule(schedule);
                    setIsModalOpen(true);
                  }}
                >
                  <IconEdit className="icon-16" />
                </button>
              </article>
            ))
          )}

          {error && <p className="error-text">{error}</p>}
        </section>
      </section>

      {isModalOpen && editingSchedule && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-title-row">
              <h2 className="modal-title">{DAYS_OF_WEEK[editingSchedule.dayOfWeek]}</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                <IconX />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="helper-text">Abertura</label>
                  <input
                    type="time"
                    className="login-input"
                    style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                    value={editingSchedule.openTime}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, openTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="helper-text">Fechamento</label>
                  <input
                    type="time"
                    className="login-input"
                    style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                    value={editingSchedule.closeTime}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, closeTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="helper-text">Início Almoço</label>
                  <input
                    type="time"
                    className="login-input"
                    style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                    value={editingSchedule.lunchStart}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, lunchStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="helper-text">Fim Almoço</label>
                  <input
                    type="time"
                    className="login-input"
                    style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                    value={editingSchedule.lunchEnd}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, lunchEnd: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="primary-btn"
                  style={{ background: '#ff2e2e', color: '#ffffff' }}
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    setError('');
                    try {
                      const closedSchedule = {
                        ...editingSchedule,
                        openTime: '00:00',
                        closeTime: '00:00',
                        lunchStart: '00:00',
                        lunchEnd: '00:00',
                      };
                      await updateSchedule(editingSchedule.dayOfWeek, closedSchedule);
                      setSchedules((prev) =>
                        prev.map((s) => (s.id === editingSchedule.id ? closedSchedule : s))
                      );
                      setIsModalOpen(false);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Erro ao fechar dia.');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Fechar no dia
                </button>
                <button className="primary-btn" disabled={saving} onClick={handleSave}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
