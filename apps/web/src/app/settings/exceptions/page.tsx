'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconTrash2, IconX } from '@/components/icons';
import { fetchExceptions, createException, deleteException, ScheduleException } from '@/lib/api';
import { getProfileSnapshot, subscribeProfile } from '@/lib/profile';

export default function ExceptionsPage() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => null);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newException, setNewException] = useState<Omit<ScheduleException, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    openTime: '08:00',
    closeTime: '18:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
  });

  useEffect(() => {
    if (hydrated && !profile) {
      router.replace('/login?next=/settings/exceptions');
      return;
    }

    async function load() {
      try {
        setExceptions(await fetchExceptions());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar exceções.');
      } finally {
        setLoading(false);
      }
    }

    if (profile) void load();
  }, [hydrated, profile, router]);

  async function handleAdd() {
    setSaving(true);
    setError('');
    try {
      const dateObj = new Date(newException.date + 'T00:00:00Z');
      const added = await createException({ ...newException, date: dateObj.toISOString() });
      setExceptions((prev) => [added, ...prev]);
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar exceção.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta exceção?')) return;
    try {
      await deleteException(id);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir exceção.');
    }
  }

  function formatSchedule(exc: ScheduleException) {
    if (exc.openTime === '00:00' && exc.closeTime === '00:00') {
      return 'Fechado';
    }
    if (!exc.lunchStart || !exc.lunchEnd || exc.lunchStart === exc.lunchEnd || (exc.lunchStart === '00:00' && exc.lunchEnd === '00:00')) {
      return `${exc.openTime} - ${exc.closeTime}`;
    }
    return `${exc.openTime} - ${exc.lunchStart}, ${exc.lunchEnd} - ${exc.closeTime}`;
  }

  if (!profile) return null;

  return (
    <main className="figma-screen">
      <section className="scheduling-main">
        <header className="scheduling-header">
          <button className="left icon-btn" onClick={() => router.back()}>
            <IconArrowLeft />
          </button>
          <h1 className="scheduling-title">Exceções</h1>
        </header>

        <section className="services-list" style={{ marginTop: '16px' }}>
          <button className="primary-btn" onClick={() => {
            setNewException({
              date: new Date().toISOString().split('T')[0],
              description: '',
              openTime: '08:00',
              closeTime: '18:00',
              lunchStart: '12:00',
              lunchEnd: '13:00',
            });
            setIsModalOpen(true);
          }}>
            Nova Exceção
          </button>

          {loading ? (
            <p className="helper-text">Carregando exceções...</p>
          ) : (
            exceptions.map((exc) => (
              <article className="service-card" key={exc.id}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  <p className="service-name">
                    {new Date(exc.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </p>
                  <p className="helper-text" style={{ fontSize: '14px' }}>
                    {formatSchedule(exc)}
                  </p>
                </div>

                <button
                  className="schedule-delete-chip"
                  style={{ width: '32px' }}
                  onClick={() => handleDelete(exc.id)}
                >
                  <IconTrash2 className="icon-16" />
                </button>
              </article>
            ))
          )}

          {!loading && exceptions.length === 0 && (
            <p className="helper-text" style={{ textAlign: 'center', marginTop: '32px' }}>
              Nenhuma exceção configurada.
            </p>
          )}

          {error && <p className="error-text">{error}</p>}
        </section>
      </section>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-title-row">
              <h2 className="modal-title">Nova Exceção</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                <IconX />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label className="helper-text">Data</label>
                <input
                  type="date"
                  className="login-input"
                  style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                  value={newException.date}
                  onChange={(e) => setNewException({ ...newException, date: e.target.value })}
                />
              </div>

              <div>
                <label className="helper-text">Descrição (ex: Feriado)</label>
                <input
                  type="text"
                  className="login-input"
                  placeholder="Descrição..."
                  style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                  value={newException.description}
                  onChange={(e) => setNewException({ ...newException, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="helper-text">Abertura</label>
                  <input
                    type="time"
                    className="login-input"
                    style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                    value={newException.openTime}
                    onChange={(e) => setNewException({ ...newException, openTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="helper-text">Fechamento</label>
                  <input
                    type="time"
                    className="login-input"
                    style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                    value={newException.closeTime}
                    onChange={(e) => setNewException({ ...newException, closeTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="helper-text">Início Almoço</label>
                  <input
                    type="time"
                    className="login-input"
                    style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                    value={newException.lunchStart}
                    onChange={(e) => setNewException({ ...newException, lunchStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="helper-text">Fim Almoço</label>
                  <input
                    type="time"
                    className="login-input"
                    style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                    value={newException.lunchEnd}
                    onChange={(e) => setNewException({ ...newException, lunchEnd: e.target.value })}
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
                      const dateObj = new Date(newException.date + 'T00:00:00Z');
                      const added = await createException({
                        ...newException,
                        date: dateObj.toISOString(),
                        openTime: '00:00',
                        closeTime: '00:00',
                        lunchStart: '00:00',
                        lunchEnd: '00:00',
                      });
                      setExceptions((prev) => [added, ...prev]);
                      setIsModalOpen(false);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Erro ao adicionar exceção.');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Fechar no dia
                </button>
                <button className="primary-btn" disabled={saving} onClick={handleAdd}>
                  {saving ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
