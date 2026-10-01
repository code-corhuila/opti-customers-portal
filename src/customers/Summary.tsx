import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Page, ShellContext } from '../shell-contract';
import { customersApi } from './api/customersApi';
import type { Patient } from './model/patient';

/** The card of this domain in the dashboard (HU-12): patients whose control is overdue. */
export default function Summary({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const api = useMemo(() => customersApi(shell.api), [shell.api]);
  const { state, reload } = ui.useLoad<Page<Patient>>(
    (signal) => api.list({ status: 'CONTROL_OVERDUE', limit: 1 }, signal),
    [],
  );
  return (
    <div className="summary-card">
      <h2>Controles vencidos</h2>
      <ui.DataState state={state} onRetry={reload}>
        {(page) => (
          <>
            <div className={page.meta.total === 0 ? 'metric calm' : 'metric'}>{page.meta.total}</div>
            <p>{page.meta.total === 0 ? 'Todos los pacientes están al día.' : 'pacientes sin control hace más de 12 meses.'}</p>
            {page.meta.total > 0 ? <Link to="/customers?status=CONTROL_OVERDUE">Ver pacientes</Link> : null}
          </>
        )}
      </ui.DataState>
    </div>
  );
}
