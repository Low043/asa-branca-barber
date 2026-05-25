'use client';

import Image from 'next/image';
import { FormEvent, Suspense, useMemo, useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  formatPhoneInput,
  isNameLettersOnly,
  isValidPhone,
  MIN_NAME_LENGTH,
  normalizeName,
  normalizePhone,
  setProfile,
  getProfileSnapshot,
  subscribeProfile,
} from '@/lib/profile';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');

  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const redirectPath = useMemo(() => {
    if (!nextPath || !nextPath.startsWith('/')) return '/services';
    return nextPath;
  }, [nextPath]);

  useEffect(() => {
    if (hydrated && profile) {
      router.replace(redirectPath);
    }
  }, [hydrated, profile, router, redirectPath]);

  const canSubmit = name.trim().length > 0 && normalizePhone(phone).length > 0;

  if (hydrated && profile) {
    return (
      <main className="figma-screen login-screen">
        <p className="helper-text">Carregando...</p>
      </main>
    );
  }

  function getLoginError(inputName: string, inputPhone: string) {
    const compactName = normalizeName(inputName);
    if (compactName.length < MIN_NAME_LENGTH) {
      return `Nome muito curto. Use pelo menos ${MIN_NAME_LENGTH} letras.`;
    }
    if (!isNameLettersOnly(compactName)) {
      return 'Nome inválido. Use apenas letras.';
    }
    if (!isValidPhone(inputPhone)) return 'Telefone inválido. Use DD NNNNN-NNNN.';
    return null;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const profile = {
      name: name.trim(),
      phone: normalizePhone(phone),
    };

    const loginError = getLoginError(profile.name, profile.phone);
    if (loginError) {
      setError(loginError);
      return;
    }

    setProfile(profile);
    router.push(redirectPath);
  }

  return (
    <main className="figma-screen login-screen">
      <Image
        src="/logo.png"
        alt="Logo da Asa Branca Barbearia"
        className="login-logo"
        width={195}
        height={195}
        priority
      />

      <form className="login-form" onSubmit={onSubmit}>
        <input
          className="login-input"
          placeholder="Nome"
          value={name}
          onChange={(event) => {
            setError('');
            const onlyLetters = event.target.value.replace(/[^\p{L}\s]/gu, '');
            setName(onlyLetters.replace(/\s{2,}/g, ' ').slice(0, 25));
          }}
          maxLength={25}
          autoComplete="name"
        />
        <input
          className="login-input"
          placeholder="Telefone"
          value={phone}
          onChange={(event) => {
            setError('');
            setPhone(formatPhoneInput(event.target.value));
          }}
          inputMode="numeric"
          autoComplete="tel"
        />
        <button className="primary-btn" type="submit" disabled={!canSubmit}>
          Entrar
        </button>
        {error ? <p className="error-text login-error">{error}</p> : null}
      </form>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="figma-screen login-screen">
      <p className="helper-text">Carregando...</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
