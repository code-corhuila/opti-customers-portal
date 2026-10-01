import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ShellContext } from '../../shell-contract';
import { PatientForm } from '../components/PatientForm';

/** New patient (HU-01). */
export function NewPatientPage({ shell }: { shell: ShellContext }): ReactNode {
  const navigate = useNavigate();
  return (
    <>
      <shell.ui.PageHeader
        title="Nuevo paciente"
        subtitle="Los campos con * son obligatorios."
        actions={
          <Link className="btn btn-quiet" to="..">
            Volver
          </Link>
        }
      />
      <div className="card">
        <PatientForm shell={shell} onCreated={(id) => navigate(`../${id}`)} />
      </div>
    </>
  );
}
