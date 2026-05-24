'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';
import { IconLogout, IconMapPin, IconClock, IconCalendar } from '@/components/icons';
import { clearProfile, getProfileSnapshot, subscribeProfile } from '@/lib/profile';

export default function SettingsPage() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => null);

  useEffect(() => {
    if (hydrated && !profile) {
      router.replace('/login?next=/settings');
    }
  }, [hydrated, profile, router]);

  const firstName = useMemo(() => profile?.name ?? '\u00A0', [profile?.name]);

  if (!profile) return null;

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
          <h2 className="section-title">Configurações</h2>
          
          <Link href="/settings/schedules" className="service-card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#ffb228', borderRadius: '8px', padding: '8px', color: '#ffffff' }}>
                <IconClock className="icon-24" />
              </div>
              <div>
                <p className="service-name">Horários de Funcionamento</p>
              </div>
            </div>
          </Link>

          <Link href="/settings/exceptions" className="service-card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#ffb228', borderRadius: '8px', padding: '8px', color: '#ffffff' }}>
                <IconCalendar className="icon-24" />
              </div>
              <div>
                <p className="service-name">Exceções</p>
              </div>
            </div>
          </Link>
        </section>
      </section>
      <BottomNav active="settings" />
    </main>
  );
}
