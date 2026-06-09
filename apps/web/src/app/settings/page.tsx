'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';
import { IconLogout, IconMapPin, IconClock, IconCalendar, IconSettings } from '@/components/icons';
import { clearProfile, getProfileSnapshot, subscribeProfile } from '@/lib/profile';
import { subscribeNotifications } from '@/lib/api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      alert('Este navegador não suporta notificações de desktop.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          console.error('VAPID Public Key not found');
          return;
        }

        // Remove a inscrição antiga se existir (útil se as chaves VAPID tiverem mudado)
        let subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await subscribeNotifications(subscription);
        alert('Notificações ativadas com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
      alert('Ocorreu um erro ao ativar as notificações.');
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

          <button
            type="button"
            className="service-card"
            style={{ textAlign: 'left', border: 'none', cursor: 'pointer', width: '100%', background: 'white' }}
            onClick={requestNotificationPermission}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#ffb228', borderRadius: '8px', padding: '8px', color: '#ffffff' }}>
                <IconSettings className="icon-24" />
              </div>
              <div>
                <p className="service-name">Ativar Notificações</p>
              </div>
            </div>
          </button>
        </section>
      </section>
      <BottomNav active="settings" />
    </main>
  );
}
