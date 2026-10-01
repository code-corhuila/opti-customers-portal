import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ShellContext } from '../../shell-contract';
import { customersApi } from '../api/customersApi';
import { ContactForm } from '../components/ContactForm';
import { FormulaForm } from '../components/FormulaForm';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, LENS_TYPES, type Eye, type Formula } from '../model/patient';

const LENS_LABEL = Object.fromEntries(LENS_TYPES.map((t) => [t.value, t.label]));

function eyeText(eye: Eye): string {
  const number = (value: number | null, digits = 2): string => (value === null ? '—' : value.toFixed(digits));
  return `Esf ${number(eye.sphere)} · Cil ${number(eye.cylinder)} · Eje ${eye.axis ?? '—'} · Add ${number(eye.addition)}`;
}

function FormulaHistory({ shell, patientId, version }: { shell: ShellContext; patientId: string; version: number }): ReactNode {
  const { ui } = shell;
  const api = useMemo(() => customersApi(shell.api), [shell.api]);
  const [page, setPage] = useState(1);
  const { state, reload } = ui.useLoad((signal) => api.formulas(patientId, page, signal), [patientId, page, version]);
  return (
    <ui.DataState
      state={state}
      onRetry={reload}
      isEmpty={(result) => result.data.length === 0}
      emptyTitle="Sin fórmulas todavía"
      emptyHint="Cuando el optómetra registre el examen, aparecerá aquí."
    >
      {(result) => (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ojo derecho</th>
                  <th>Ojo izquierdo</th>
                  <th>DP</th>
                  <th>Lente</th>
                  <th>Optómetra</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {result.data.map((formula: Formula) => (
                  <tr key={formula.id}>
                    <td>{formatDate(formula.formulaDate)}</td>
                    <td>{eyeText(formula.od)}</td>
                    <td>{eyeText(formula.oi)}</td>
                    <td className="num">{formula.pupillaryDistance}</td>
                    <td>{LENS_LABEL[formula.lensType] ?? formula.lensType}</td>
                    <td>{formula.optometristName}</td>
                    <td>{formula.current ? <ui.Badge tone="success">Vigente</ui.Badge> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ui.Pager meta={result.meta} onPage={setPage} />
        </>
      )}
    </ui.DataState>
  );
}

/** Patient record: data, contact update, and the formula history with the current one (HU-01, HU-02). */
export function PatientDetailPage({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const { id = '' } = useParams();
  const api = useMemo(() => customersApi(shell.api), [shell.api]);
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState(false);
  const [addingFormula, setAddingFormula] = useState(false);
  const { state, reload } = ui.useLoad((signal) => api.get(id, signal), [id, version]);

  return (
    <>
      <ui.PageHeader
        title="Ficha del paciente"
        actions={
          <Link className="btn btn-quiet" to="..">
            Volver a pacientes
          </Link>
        }
      />
      <ui.DataState state={state} onRetry={reload}>
        {(patient) => (
          <>
            <section className="card" aria-labelledby="patient-data">
              <h2 id="patient-data">
                {patient.fullName} <StatusBadge shell={shell} status={patient.status} />
              </h2>
              {editing ? (
                <ContactForm shell={shell} patient={patient} onSaved={() => { setEditing(false); setVersion((v) => v + 1); }} />
              ) : (
                <>
                  <dl className="facts">
                    <dt>Documento</dt>
                    <dd>{patient.documentType} {patient.documentNumber}</dd>
                    <dt>Teléfono</dt>
                    <dd>{patient.phone}</dd>
                    <dt>Correo</dt>
                    <dd>{patient.email ?? '—'}</dd>
                    <dt>EPS</dt>
                    <dd>{patient.eps}</dd>
                    <dt>Ciudad</dt>
                    <dd>{patient.city ?? '—'}</dd>
                    <dt>Nacimiento</dt>
                    <dd>{formatDate(patient.birthDate)}</dd>
                    <dt>Último control</dt>
                    <dd>{formatDate(patient.lastControlDate)}</dd>
                  </dl>
                  {patient.status === 'CONTROL_OVERDUE' ? (
                    <ui.Banner kind="info" title="Control vencido">
                      Hace más de 12 meses del último examen. Una fórmula nueva lo deja al día.
                    </ui.Banner>
                  ) : null}
                  <div className="actions">
                    <button type="button" className="btn btn-quiet" onClick={() => setEditing(true)}>
                      Editar contacto
                    </button>
                  </div>
                </>
              )}
            </section>

            <section className="card" aria-labelledby="formulas">
              <div className="page-header">
                <h2 id="formulas">Fórmulas ópticas</h2>
                {shell.can('ADMIN', 'OPTOMETRIST') && !addingFormula ? (
                  <button type="button" className="btn" onClick={() => setAddingFormula(true)}>
                    Nueva fórmula
                  </button>
                ) : null}
              </div>
              {addingFormula ? (
                <FormulaForm shell={shell} patientId={patient.id} onCancel={() => setAddingFormula(false)}
                  onSaved={() => { setAddingFormula(false); setVersion((v) => v + 1); }} />
              ) : null}
              <FormulaHistory shell={shell} patientId={patient.id} version={version} />
            </section>
          </>
        )}
      </ui.DataState>
    </>
  );
}
