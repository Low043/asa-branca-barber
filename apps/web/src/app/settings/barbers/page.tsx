'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconEdit, IconX } from '@/components/icons';
import {
  fetchBarbers,
  createBarber,
  updateBarber,
  deleteBarber,
  Barber,
  ApiError,
} from '@/lib/api';
import {
  formatPhone,
  getProfileSnapshot,
  subscribeProfile,
  isValidName,
  normalizeName,
  normalizePhone,
  formatPhoneInput,
  isValidPhone,
} from '@/lib/profile';

const ADMIN_NAME = 'thales';

export default function BarbersPage() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const isAdmin = profile?.name?.toLowerCase() === ADMIN_NAME;
  const isEditMode = editingPhone !== null;

  useEffect(() => {
    if (hydrated && !profile) {
      router.replace('/login?next=/settings/barbers');
      return;
    }
    if (hydrated && profile && !isAdmin) {
      router.replace('/settings');
      return;
    }

    async function load() {
      try {
        setBarbers(await fetchBarbers());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar barbeiros.');
      } finally {
        setLoading(false);
      }
    }

    if (profile && isAdmin) void load();
    else setLoading(false);
  }, [hydrated, profile, isAdmin, router]);

  function openCreateModal() {
    setEditingPhone(null);
    setName('');
    setPhone('');
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(barber: Barber) {
    setEditingPhone(barber.phone);
    setName(barber.name);
    setPhone(barber.phone);
    setError('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingPhone(null);
    setName('');
    setPhone('');
    setError('');
  }

  async function handleSubmit() {
    setError('');

    if (!isValidName(name)) {
      setError('Informe um nome válido (mín. 5 letras, apenas letras).');
      return;
    }

    if (isEditMode) {
      setSaving(true);
      try {
        const updated = await updateBarber(editingPhone, { name: normalizeName(name) });
        setBarbers((prev) =>
          prev
            .map((b) => (b.phone === updated.phone ? updated : b))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        closeModal();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar barbeiro.');
      } finally {
        setSaving(false);
      }
      return;
    }

    const digits = normalizePhone(phone);
    if (!isValidPhone(digits)) {
      setError('Informe um telefone válido com DDD (10 ou 11 dígitos).');
      return;
    }

    setSaving(true);
    try {
      const created = await createBarber({ name: normalizeName(name), phone: digits });
      setBarbers((prev) => [created, ...prev.filter((b) => b.phone !== created.phone)]);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar barbeiro.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingPhone) return;
    if (!confirm('Tem certeza que deseja excluir este barbeiro?')) return;

    setDeleting(true);
    setError('');
    try {
      await deleteBarber(editingPhone);
      setBarbers((prev) => prev.filter((b) => b.phone !== editingPhone));
      closeModal();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Erro ao excluir barbeiro.',
      );
    } finally {
      setDeleting(false);
    }
  }

  if (!profile || !isAdmin) return null;

  return (
    <main className="figma-screen">
      <section className="scheduling-main">
        <header className="scheduling-header">
          <button className="left icon-btn" onClick={() => router.back()}>
            <IconArrowLeft />
          </button>
          <h1 className="scheduling-title">Barbeiros</h1>
        </header>

        <section className="services-list" style={{ marginTop: '16px' }}>
          <button className="primary-btn" onClick={openCreateModal}>
            Novo Barbeiro
          </button>

          {loading ? (
            <p className="helper-text">Carregando barbeiros...</p>
          ) : (
            barbers.map((b) => (
              <article className="service-card" key={b.phone}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0px',
                  }}
                >
                  <p className="service-name">{b.name}</p>
                  <p className="helper-text" style={{ fontSize: '14px' }}>
                    {formatPhone(b.phone)}
                  </p>
                </div>

                {b.phone !== profile.phone && (
                  <button
                    className="reserve-chip"
                    style={{ width: '32px' }}
                    onClick={() => openEditModal(b)}
                    aria-label="Editar barbeiro"
                  >
                    <IconEdit className="icon-16" />
                  </button>
                )}
              </article>
            ))
          )}

          {!loading && barbers.length === 0 && (
            <p className="helper-text" style={{ textAlign: 'center', marginTop: '32px' }}>
              Nenhum barbeiro cadastrado.
            </p>
          )}

          {error && !isModalOpen && <p className="error-text">{error}</p>}
        </section>
      </section>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-title-row">
              <h2 className="modal-title">
                {isEditMode ? 'Editar Barbeiro' : 'Novo Barbeiro'}
              </h2>
              <button className="icon-btn" onClick={closeModal}>
                <IconX />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label className="helper-text">Nome</label>
                <input
                  type="text"
                  className="login-input"
                  placeholder="Nome completo"
                  style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="helper-text">Telefone (com DDD)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  className="login-input"
                  placeholder="(84) 99999-9999"
                  style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                  value={phone ? formatPhoneInput(phone) : ''}
                  onChange={(e) => setPhone(normalizePhone(e.target.value).slice(0, 11))}
                  disabled={isEditMode}
                />
              </div>

              {error && <p className="error-text">{error}</p>}

              <button
                className="primary-btn"
                style={{ marginTop: '8px' }}
                disabled={saving || !name}
                onClick={() => void handleSubmit()}
              >
                {saving
                  ? isEditMode
                    ? 'Salvando...'
                    : 'Cadastrando...'
                  : isEditMode
                    ? 'Salvar Edição'
                    : 'Cadastrar'}
              </button>

              {isEditMode && (
                <button
                  type="button"
                  className="primary-btn"
                  style={{ background: '#ff2e2e', color: '#ffffff' }}
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                >
                  {deleting ? 'Excluindo...' : 'Apagar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
