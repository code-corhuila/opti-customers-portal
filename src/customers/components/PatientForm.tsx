import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { ShellContext } from '../../shell-contract';
import { customersApi, type NewPatient } from '../api/customersApi';
import { DOCUMENT_TYPES, type DocumentType } from '../model/patient';
import { EMPTY_PATIENT, validatePatient, type PatientDraft } from '../model/validation';
import { focusFirstInvalid, visibleErrors } from './forms';

function toRequest(draft: PatientDraft): NewPatient {
  return {
    documentType: draft.documentType as DocumentType,
    documentNumber: draft.documentNumber.trim(),
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim() || null,
    eps: draft.eps.trim(),
    city: draft.city.trim() || null,
    birthDate: draft.birthDate || null,
  };
}

/** Registers a patient (HU-01). Errors appear next to each field; the button is off while sending. */
export function PatientForm({ shell, onCreated }: { shell: ShellContext; onCreated: (id: string) => void }): ReactNode {
  const { ui } = shell;
  const api = useMemo(() => customersApi(shell.api), [shell.api]);
  const [draft, setDraft] = useState<PatientDraft>(EMPTY_PATIENT);
  const [attempted, setAttempted] = useState(false);
  const clientErrors = validatePatient(draft);
  const { submit, pending, error, fieldErrors } = ui.useSubmit((key) => api.create(toRequest(draft), key), JSON.stringify(draft));
  const errors = visibleErrors(clientErrors, fieldErrors, attempted);

  const set = <K extends keyof PatientDraft>(key: K) => (value: PatientDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAttempted(true);
    focusFirstInvalid(event);
    if (Object.keys(clientErrors).length > 0) {
      return;
    }
    const created = await submit();
    if (created) {
      shell.notify('Paciente registrado', 'success');
      onCreated(created.id);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate aria-label="Nuevo paciente">
      {error && Object.keys(fieldErrors).length === 0 ? (
        <ui.Banner kind="error" title="No se pudo registrar el paciente">
          {error.userMessage}
        </ui.Banner>
      ) : null}
      <div className="grid-2">
        <ui.SelectField id="documentType" label="Tipo de documento" required value={draft.documentType}
          onChange={(v) => set('documentType')(v as DocumentType)} options={DOCUMENT_TYPES} error={errors.documentType} />
        <ui.TextField id="documentNumber" label="Número de documento" required value={draft.documentNumber}
          onChange={set('documentNumber')} error={errors.documentNumber} maxLength={20} autoComplete="off" />
        <ui.TextField id="firstName" label="Nombres" required value={draft.firstName} onChange={set('firstName')}
          error={errors.firstName} maxLength={100} autoComplete="given-name" />
        <ui.TextField id="lastName" label="Apellidos" required value={draft.lastName} onChange={set('lastName')}
          error={errors.lastName} maxLength={100} autoComplete="family-name" />
        <ui.TextField id="phone" label="Teléfono" required type="tel" inputMode="tel" value={draft.phone}
          onChange={set('phone')} error={errors.phone} maxLength={16} hint="Solo dígitos, con + opcional" autoComplete="tel" />
        <ui.TextField id="email" label="Correo electrónico" type="email" inputMode="email" value={draft.email}
          onChange={set('email')} error={errors.email} maxLength={160} autoComplete="email" />
        <ui.TextField id="eps" label="EPS" required value={draft.eps} onChange={set('eps')} error={errors.eps} maxLength={80} />
        <ui.TextField id="city" label="Ciudad" value={draft.city} onChange={set('city')} error={errors.city} maxLength={80} />
        <ui.TextField id="birthDate" label="Fecha de nacimiento" type="date" value={draft.birthDate}
          onChange={set('birthDate')} error={errors.birthDate} />
      </div>
      <div className="actions">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Guardando…' : 'Registrar paciente'}
        </button>
      </div>
    </form>
  );
}
