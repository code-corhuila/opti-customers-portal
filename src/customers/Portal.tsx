import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { ShellContext } from '../shell-contract';
import { NewPatientPage } from './pages/NewPatientPage';
import { OptometryPage } from './pages/OptometryPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { PatientsPage } from './pages/PatientsPage';

/** The customers portal: mounted by opti-front under /customers. */
export default function Portal({ shell }: { shell: ShellContext }): ReactNode {
  return (
    <Routes>
      <Route index element={<PatientsPage shell={shell} />} />
      <Route path="new" element={<NewPatientPage shell={shell} />} />
      <Route path="optometry" element={<OptometryPage shell={shell} />} />
      <Route path=":id" element={<PatientDetailPage shell={shell} />} />
      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  );
}
