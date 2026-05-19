export interface Service {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
  isActive: boolean;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      ...(init?.headers ?? {}),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function fetchServices() {
  return request<Service[]>('/services');
}

export async function fetchAvailableTimes(date: string) {
  return request<string[]>(`/schedules/${date}`);
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

export async function cancelMeeting(meetingId: string) {
  return request<Meeting>(`/meetings/${meetingId}`, {
    method: 'DELETE',
  });
}
