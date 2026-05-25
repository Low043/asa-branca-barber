'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { getProfileSnapshot, subscribeProfile } from '@/lib/profile';

export default function Home() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => null);

  useEffect(() => {
    if (hydrated) {
      if (profile) {
        router.replace('/services');
      } else {
        router.replace('/login');
      }
    }
  }, [hydrated, profile, router]);

  return (
    <main className="figma-screen login-screen">
      <p className="helper-text">Carregando...</p>
    </main>
  );
}
