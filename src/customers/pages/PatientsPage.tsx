import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ShellContext } from '../../shell-contract';
import { customersApi } from '../api/customersApi';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, STATUS_LABEL, type PatientStatus } from '../model/patient';

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as PatientStatus[]).map((value) => ({ value, label: STATUS_LABEL[value] }));

const TOTAL_ICON = (
  <>
    <circle cx="7" cy="7" r="2.5" />
    <path d="M2.5 16c0-2.5 2-4 5-4s5 1.5 5 4" />
    <circle cx="14.5" cy="7.5" r="2" />
    <path d="M13 12.2c1.9.3 3.5 1.5 3.5 3.8" />
  </>
);

const ACTIVE_ICON = <path d="M4 10.5 8 14.5 16 5.5" />;

const PENDING_ICON = (
  <>
    <rect x="4.5" y="3.5" width="11" height="14" rx="1.5" />
    <path d="M7.5 3.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v.5M7 9h6M7 12.5h6M7 16h3.5" />
  </>
);

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
  const { state: summaryState, reload: reloadSummary } = ui.useLoad((signal) => api.summary(signal), []);

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
      <ui.DataState state={summaryState} onRetry={reloadSummary}>
        {(summary) => (
          <div className="summary-grid">
            <ui.StatCard icon={TOTAL_ICON} tone="primary" label="Total de pacientes" value={summary.total} />
            <ui.StatCard icon={ACTIVE_ICON} tone="success" label="Pacientes activos" value={summary.active} />
            <ui.StatCard icon={PENDING_ICON} tone={summary.pendingControls === 0 ? 'success' : 'warning'}
              label="Controles pendientes" value={summary.pendingControls} />
          </div>
        )}
      </ui.DataState>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ui.Avatar name={patient.firstName + ' ' + patient.lastName} />
                          <Link to={patient.id}>{patient.fullName}</Link>
                        </div>
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
