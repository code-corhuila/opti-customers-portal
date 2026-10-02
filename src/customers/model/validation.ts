import type { DocumentType, LensType } from './patient';

/**
 * Field rules, the same ones the service enforces (the service is still the authority: what is
 * checked here only saves a round trip and points at the field). Each function returns the errors
 * by field name; an empty object means the data is valid.
 */
export type Errors = Record<string, string>;

const DOCUMENT_NUMBER = /^[A-Za-z0-9]{5,20}$/;
const PHONE = /^\+?[0-9]{7,15}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

export interface PatientDraft {
  documentType: DocumentType | '';
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  eps: string;
  city: string;
  birthDate: string;
}

export const EMPTY_PATIENT: PatientDraft = {
  documentType: 'CC',
  documentNumber: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  eps: '',
  city: '',
  birthDate: '',
};

function length(value: string, min: number, max: number): boolean {
  const size = value.trim().length;
  return size >= min && size <= max;
}

export function validateContact(draft: Pick<PatientDraft, 'phone' | 'email' | 'eps' | 'city'>): Errors {
  const errors: Errors = {};
  if (!PHONE.test(draft.phone.trim())) {
    errors.phone = 'Debe tener de 7 a 15 dígitos, con + opcional al inicio';
  }
  if (draft.email.trim() && (draft.email.trim().length > 160 || !EMAIL.test(draft.email.trim()))) {
    errors.email = 'Escribe un correo válido';
  }
  if (!length(draft.eps, 2, 80)) {
    errors.eps = 'La EPS es obligatoria (2 a 80 caracteres)';
  }
  if (draft.city.trim() && draft.city.trim().length > 80) {
    errors.city = 'Máximo 80 caracteres';
  }
  return errors;
}

export function validatePatient(draft: PatientDraft, today: Date = new Date()): Errors {
  const errors = validateContact(draft);
  if (!draft.documentType) {
    errors.documentType = 'Elige el tipo de documento';
  }
  if (!DOCUMENT_NUMBER.test(draft.documentNumber.trim())) {
    errors.documentNumber = 'Debe tener de 5 a 20 letras o números, sin espacios';
  }
  if (!length(draft.firstName, 2, 100)) {
    errors.firstName = 'Los nombres son obligatorios (2 a 100 caracteres)';
  }
  if (!length(draft.lastName, 2, 100)) {
    errors.lastName = 'Los apellidos son obligatorios (2 a 100 caracteres)';
  }
  if (draft.birthDate) {
    const birth = new Date(`${draft.birthDate}T00:00:00`);
    const oldest = new Date(today);
    oldest.setFullYear(oldest.getFullYear() - 120);
    if (Number.isNaN(birth.getTime())) {
      errors.birthDate = 'Fecha no válida';
    } else if (birth > today) {
      errors.birthDate = 'No puede ser una fecha futura';
    } else if (birth < oldest) {
      errors.birthDate = 'No es una fecha plausible';
    }
  }
  return errors;
}

export interface EyeDraft {
  sphere: string;
  cylinder: string;
  axis: string;
  addition: string;
}

export interface FormulaDraft {
  od: EyeDraft;
  oi: EyeDraft;
  pupillaryDistance: string;
  lensType: LensType | '';
  optometristName: string;
  formulaDate: string;
}

export const EMPTY_EYE: EyeDraft = { sphere: '', cylinder: '', axis: '', addition: '' };

/** Reads a decimal typed by a person ("-1,25" or "-1.25"). Returns NaN when it is not a number. */
export function parseDecimal(text: string): number {
  const cleaned = text.trim().replace(',', '.');
  return cleaned === '' || !/^[+-]?\d+(\.\d+)?$/.test(cleaned) ? Number.NaN : Number(cleaned);
}

function validateDiopters(text: string, label: string, min: number, max: number): string | undefined {
  if (text.trim() === '') {
    return undefined;
  }
  const value = parseDecimal(text);
  if (Number.isNaN(value)) {
    return `${label}: escribe un número`;
  }
  if (value < min || value > max) {
    return `${label}: entre ${min} y ${max}`;
  }
  if ((value * 4) % 1 !== 0) {
    return `${label}: en pasos de 0,25`;
  }
  return undefined;
}

function validateEye(prefix: 'od' | 'oi', eye: EyeDraft, errors: Errors): void {
  const checks: [keyof EyeDraft, string | undefined][] = [
    ['sphere', validateDiopters(eye.sphere, 'Esfera', -20, 20)],
    ['cylinder', validateDiopters(eye.cylinder, 'Cilindro', -10, 10)],
    ['addition', validateDiopters(eye.addition, 'Adición', 0, 4)],
  ];
  for (const [field, message] of checks) {
    if (message) {
      errors[`${prefix}.${field}`] = message;
    }
  }
  const cylinder = parseDecimal(eye.cylinder);
  const hasCylinder = !Number.isNaN(cylinder) && cylinder !== 0;
  if (eye.axis.trim() === '') {
    if (hasCylinder) {
      errors[`${prefix}.axis`] = 'El eje es obligatorio cuando hay cilindro';
    }
    return;
  }
  const axis = Number(eye.axis);
  if (!Number.isInteger(axis) || axis < 0 || axis > 180) {
    errors[`${prefix}.axis`] = 'Eje: número entero entre 0 y 180';
  }
}

export function validateFormula(draft: FormulaDraft, today: Date = new Date()): Errors {
  const errors: Errors = {};
  validateEye('od', draft.od, errors);
  validateEye('oi', draft.oi, errors);
  const distance = parseDecimal(draft.pupillaryDistance);
  if (Number.isNaN(distance) || distance < 40 || distance > 80) {
    errors.pupillaryDistance = 'Distancia pupilar entre 40 y 80 mm';
  }
  if (!draft.lensType) {
    errors.lensType = 'Elige el tipo de lente';
  }
  if (!length(draft.optometristName, 3, 150)) {
    errors.optometristName = 'Escribe el nombre del optómetra (3 a 150 caracteres)';
  }
  if (!draft.formulaDate) {
    errors.formulaDate = 'La fecha es obligatoria';
  } else if (new Date(`${draft.formulaDate}T00:00:00`) > today) {
    errors.formulaDate = 'No puede ser una fecha futura';
  }
  return errors;
}

/** Converts a valid eye draft to the API shape: empty text becomes null. */
export function eyeToRequest(eye: EyeDraft): Record<string, number | null> {
  const number = (text: string): number | null => (text.trim() === '' ? null : parseDecimal(text));
  return {
    sphere: number(eye.sphere),
    cylinder: number(eye.cylinder),
    axis: eye.axis.trim() === '' ? null : Number(eye.axis),
    addition: number(eye.addition),
  };
}
