import type { ApiClient, Page } from '../../shell-contract';
import type { DocumentType, Formula, Patient, PatientStatus } from '../model/patient';

/** The customers API through the container's client: the portal never builds its own. */
export interface PatientQuery {
  q?: string;
  status?: PatientStatus | '';
  page?: number;
  limit?: number;
}

export interface NewPatient {
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  eps: string;
  city: string | null;
  birthDate: string | null;
}

export interface ContactChange {
  phone: string;
  email: string | null;
  eps: string;
  city: string | null;
}

export function customersApi(api: ApiClient) {
  return {
    list: (query: PatientQuery, signal?: AbortSignal) =>
      api.get<Page<Patient>>('/api/v1/patients', {
        query: { q: query.q, status: query.status, page: query.page, limit: query.limit ?? 10 },
        ...(signal ? { signal } : {}),
      }),

    get: (id: string, signal?: AbortSignal) =>
      api.get<Patient>(`/api/v1/patients/${id}`, signal ? { signal } : {}),

    create: (body: NewPatient, idempotencyKey: string) =>
      api.post<{ id: string }>('/api/v1/patients', body, { idempotencyKey }),

    updateContact: (id: string, body: ContactChange) => api.put<Patient>(`/api/v1/patients/${id}/contact`, body),

    formulas: (id: string, page: number, signal?: AbortSignal) =>
      api.get<Page<Formula>>(`/api/v1/patients/${id}/formulas`, {
        query: { page, limit: 5 },
        ...(signal ? { signal } : {}),
      }),

    addFormula: (id: string, body: unknown, idempotencyKey: string) =>
      api.post<{ id: string }>(`/api/v1/patients/${id}/formulas`, body, { idempotencyKey }),
  };
}

export type CustomersApi = ReturnType<typeof customersApi>;
