# Flow agentów: tablica → worktree → PR → review

> **Status: projekt.** Flow nie jest jeszcze wdrożone: nie ma skilla `/run-board`, agentów ani CI.
> Przed wdrożeniem trzeba rozstrzygnąć punkty z sekcji [Do ustalenia](#do-ustalenia).
> Ten dokument jest źródłem prawdy. Każda zmiana procesu trafia najpierw tutaj, a dopiero potem do skilla i agentów.

## Cel

Orkiestrator pobiera z tablicy GitHub Projects zadania w statusie **Todo**.
Każde zadanie dostaje osobnego agenta (implementera), który pracuje we własnym git worktree i na koniec otwiera pull request.
Każdy PR przegląda osobny, świeży agent (reviewer).
Merge zawsze robi człowiek.

## Zasoby

| Co | Gdzie |
|---|---|
| Repo | `walterhoffer/bug-free-spork` (publiczne) |
| Tablica | https://github.com/users/walterhoffer/projects/1 (project #1, podpięta do repo) |
| Ochrona `main` | ruleset `protect-main`: tylko przez PR (0 approvals), bez force push, bez usuwania, bez bypass |
| CLI | `gh` z uprawnieniami `repo`, `workflow`, `project` |

Na `main` nie da się pushować bezpośrednio, więc **każda** zmiana, łącznie z tym dokumentem, idzie przez branch i PR.

## Przebieg

```
Tablica (Todo)
   │  1. pobranie zadań
   ▼
Orkiestrator (główna sesja Claude)
   │  2. sprawdza, czy zadania nie ruszają tych samych plików
   │  3. rezerwuje: karta → In Progress, etykieta agent:wip
   ├──► Implementer #A ── worktree issue-A ── PR "Closes #A" ──┐
   └──► Implementer #B ── worktree issue-B ── PR "Closes #B" ──┤
                                                                ▼
                                       Reviewer (świeży agent na każdy PR)
                                                                │
                                  uwagi? ──tak──► wracają do tego samego implementera
                                                  (zachowuje kontekst), maks. 2 rundy
                                                                │ nie
                                                                ▼
                                          karta → In Review → człowiek merguje → Done
```

### 1. Pobranie zadań
- `gh project item-list 1 --owner walterhoffer`, odfiltrowane do `Status = Todo` i typu Issue.
- Pomijane są issues z etykietą `agent:wip` albo `needs-human`.
- Orkiestrator czyta treść każdego issue, zwłaszcza sekcje **Pliki** i **Done when**.

### 2. Kontrola kolizji
- Jeśli dwa issues wymieniają w sekcji **Pliki** te same pliki, idą **po kolei**, nie równolegle.
- Issue bez sekcji **Pliki** albo **Done when** nie jest brane. Orkiestrator komentuje, czego brakuje, i dodaje etykietę `needs-human`.
- Równolegle działa **maksymalnie 3** implementerów. Reszta czeka w kolejce.

### 3. Rezerwacja
- Przed startem: karta → **In Progress**, etykieta `agent:wip`.
- Dzięki temu kolejne uruchomienie nie weźmie tego samego zadania.

### 4. Implementer (jeden na issue)
- Działa w izolowanym worktree (`isolation: worktree`).
- Branch: `issue-<N>-<krótki-slug>` od aktualnego `main`.
- Kroki: `npm ci` (w `frontend/`) → implementacja → `npm test` i `npm run build` → commit → push → PR.
- PR: tytuł jak w issue, w opisie `Closes #N`, checklista z **Done when**, sekcja **Założenia** (decyzje podjęte samodzielnie).
- W issue zostawia komentarz na starcie: branch i krótki plan.
- Kończy pracę raportem w stałym formacie (patrz [Format raportu](#format-raportu)).

### 5. Reviewer (osobny agent na każdy PR)
- Zawsze **świeży** agent, nie ten, który pisał kod, żeby nie oceniał własnej pracy.
- Czyta issue, diff PR-a i odpala testy oraz build na tym branchu.
- Sprawdza kryteria **Done when**, błędy, zmiany poza sekcją **Pliki** i spójność z tokenami light theme (`frontend/src/styles.scss`).
- Werdykt zostawia przez `gh pr review --comment`: **OK** albo lista poprawek z odnośnikami do linii.
- Ograniczenie: wszyscy agenci działają jako `walterhoffer`, a GitHub nie pozwala zatwierdzić ani odrzucić własnego PR-a. Dlatego werdykt jest komentarzem. Działa to, bo `protect-main` wymaga 0 zatwierdzeń.

### 6. Pętla poprawek
- Uwagi reviewera wracają do **tego samego** implementera przez SendMessage, a on zachowuje kontekst.
- Po poprawkach znowu działa świeży reviewer.
- **Maksymalnie 2 rundy.** Jeśli dalej nie ma porozumienia, PR zostaje dla człowieka z opisem sporu, a karta idzie do **Blocked** z etykietą `needs-human`.

### 7. Koniec
- Po review OK: karta → **In Review**, zdjęta etykieta `agent:wip`.
- Merge robi **zawsze człowiek**. Agenci nigdy nie mergują.
- Po merge'u `Closes #N` zamyka issue, a karta przechodzi do **Done**.

## Tablica: statusy i etykiety

```
Todo → In Progress → In Review → Done
             ↘ Blocked (czeka na człowieka)
```

| Etykieta | Znaczenie |
|---|---|
| `agent:wip` | agent pracuje nad zadaniem, nie brać ponownie |
| `needs-human` | pytanie albo blokada, czeka na odpowiedź człowieka |
| `review:changes` | reviewer odesłał poprawki |

Do utworzenia: statusy **In Review** i **Blocked** (teraz są tylko Todo / In Progress / Done) oraz powyższe etykiety.

## Raportowanie

Zasada: **GitHub jest jedynym źródłem prawdy**, a do człowieka trafia tylko to, co wymaga jego uwagi.

1. **Tablica**: status na pierwszy rzut oka.
2. **Komentarze w issue i PR**: historia. Tylko kluczowe momenty: start, PR, werdykt review, runda poprawek, przekazanie człowiekowi.
3. **Podsumowanie w terminalu**: po każdym uruchomieniu orkiestrator wypisuje tabelkę:
   ```
   #3  Filtry z licznikami   PR #5  ✅ review OK, testy zielone  → In Review
   #4  Nagłówek aplikacji    PR #6  ⚠️ 1 pytanie                → Blocked
   ```

### Format raportu

Każdy agent kończy pracę raportem w tej postaci:

```
STATUS: done | blocked | failed
ISSUE: #N
PR: <url albo brak>
TESTY: npm test ✅/❌, npm run build ✅/❌
ZAŁOŻENIA: <decyzje podjęte samodzielnie>
PYTANIA: <brak albo lista>
```

Reviewer zamiast pól `PR` i `TESTY` podaje `WERDYKT: OK | POPRAWKI` i listę uwag.

## Pytania

### Granica samodzielności

| Agent decyduje sam i zapisuje w „Założeniach” | Agent pyta |
|---|---|
| teksty i odstępy w UI w ramach light theme | zmiana zakresu zadania |
| nazwy zmiennych i struktura komponentu | nowa zależność w `package.json` |
| dodatkowe testy | zmiana plików spoza sekcji **Pliki** |
| | sprzeczne albo niejasne kryteria **Done when** |
| | 2 rundy review bez porozumienia |

### Droga pytania

Agent w tle nie może zapytać człowieka bezpośrednio, więc pytanie idzie przez orkiestratora:

```
Agent kończy pracę z raportem STATUS: blocked, PYTANIA: ...
   ▼
Orkiestrator
   ├─ zna odpowiedź z kontekstu (issue, ten dokument, kod)
   │     ──► odpowiada agentowi (SendMessage), praca idzie dalej
   ├─ człowiek jest przy sesji
   │     ──► pyta go w sesji, odpowiedź przekazuje agentowi
   └─ człowieka nie ma
         ──► komentarz w issue z pytaniem + etykieta needs-human
             + karta → Blocked + powiadomienie
             Człowiek odpowiada komentarzem na GitHubie (działa też z telefonu),
             następne uruchomienie podejmuje temat.
```

### Powiadomienia

Tylko dwa rodzaje:
- **„Potrzebuję Cię”**: pytanie albo blokada.
- **„Gotowe do merge'a”**: PR przeszedł review.

## Pułapki

- **Review z jednego konta.** Nie da się zatwierdzić własnego PR-a. Formalne zatwierdzenia wymagałyby osobnego konta albo GitHub App dla reviewera.
- **Brak CI.** Teraz testy odpalają tylko agenci. GitHub Actions dałoby niezależną bramkę.
- **Uprawnienia.** Agenci w tle nie mogą klikać zgód. Trzeba dopisać stałe zgody na `npm`, `git` i `gh pr|issue|project` w `.claude/settings.json`.
- **`npm ci` w każdym worktree.** Każdy worktree ma własne `node_modules`, co kosztuje czas i miejsce. Przy 2–3 zadaniach to akceptowalne.

## Planowane pliki

| Plik | Zawartość |
|---|---|
| `CLAUDE.md` | krótki odnośnik do tego dokumentu |
| `.claude/skills/run-board/SKILL.md` | przepis orkiestratora, uruchamiany przez `/run-board` |
| `.claude/agents/implementer.md` | rola implementera: zasady, format raportu, kiedy pytać |
| `.claude/agents/reviewer.md` | rola reviewera: checklista, format werdyktu |
| `.github/ISSUE_TEMPLATE/task.md` | szablon issue: Opis / Pliki / Done when |
| `.github/workflows/ci.yml` | `npm test` + `npm run build` na każdym PR-ze |
| `.claude/settings.json` | stałe zgody dla agentów |

Kolejność wdrożenia: CI, szablon issue i statusy oraz etykiety na tablicy → agenci → skill → próbne uruchomienie na #3 i #4.

## Do ustalenia

1. **Gdzie działają agenci:** lokalnie (worktree na tym komputerze) czy w chmurze (`isolation: remote`)?
2. **Uruchamianie:** ręcznie `/run-board` czy cyklicznie?
3. **CI:** czy GitHub Actions ma być bramką przed review?
4. **Modele:** implementer na Opusie; reviewer na Sonnecie (taniej) czy na Opusie (dokładniej)?
5. **Pytania, gdy człowiek jest przy sesji:** pytanie w sesji czy zawsze przez GitHub?
6. **Powiadomienia:** systemowe, GitHub (`@walterhoffer`) czy oba?
7. **Granica samodzielności:** czy tabela powyżej jest właściwa?
