import type { FormEvent } from 'react';

/** Moves the focus to the first invalid input, so a keyboard or screen reader user lands on the problem. */
export function focusFirstInvalid(event: FormEvent<HTMLFormElement>): void {
  const form = event.currentTarget;
  requestAnimationFrame(() => {
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}

/** Client errors appear once the person tried to send; the server's errors always appear. */
export function visibleErrors(
  clientErrors: Record<string, string>,
  serverErrors: Record<string, string>,
  attempted: boolean,
): Record<string, string> {
  return { ...(attempted ? clientErrors : {}), ...serverErrors };
}
