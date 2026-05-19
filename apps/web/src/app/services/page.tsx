'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { IconCalendar, IconClock, IconCreditCard, IconLogout, IconMapPin } from '@/components/icons';
import { fetchServices, Service } from '@/lib/api';
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
              <p className="service-name">{service.name}</p>

              <div className="service-meta-row">
                <IconClock className="icon-14" />
                <span>{service.durationMinutes} min</span>
              </div>

              <div className="service-meta-row">
                <IconCreditCard className="icon-14" />
                <span>{moneyFormatter.format(service.priceCents / 100)}</span>
              </div>

              <button className="reserve-chip" type="button" onClick={() => reserve(service.id)}>
                <IconCalendar className="icon-14" />
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
    </main>
  );
}
