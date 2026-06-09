import { getProfileSnapshot, UserProfile } from './profile';

export interface Service {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
  isActive: boolean;
  barberPhone: string;
  barber?: {
    name: string;
  };
}

export interface Schedule {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  lunchStart: string;
  lunchEnd: string;
  barberPhone: string;
}

export interface ScheduleException {
  id: string;
  date: string;
  description: string;
  openTime: string;
  closeTime: string;
  lunchStart: string;
  lunchEnd: string;
  barberPhone: string;
}

export interface Meeting {
  id: string;
  date: string;
  clientName: string;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  userPhone: string;
  serviceId: string;
}

export interface CreateMeetingPayload {
  date: string;
  clientName: string;
  userPhone: string;
  serviceId: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

const API_PREFIX = '/api';
const SERVICES_REVALIDATE_SECONDS = 300;

type RequestConfig = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

async function parseErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };

    if (Array.isArray(data.message)) return data.message.join(', ');
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
  } catch {
    // no-op: fallback message below
  }

  return 'Não foi possível concluir esta ação.';
}

async function request<T>(path: string, init?: RequestConfig): Promise<T> {
  const profile = getProfileSnapshot();
  const requestInit: RequestConfig = {
    ...init,
    cache: init?.cache ?? 'no-store',
    headers: {
      ...(init?.headers ?? {}),
      'Content-Type': 'application/json',
      ...(profile ? { 'x-user-phone': profile.phone } : {}),
    },
  };

  const response = await fetch(`${API_PREFIX}${path}`, requestInit);

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function login(dto: { name: string; phone: string }) {
  return request<UserProfile>('/users/login', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function fetchServices() {
  return request<Service[]>('/services');
}

export async function updateService(id: string, dto: Partial<Service>) {
  return request<Service>(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function createService(
  dto: Omit<Service, 'id' | 'isActive' | 'barberPhone'>,
) {
  return request<Service>('/services', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function deleteService(id: string) {
  return request<void>(`/services/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchAvailableTimes(date: string, serviceId?: string) {
  const query = serviceId ? `?serviceId=${serviceId}` : '';
  return request<string[]>(`/schedules/${date}${query}`);
}

export async function createMeeting(payload: CreateMeetingPayload) {
  return request<Meeting>('/meetings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMeetingsByPhone(phone: string) {
  return request<Meeting[]>(`/meetings/${encodeURIComponent(phone)}`);
}

export async function fetchAllMeetings() {
  return request<Meeting[]>('/meetings');
}

export async function cancelMeeting(meetingId: string) {
  return request<Meeting>(`/meetings/${meetingId}`, {
    method: 'DELETE',
  });
}

export async function fetchSchedules() {
  return request<Schedule[]>('/schedules');
}

export async function updateSchedule(dayOfWeek: number, dto: Partial<Schedule>) {
  return request<Schedule>(`/schedules/${dayOfWeek}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function fetchExceptions() {
  return request<ScheduleException[]>('/schedules/exceptions');
}

export async function createException(
  dto: Omit<ScheduleException, 'id' | 'barberPhone'>,
) {
  return request<ScheduleException>('/schedules/exceptions', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function deleteException(id: string) {
  return request<void>(`/schedules/exceptions/${id}`, {
    method: 'DELETE',
  });
}

export async function subscribeNotifications(subscription: PushSubscription) {
  return request<void>('/notifications/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
}
