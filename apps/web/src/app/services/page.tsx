'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import {
  IconCalendar,
  IconClock,
  IconCreditCard,
  IconLogout,
  IconMapPin,
  IconEdit,
  IconX,
} from '@/components/icons';
import { fetchServices, Service, updateService, deleteService } from '@/lib/api';
import { clearProfile, getProfileSnapshot, subscribeProfile } from '@/lib/profile';

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function ServicesPage() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => null);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [priceReais, setPriceReais] = useState('');

  useEffect(() => {
    if (!hydrated) return;

    if (!profile) {
      router.replace('/login?next=/services');
      return;
    }

    async function loadServices() {
      try {
        setServices(await fetchServices());
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Erro ao carregar serviços.');
      }
    }

    void loadServices();
  }, [hydrated, profile, router]);

  const firstName = useMemo(() => profile?.name ?? '\u00A0', [profile?.name]);

  function reserve(serviceId: string) {
    router.push(`/scheduling?serviceId=${serviceId}`);
  }

  function handleEdit(service: Service) {
    setEditingService(service);
    setPriceReais((service.priceCents / 100).toFixed(2).replace('.', ','));
    setIsModalOpen(true);
  }

  async function onSave() {
    if (!editingService) return;
    setSaving(true);
    setError('');
    try {
      const priceCents = Math.round(parseFloat(priceReais.replace(',', '.')) * 100);
      const updated = await updateService(editingService.id, {
        name: editingService.name,
        durationMinutes: editingService.durationMinutes,
        priceCents,
      });
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar serviço.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!editingService) return;
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    setSaving(true);
    try {
      await deleteService(editingService.id);
      setServices((prev) => prev.filter((s) => s.id !== editingService.id));
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir serviço.');
    } finally {
      setSaving(false);
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

        <section className="services-list">
          <h2 className="section-title">Selecione o serviço</h2>

          {services.map((service) => (
            <article className="service-card" key={service.id}>
              <button
                className="icon-btn"
                style={{ position: 'absolute', top: '8px', right: '8px', color: '#757575' }}
                onClick={() => handleEdit(service)}
              >
                <IconEdit className="icon-20" />
              </button>

              <p className="service-name">{service.name}</p>

              <div className="service-meta-row">
                <IconClock className="service-meta-icon icon-16" />
                <span>{service.durationMinutes} min</span>
              </div>

              <div className="service-meta-row">
                <IconCreditCard className="service-meta-icon icon-16" />
                <span>{moneyFormatter.format(service.priceCents / 100)}</span>
              </div>

              <button className="reserve-chip" type="button" onClick={() => reserve(service.id)}>
                <IconCalendar className="service-meta-icon icon-14" />
                Reservar
              </button>
            </article>
          ))}

          {services.length === 0 && !error ? (
            <p className="helper-text">Nenhum serviço disponível no momento.</p>
          ) : null}

          {error ? <p className="error-text">{error}</p> : null}
        </section>
      </section>
      <BottomNav active="services" />

      {isModalOpen && editingService && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-title-row">
              <h2 className="modal-title">Editar Serviço</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                <IconX />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label className="helper-text">Nome do Serviço</label>
                <input
                  type="text"
                  className="login-input"
                  style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="helper-text">Valor (R$)</label>
                  <input
                    type="text"
                    className="login-input"
                    style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                    value={priceReais}
                    onChange={(e) => setPriceReais(e.target.value)}
                  />
                </div>
                <div>
                  <label className="helper-text">Duração (min)</label>
                  <input
                    type="number"
                    className="login-input"
                    style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                    value={editingService.durationMinutes}
                    onChange={(e) =>
                      setEditingService({ ...editingService, durationMinutes: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="primary-btn"
                  style={{ background: '#ff2e2e', color: '#ffffff' }}
                  disabled={saving}
                  onClick={onDelete}
                >
                  Excluir Serviço
                </button>
                <button className="primary-btn" disabled={saving} onClick={onSave}>
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
