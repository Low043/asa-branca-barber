export interface UserProfile {
  name: string;
  phone: string;
}

const PROFILE_KEY = 'barber.user-profile';
const PROFILE_EVENT = 'barber.user-profile-updated';
let cachedProfileRaw: string | null | undefined;
let cachedProfileSnapshot: UserProfile | null = null;

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

export function formatPhone(phone: string) {
  const digits = normalizePhone(phone);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

export function formatPhoneInput(phone: string) {
  const digits = normalizePhone(phone).slice(0, 11);

  if (digits.length <= 2) return digits;

  const ddd = digits.slice(0, 2);
  const local = digits.slice(2);

  if (digits.length <= 6) {
    return `${ddd} ${local}`;
  }

  if (digits.length <= 10) {
    return `${ddd} ${local.slice(0, 4)}-${local.slice(4)}`;
  }

  return `${ddd} ${local.slice(0, 5)}-${local.slice(5)}`;
}

export function isValidName(name: string) {
  const compactName = name.trim().replace(/\s+/g, ' ');
  return compactName.length >= 2 && /^[\p{L}]+(?:\s+[\p{L}]+)*$/u.test(compactName);
}

export function isValidPhone(phone: string) {
  const phoneLength = normalizePhone(phone).length;
  return phoneLength === 10 || phoneLength === 11;
}

export function isValidProfile(profile: UserProfile) {
  return isValidName(profile.name) && isValidPhone(profile.phone);
}

function parseProfileRaw(raw: string | null): UserProfile | null {
  if (!raw) return null;

  try {
    const profile = JSON.parse(raw) as UserProfile;
    if (!isValidProfile(profile)) return null;
    return {
      name: profile.name.trim(),
      phone: normalizePhone(profile.phone),
    };
  } catch {
    return null;
  }
}

export function getProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  return parseProfileRaw(window.localStorage.getItem(PROFILE_KEY));
}

export function getProfileSnapshot() {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (raw === cachedProfileRaw) {
    return cachedProfileSnapshot;
  }

  cachedProfileRaw = raw;
  cachedProfileSnapshot = parseProfileRaw(raw);
  return cachedProfileSnapshot;
}

export function subscribeProfile(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener(PROFILE_EVENT, handler);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(PROFILE_EVENT, handler);
  };
}

function notifyProfileChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

export function setProfile(profile: UserProfile) {
  if (typeof window === 'undefined') return;

  const normalized: UserProfile = {
    name: profile.name.trim(),
    phone: normalizePhone(profile.phone),
  };

  const raw = JSON.stringify(normalized);
  window.localStorage.setItem(PROFILE_KEY, raw);
  cachedProfileRaw = raw;
  cachedProfileSnapshot = normalized;
  notifyProfileChanged();
}

export function clearProfile() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PROFILE_KEY);
  cachedProfileRaw = null;
  cachedProfileSnapshot = null;
  notifyProfileChanged();
}
