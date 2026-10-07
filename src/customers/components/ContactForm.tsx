import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { ShellContext } from '../../shell-contract';
import { customersApi } from '../api/customersApi';
import type { Patient } from '../model/patient';
import { validateContact } from '../model/validation';
import { EpsCityFields } from './EpsCityFields';
import { focusFirstInvalid, visibleErrors } from './forms';

/** Updates the contact data of a patient. The document never changes. */
export function ContactForm({ shell, patient, onSaved }: { shell: ShellContext; patient: Patient; onSaved: () => void }): ReactNode {
  const { ui } = shell;
  const api = useMemo(() => customersApi(shell.api), [shell.api]);
  const [draft, setDraft] = useState({
    phone: patient.phone,
    email: patient.email ?? '',
    eps: patient.eps,
    city: patient.city ?? '',
  });
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const errors = visibleErrors(validateContact(draft), serverErrors, attempted);

  const set = (key: keyof typeof draft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAttempted(true);
    focusFirstInvalid(event);
    if (pending || Object.keys(validateContact(draft)).length > 0) {
      return;
    }
    setPending(true);
    setFailure(null);
    setServerErrors({});
    try {
      await api.updateContact(patient.id, {
        phone: draft.phone.trim(),
        email: draft.email.trim() || null,
        eps: draft.eps.trim(),
        city: draft.city.trim() || null,
      });
      shell.notify('Datos de contacto actualizados', 'success');
      onSaved();
    } catch (error) {
      const info = (error as { info?: { userMessage: string; details: { field: string; message: string }[] } }).info;
      setServerErrors(Object.fromEntries((info?.details ?? []).map((d) => [d.field, d.message])));
      setFailure(info?.userMessage ?? 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate aria-label="Datos de contacto">
      {failure && Object.keys(serverErrors).length === 0 ? <ui.Banner kind="error">{failure}</ui.Banner> : null}
      <div className="grid-2">
        <ui.TextField id="contact-phone" label="Teléfono" required type="tel" inputMode="tel" value={draft.phone}
          onChange={set('phone')} error={errors.phone} maxLength={16} />
        <ui.TextField id="contact-email" label="Correo electrónico" type="email" value={draft.email}
          onChange={set('email')} error={errors.email} maxLength={160} />
        <EpsCityFields shell={shell} eps={draft.eps} city={draft.city} onEpsChange={set('eps')} onCityChange={set('city')}
          epsError={errors.eps} cityError={errors.city} />
      </div>
      <div className="actions">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
