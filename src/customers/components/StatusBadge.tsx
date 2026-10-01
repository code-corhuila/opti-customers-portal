import type { ReactNode } from 'react';
import type { ShellContext } from '../../shell-contract';
import { STATUS_LABEL, type PatientStatus } from '../model/patient';

const TONE = { ACTIVE: 'success', CONTROL_OVERDUE: 'warning', INACTIVE: 'neutral' } as const;

export function StatusBadge({ shell, status }: { shell: ShellContext; status: PatientStatus }): ReactNode {
  return <shell.ui.Badge tone={TONE[status]}>{STATUS_LABEL[status]}</shell.ui.Badge>;
}
