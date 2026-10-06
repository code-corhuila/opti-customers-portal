import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ShellContext } from '../../shell-contract';
import { customersApi } from '../api/customersApi';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, STATUS_LABEL, type PatientStatus } from '../model/patient';

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as PatientStatus[]).map((value) => ({ value, label: STATUS_LABEL[value] }));

/**
 * Optometría (HU-23): lista de pacientes pensada para que el personal vea rápido quién necesita
 * atención de fórmula óptica, sin tener que abrir primero la ficha completa de cada paciente.
 * Reutiliza el mismo listado paginado/buscable de `GET /api/v1/patients`; el enlace de cada fila
 * lleva directo a la sección de fórmulas de la ficha (en vez de precalcular el estado de la fórmula
 * vigente de cada paciente, que requeriría una llamada adicional por fila).
 */
export function OptometryPage({ shell }: { shell: ShellContext }): ReactNode {
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
      <ui.PageHeader title="Optometría" subtitle="Pacientes que pueden necesitar atención de fórmula óptica." />
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
        emptyHint={q || status ? 'Prueba con otro nombre, documento o estado.' : 'Registra el primero desde «Pacientes».'}
      >
        {(result) => (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Paciente</th>
                    <th>Último control</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        {patient.documentType} {patient.documentNumber}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ui.Avatar name={patient.firstName + ' ' + patient.lastName} />
                          {patient.fullName}
                        </div>
                      </td>
                      <td>{formatDate(patient.lastControlDate)}</td>
                      <td>
                        <StatusBadge shell={shell} status={patient.status} />
                      </td>
                      <td>
                        <Link className="btn btn-quiet" to={`../${patient.id}?focus=formulas`}>
                          Ver/Registrar fórmula
                        </Link>
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
