import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ShellContext } from '../../shell-contract';
import { customersApi } from '../api/customersApi';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, STATUS_LABEL, type PatientStatus } from '../model/patient';

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as PatientStatus[]).map((value) => ({ value, label: STATUS_LABEL[value] }));

/** Patient search (HU-03): by document or name, with the four states and bounded pages. */
export function PatientsPage({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const api = useMemo(() => customersApi(shell.api), [shell.api]);
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');
  const status = (params.get('status') ?? '') as PatientStatus | '';
  const page = Number(params.get('page') ?? '1') || 1;
  const q = ui.useDebounced(text.trim(), 300);

  const { state, reload } = ui.useLoad(
    (signal) => api.list({ q, status, page }, signal),
    [q, status, page],
  );

  function update(next: Record<string, string>): void {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) {
        merged.set(key, value);
      } else {
        merged.delete(key);
      }
    }
    setParams(merged, { replace: true });
  }

  return (
    <>
      <ui.PageHeader
        title="Pacientes"
        subtitle="Busca por documento o nombre."
        actions={
          shell.can('ADMIN', 'SELLER', 'OPTOMETRIST') ? (
            <Link className="btn" to="new">
              Nuevo paciente
            </Link>
          ) : null
        }
      />
      <div className="toolbar" role="search">
        <ui.TextField id="search" label="Buscar" type="search" value={text} placeholder="Documento o nombre"
          onChange={(value) => { setText(value); update({ page: '' }); }} maxLength={60} />
        <ui.SelectField id="status" label="Estado" value={status} placeholder="Todos"
          onChange={(value) => update({ status: value, page: '' })} options={STATUS_OPTIONS} />
      </div>
      <ui.DataState
        state={state}
        onRetry={reload}
        isEmpty={(result) => result.data.length === 0}
        emptyTitle="No encontramos pacientes"
        emptyHint={q || status ? 'Prueba con otro nombre, documento o estado.' : 'Registra el primero con «Nuevo paciente».'}
      >
        {(result) => (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Paciente</th>
                    <th>Teléfono</th>
                    <th>EPS</th>
                    <th>Último control</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        {patient.documentType} {patient.documentNumber}
                      </td>
                      <td>
                        <Link to={patient.id}>{patient.fullName}</Link>
                      </td>
                      <td>{patient.phone}</td>
                      <td>{patient.eps}</td>
                      <td>{formatDate(patient.lastControlDate)}</td>
                      <td>
                        <StatusBadge shell={shell} status={patient.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ui.Pager meta={result.meta} onPage={(next) => update({ page: next === 1 ? '' : String(next) })} />
          </>
        )}
      </ui.DataState>
    </>
  );
}
