/** Types of the customers API contract (same field names as the service). */

export type DocumentType = 'CC' | 'CE' | 'TI' | 'PASSPORT';
export type PatientStatus = 'ACTIVE' | 'CONTROL_OVERDUE' | 'INACTIVE';
export type LensType = 'MONOFOCAL' | 'BIFOCAL' | 'PROGRESSIVE' | 'OCCUPATIONAL';

export interface Patient {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string | null;
  eps: string;
  city: string | null;
  birthDate: string | null;
  status: PatientStatus;
  lastControlDate: string;
  createdAt: string;
}

export interface Eye {
  sphere: number | null;
  cylinder: number | null;
  axis: number | null;
  addition: number | null;
}

export interface Formula {
  id: string;
  patientId: string;
  od: Eye;
  oi: Eye;
  pupillaryDistance: number;
  lensType: LensType;
  optometristName: string;
  formulaDate: string;
  current: boolean;
  createdAt: string;
}

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'PASSPORT', label: 'Pasaporte' },
];

/** Closed EPS catalog; matches the service's own list exactly (Patient.java, EPS_OPTIONS). */
export const EPS_OPTIONS = ['Nueva EPS', 'EPS Sanitas', 'Pijaos Salud EPSI'] as const;

export const LENS_TYPES: { value: LensType; label: string }[] = [
  { value: 'MONOFOCAL', label: 'Monofocal' },
  { value: 'BIFOCAL', label: 'Bifocal' },
  { value: 'PROGRESSIVE', label: 'Progresivo' },
  { value: 'OCCUPATIONAL', label: 'Ocupacional' },
];

export const STATUS_LABEL: Record<PatientStatus, string> = {
  ACTIVE: 'Activo',
  CONTROL_OVERDUE: 'Control vencido',
  INACTIVE: 'Inactivo',
};

export function formatDate(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
