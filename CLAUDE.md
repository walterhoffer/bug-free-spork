# bug-free-spork

Frontend: Angular 22 + NgRx SignalStore w `frontend/`. Testy: `npm test`, build: `npm run build` (oba w `frontend/`).

## Workflow
- `main` jest chroniony: każda zmiana idzie przez branch i pull request. Nigdy nie pushuj na `main`.
- Zadania są na tablicy GitHub Projects: https://github.com/users/walterhoffer/projects/1
- Flow agentów (tablica → worktree → PR → review) jest opisane w [docs/agent-workflow.md](docs/agent-workflow.md). Ten dokument jest źródłem prawdy. Zmiany procesu wprowadzaj najpierw tam.
- Flow ma status **projekt**: nie zakładaj, że `/run-board` albo agenci implementer i reviewer już istnieją.
