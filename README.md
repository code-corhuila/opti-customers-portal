# opti-customers-portal

> customers bounded context: web UI (remote)

Part of the **LMS Library** distributed system — team `lms-library`, Grupo 2.
Governance and documentation live in [`library-docs`](https://github.com/code-corhuila/library-docs).

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `library-docs`.

## Fórmula óptica PDF

Desde la ficha del paciente se descarga cada fórmula vigente o histórica mediante el endpoint autenticado de pacientes. La API aplica roles y pertenencia al paciente; la interfaz no construye enlaces públicos ni maneja credenciales. Requiere el contenedor `opti-front` con soporte `responseType: 'blob'` y el endpoint PDF de `opti-customers-api`.

Verificación: `npm test`, `npm run build` y descarga desde ficha en Chromium con datos ficticios. La creación/consulta de fórmulas mantiene el flujo existente.
