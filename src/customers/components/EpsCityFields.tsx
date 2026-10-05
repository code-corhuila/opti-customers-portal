import { useState, type ReactNode } from 'react';
import type { ShellContext } from '../../shell-contract';
import { COLOMBIA, departmentOf } from '../model/colombia';
import { EPS_OPTIONS } from '../model/patient';

const EPS_FIELD_OPTIONS = EPS_OPTIONS.map((value) => ({ value, label: value }));
const DEPARTMENT_OPTIONS = COLOMBIA.map((d) => ({ value: d.department, label: d.department }));

/**
 * EPS (a fixed catalog) and city (picked through its department, so the list stays short). Shared
 * by PatientForm (new patient) and ContactForm (edit contact): both submit only `eps`/`city`,
 * department is a UI-only filter.
 */
export function EpsCityFields({
  shell,
  eps,
  city,
  onEpsChange,
  onCityChange,
  epsError,
  cityError,
}: {
  shell: ShellContext;
  eps: string;
  city: string;
  onEpsChange: (value: string) => void;
  onCityChange: (value: string) => void;
  epsError?: string | undefined;
  cityError?: string | undefined;
}): ReactNode {
  const { ui } = shell;
  const [department, setDepartment] = useState(() => departmentOf(city) ?? '');
  const cities = COLOMBIA.find((d) => d.department === department)?.cities ?? [];
  const cityOptions = cities.map((value) => ({ value, label: value }));

  return (
    <>
      <ui.SelectField
        id="eps"
        label="EPS"
        required
        value={eps}
        placeholder="Elige…"
        onChange={onEpsChange}
        options={EPS_FIELD_OPTIONS}
        error={epsError}
      />
      <ui.SelectField
        id="department"
        label="Departamento"
        value={department}
        placeholder="Elige…"
        onChange={(value) => {
          setDepartment(value);
          onCityChange('');
        }}
        options={DEPARTMENT_OPTIONS}
      />
      <ui.SelectField
        id="city"
        label="Ciudad"
        value={city}
        placeholder={department ? 'Elige…' : 'Elige primero el departamento'}
        onChange={onCityChange}
        options={cityOptions}
        error={cityError}
        disabled={!department}
      />
    </>
  );
}
