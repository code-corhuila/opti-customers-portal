import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { ShellContext } from '../../shell-contract';
import { customersApi } from '../api/customersApi';
import { LENS_TYPES, type LensType } from '../model/patient';
import {
  EMPTY_EYE,
  eyeToRequest,
  parseDecimal,
  validateFormula,
  type EyeDraft,
  type FormulaDraft,
} from '../model/validation';
import { focusFirstInvalid, visibleErrors } from './forms';

function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function EyeFields({ shell, prefix, title, eye, onChange, errors }: {
  shell: ShellContext;
  prefix: 'od' | 'oi';
  title: string;
  eye: EyeDraft;
  onChange: (eye: EyeDraft) => void;
  errors: Record<string, string>;
}): ReactNode {
  const { ui } = shell;
  const set = (key: keyof EyeDraft) => (value: string) => onChange({ ...eye, [key]: value });
  return (
    <fieldset className="card">
      <legend>{title}</legend>
      <div className="grid-2">
        <ui.TextField id={`${prefix}-sphere`} label="Esfera" inputMode="decimal" value={eye.sphere} onChange={set('sphere')}
          error={errors[`${prefix}.sphere`]} maxLength={6} hint="-20 a 20, pasos de 0,25" />
        <ui.TextField id={`${prefix}-cylinder`} label="Cilindro" inputMode="decimal" value={eye.cylinder} onChange={set('cylinder')}
          error={errors[`${prefix}.cylinder`]} maxLength={6} />
        <ui.TextField id={`${prefix}-axis`} label="Eje" inputMode="numeric" value={eye.axis} onChange={set('axis')}
          error={errors[`${prefix}.axis`]} maxLength={3} hint="0 a 180; obligatorio con cilindro" />
        <ui.TextField id={`${prefix}-addition`} label="Adición" inputMode="decimal" value={eye.addition} onChange={set('addition')}
          error={errors[`${prefix}.addition`]} maxLength={5} />
      </div>
    </fieldset>
  );
}

/** Registers an optical formula (HU-02): the new one becomes the current one and supersedes the previous. */
export function FormulaForm({ shell, patientId, onSaved, onCancel }: {
  shell: ShellContext;
  patientId: string;
  onSaved: () => void;
  onCancel: () => void;
}): ReactNode {
  const { ui } = shell;
  const api = useMemo(() => customersApi(shell.api), [shell.api]);
  const [draft, setDraft] = useState<FormulaDraft>({
    od: EMPTY_EYE,
    oi: EMPTY_EYE,
    pupillaryDistance: '',
    lensType: '',
    optometristName: shell.user.role === 'OPTOMETRIST' ? shell.user.fullName : '',
    formulaDate: today(),
  });
  const [attempted, setAttempted] = useState(false);
  const clientErrors = validateFormula(draft);
  const request = () => ({
    od: eyeToRequest(draft.od),
    oi: eyeToRequest(draft.oi),
    pupillaryDistance: parseDecimal(draft.pupillaryDistance),
    lensType: draft.lensType,
    optometristName: draft.optometristName.trim(),
    formulaDate: draft.formulaDate,
  });
  const { submit, pending, error, fieldErrors } = ui.useSubmit((key) => api.addFormula(patientId, request(), key), JSON.stringify(draft));
  const errors = visibleErrors(clientErrors, fieldErrors, attempted);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAttempted(true);
    focusFirstInvalid(event);
    if (Object.keys(clientErrors).length > 0) {
      return;
    }
    if (await submit()) {
      shell.notify('Fórmula registrada: es la vigente del paciente', 'success');
      onSaved();
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate aria-label="Nueva fórmula óptica">
      {error && Object.keys(fieldErrors).length === 0 ? (
        <ui.Banner kind="error" title="No se pudo registrar la fórmula">{error.userMessage}</ui.Banner>
      ) : null}
      <div className="grid-2">
        <EyeFields shell={shell} prefix="od" title="Ojo derecho (OD)" eye={draft.od} errors={errors}
          onChange={(od) => setDraft((d) => ({ ...d, od }))} />
        <EyeFields shell={shell} prefix="oi" title="Ojo izquierdo (OI)" eye={draft.oi} errors={errors}
          onChange={(oi) => setDraft((d) => ({ ...d, oi }))} />
      </div>
      <div className="grid-2">
        <ui.TextField id="pupillaryDistance" label="Distancia pupilar (mm)" required inputMode="decimal"
          value={draft.pupillaryDistance} onChange={(v) => setDraft((d) => ({ ...d, pupillaryDistance: v }))}
          error={errors.pupillaryDistance} maxLength={5} hint="Entre 40 y 80" />
        <ui.SelectField id="lensType" label="Tipo de lente" required value={draft.lensType} placeholder="Elige…"
          onChange={(v) => setDraft((d) => ({ ...d, lensType: v as LensType | '' }))} options={LENS_TYPES}
          error={errors.lensType} />
        <ui.TextField id="optometristName" label="Optómetra" required value={draft.optometristName}
          onChange={(v) => setDraft((d) => ({ ...d, optometristName: v }))} error={errors.optometristName} maxLength={150}
          hint="Solo letras" />
        <ui.TextField id="formulaDate" label="Fecha del examen" required type="date" value={draft.formulaDate}
          onChange={(v) => setDraft((d) => ({ ...d, formulaDate: v }))} error={errors.formulaDate} />
      </div>
      <div className="actions">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar fórmula'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onCancel} disabled={pending}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
