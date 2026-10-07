import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { ShellContext } from '../../shell-contract';
import { customersApi, type NewPatient } from '../api/customersApi';
import { DOCUMENT_TYPES, type DocumentType } from '../model/patient';
import { EMPTY_PATIENT, validatePatient, type PatientDraft } from '../model/validation';
import { EpsCityFields } from './EpsCityFields';
import { focusFirstInvalid, visibleErrors } from './forms';

const PERSONAL_ICON = (
  <>
    <circle cx="10" cy="7" r="3" />
    <path d="M4 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
  </>
);

const CONTACT_ICON = (
  <path d="M5 3.5h2.2l1 3.5-1.6 1.3a9 9 0 0 0 4.1 4.1l1.3-1.6 3.5 1v2.2a1.5 1.5 0 0 1-1.6 1.5A12.5 12.5 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5Z" />
);

const ADDITIONAL_ICON = (
  <>
    <path d="M10 17.5s5.5-4.3 5.5-8.8A5.5 5.5 0 0 0 10 3.2a5.5 5.5 0 0 0-5.5 5.5c0 4.5 5.5 8.8 5.5 8.8Z" />
    <circle cx="10" cy="8.7" r="1.8" />
  </>
);

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
      <section className="card">
        <ui.SectionHeading icon={PERSONAL_ICON} tone="primary" title="Información personal"
          description="Datos básicos de identificación del paciente." />
        <div className="grid-2">
          <ui.SelectField id="documentType" label="Tipo de documento" required value={draft.documentType}
            onChange={(v) => set('documentType')(v as DocumentType)} options={DOCUMENT_TYPES} error={errors.documentType} />
          <ui.TextField id="documentNumber" label="Número de documento" required value={draft.documentNumber}
            onChange={set('documentNumber')} error={errors.documentNumber} maxLength={20} autoComplete="off" />
          <ui.TextField id="firstName" label="Nombres" required value={draft.firstName} onChange={set('firstName')}
            error={errors.firstName} maxLength={100} autoComplete="given-name" hint="Solo letras" />
          <ui.TextField id="lastName" label="Apellidos" required value={draft.lastName} onChange={set('lastName')}
            error={errors.lastName} maxLength={100} autoComplete="family-name" hint="Solo letras" />
          <ui.TextField id="birthDate" label="Fecha de nacimiento" type="date" value={draft.birthDate}
            onChange={set('birthDate')} error={errors.birthDate} />
        </div>
      </section>
      <section className="card">
        <ui.SectionHeading icon={CONTACT_ICON} tone="success" title="Información de contacto"
          description="Datos para facilitar la comunicación con el paciente." />
        <div className="grid-2">
          <ui.TextField id="phone" label="Teléfono" required type="tel" inputMode="tel" value={draft.phone}
            onChange={set('phone')} error={errors.phone} maxLength={16} hint="Solo dígitos, con + opcional" autoComplete="tel" />
          <ui.TextField id="email" label="Correo electrónico" type="email" inputMode="email" value={draft.email}
            onChange={set('email')} error={errors.email} maxLength={160} autoComplete="email" />
        </div>
      </section>
      <section className="card">
        <ui.SectionHeading icon={ADDITIONAL_ICON} tone="info" title="Información adicional"
          description="Datos complementarios para su historial clínico." />
        <div className="grid-2">
          <EpsCityFields shell={shell} eps={draft.eps} city={draft.city} onEpsChange={set('eps')} onCityChange={set('city')}
            epsError={errors.eps} cityError={errors.city} />
        </div>
      </section>
      <div className="actions">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Guardando…' : 'Registrar paciente'}
        </button>
      </div>
    </form>
  );
}
