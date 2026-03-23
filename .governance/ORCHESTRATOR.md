# Orchestrator — domain linkage audit mode

## Active mode: DOMAIN_LINKAGE_AUDIT

Stages **A1–A12** in `STAGE_ASSIGNER.md` use the same execution mode:

| Field | Value |
|--------|--------|
| **Category** | DOMAIN_LINKAGE_AUDIT |
| **Goal** | Understand real behavior, map links between modules (router → views → services → data), flag incorrect or fragile logic |
| **Subplan** | `subplans/domain_linkage_audit.md` |
| **Code changes** | **Default: none.** Document issues. Remediation is a separate explicitly scoped task or stage. |

## Execution protocol

1. Read `STAGE_ASSIGNER.md` and locate the stage ID you are running (e.g. `A3`).
2. Read **only** the paths listed under that stage (expand to **static `import` / `fetch` targets** as needed — stay within the slice).
3. Activate `subplans/domain_linkage_audit.md` and complete every checklist item for that slice.
4. Produce a **short written artifact**: add a subsection to `docs/TECHNICAL_DEBT.md` titled `Domain audit — Stage <ID>` with bullet findings (severity: observation / risk / bug-suspected). Create `docs/TECHNICAL_DEBT.md` if it does not exist.
5. After **any** code or config edit: run `npm run lint` and targeted `npm test`. If you changed the Webpack graph or `index.html`, run `npm run build` to ensure the bundle still builds.

## Category → subplan

| Category | Subplan |
|----------|---------|
| DOMAIN_LINKAGE_AUDIT | `subplans/domain_linkage_audit.md` |

## Conflict resolution

- If `STAGE_ASSIGNER.md` and a future `ARCHITECTURE.md` disagree, **ARCHITECTURE.md** describes intended architecture; the audit should **flag** the drift.
- If `README.md` and code disagree on persistence (e.g. “localStorage only” vs live API), **flag** the drift.
- Do not expand scope to “also fix” another domain — note it and move to that stage.
