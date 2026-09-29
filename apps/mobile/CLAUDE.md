# CLAUDE.md — apps/mobile

Frontend mobile React Native + Expo para o Wyden. Recria, pixel-perfect, o
protótipo em `design_bundle/fintech-wyden/`.

## Stack
- Expo SDK 57, React Native 0.86, TypeScript (strict)
- **Expo Router** (file-based, `app/`) — entry: `expo-router/entry` (ver `package.json` `main`)
- **React Query** (@tanstack/react-query) para data fetching/cache — hoje sobre o
  banco local, não uma API
- **react-native-svg** para ícones e gráficos (sparkline, donut, ring)
- **Plus Jakarta Sans** via `@expo-google-fonts/plus-jakarta-sans` + `expo-font`
- NativeWind 4 configurado (preset no babel + tokens no `tailwind.config.js`),
  mas a UI usa majoritariamente `StyleSheet`/estilos inline para fidelidade
  pixel-perfect (ver decisão abaixo)
- **`expo-sqlite`** — banco local (ver "Dados locais" abaixo). **Sem servidor,
  sem login** — dados nunca saem do aparelho (ver `CLAUDE.md` da raiz).
- `expo-crypto` (`randomUUID`), `expo-file-system` + `expo-sharing` +
  `expo-document-picker` (export/import de backup)
- React Hook Form + Zod usados no onboarding (`Welcome`/`EditName`) e no Add

## Estilização: NativeWind vs inline (decisão)
O protótipo usa valores precisos (fontSize 16.5, letterSpacing -1.4, sombras
compostas, washes com alpha hex). RN não sintetiza pesos de fonte a partir de
uma família e o Tailwind/NativeWind não casa bem com esses valores fracionários.
Por isso a UI das telas usa `StyleSheet.create`/estilo inline, com **todas as
cores/raios/sombras vindas de `src/theme/tokens.ts`** (espelho das `:root` vars
do protótipo). NativeWind fica configurado e os tokens existem em
`tailwind.config.js` para utilitários simples quando úteis.

Tipografia: o componente `src/components/Txt.tsx` mapeia o `fontWeight` do estilo
para a família Plus Jakarta correta (Regular/Medium/SemiBold/Bold/ExtraBold),
mantendo a autoria por `fontWeight` igual ao CSS do protótipo.

## Estrutura real
```
app/                         <- rotas (Expo Router) — ver app/CLAUDE.md
  _layout.tsx                <- providers (QueryClient, Catalog, SafeArea,
                                Gesture) + fontes + Stack + guard de onboarding
  welcome.tsx                <- onboarding (só o nome — sem login)
  edit-name.tsx               <- "Editar nome" (modal)
  (tabs)/
    _layout.tsx              <- Tabs com TabBar custom (FAB central)
    index.tsx                <- Início/Dashboard
    transactions.tsx         <- Transações
    reports.tsx              <- Relatórios
    profile.tsx              <- Perfil (nome local + backup)
  transaction/add.tsx        <- Adicionar transação (modal)
  insight.tsx                <- Insight comportamental (transparentModal/bottom sheet)
src/
  data/                      <- camada de banco local (SQLite) — ver seção abaixo
  components/                <- Card, Icon, Press, Txt, Field, NameForm, ProgressBar, TabBar
    charts/                  <- Sparkline, Donut, ProgressRing (react-native-svg)
  context/                   <- CatalogContext (categorias/bancos, sem gate de auth)
  screens/                   <- 1 pasta por tela (a UI vive aqui; app/* só re-exporta)
    dashboard/ transactions/ reports/ add/ insight/ profile/ welcome/
  services/                  <- camada de dados voltada à UI
    hooks.ts                 <- hooks React Query sobre `src/data` (useDashboard, useBanks, ...)
    transform.ts             <- transforms PUROS registro-local→UI (testáveis)
    backup-file.ts           <- IO nativo do backup (share sheet + document picker)
    types.ts                 <- tipos de domínio da UI + os 4 enums (antes em @wyden/shared)
  test-utils/                <- providers + test-db (sql.js) + fixtures
  theme/                     <- tokens.ts (cores/raios/sombras), fonts.ts
  utils/                     <- format.ts (brl/brlParts), charts.ts, months.ts, errors.ts
```

## Componentes de gráfico
Todos em `src/components/charts/`, sobre `react-native-svg`, usando geradores de
path puros em `src/utils/charts.ts`:
- `Sparkline` — linha suave + área com gradiente + ponta (BalanceCard)
- `Donut` — anel segmentado com label central (CategoryCard)
- `ProgressRing` — anel de progresso com % central (GoalCard)
Barras simples (Comparativo mensal, CategoryBars, BankBreakdown, padrão semanal
do insight) são `View`s flex; `ProgressBar` é um componente reutilizável.

## Dados locais (SQLite) — `src/data/`
Tudo roda em cima de um banco **`expo-sqlite`** no próprio aparelho; não existe
mais `apps/api`/Postgres (ver `CLAUDE.md` da raiz). Um arquivo por
responsabilidade:
- `db.ts` — `getDb()`/`setDbForTests()`; abre `wyden.db`, liga `foreign_keys`,
  roda `migrations.ts`. A interface `SqlExecutor`/`SqlDb` é a mesma que os
  testes implementam sobre `sql.js` (ver `test-utils/test-db.ts`), então
  `src/data/*` nunca importa `expo-sqlite` diretamente fora de `db.ts`.
- `migrations.ts` — schema versionado por `PRAGMA user_version`.
- `seeds.ts` — as 15 categorias e os 6 bancos padrão (ids slug: `compras`,
  `nubank`, …), portados 1:1 do antigo seed da API. `seedDefaults` é idempotente
  (`INSERT OR IGNORE`).
- `catalog.ts` — `listCategories`/`listBanks`; o saldo do banco é **calculado
  na leitura** (`initial + Σreceitas − Σdespesas`), não guardado numa coluna —
  elimina toda a lógica de rebalanceamento que a API antiga precisava.
- `transactions.ts` — `listTransactions`/`listRecentTransactions`/`createTransaction`;
  valida banco/categoria/valor e lança `DataError` com mensagem em pt-BR.
- `impulse.ts` — heurística de compra por impulso (ver seção própria abaixo).
- `reports.ts` — agregações puras (`summarize`, `totalsByCategory`,
  `totalsByBank`, `monthlyComparison`), portadas da antiga `ReportsService`.
- `profile.ts` — nome do usuário (a única "identidade" do app).
- `goals.ts` — leitura de metas (CRUD ainda não tem tela — Fase 3).
- `backup.ts` — export/import/reset (ver seção própria abaixo).
- `errors.ts` — `DataError`, para mensagens que a UI deve mostrar como estão.

## Heurística de isImpulse
Em `src/data/impulse.ts`, portada da antiga API (`TransactionsService.detectImpulse`)
com uma diferença: usa a **hora local do aparelho**, não um offset fixo de
UTC-3 (não existe mais um servidor separado — "local" agora é só o aparelho).
`isImpulse = true` quando **todas** as condições são verdadeiras:
1. `type === EXPENSE`;
2. horário noturno (`hora ≥ 20`) **ou** fim de semana, na data/hora local;
3. o valor é maior que a **média das despesas dos 7 dias anteriores**. Sem
   histórico nesses 7 dias, usa o fallback fixo: `valor > R$100`.

## Backup (`src/data/backup.ts` + `services/backup-file.ts`)
Sem servidor, a "cópia de segurança" é um arquivo `.json` manual:
- **Exportar** (`useExportBackup`): monta um snapshot completo (nome, categorias,
  bancos, transações, metas) e abre o share sheet do sistema.
- **Importar** (`useImportBackup`): abre o seletor de arquivos, valida o JSON
  com **zod** (`parseBackup`) e substitui todos os dados **atomicamente**
  (`withExclusiveTransactionAsync`) — um arquivo inválido ou uma violação de FK
  faz rollback, nunca deixa o banco pela metade.
- **Apagar tudo** (`useResetData`, tela Perfil): mesma transação atômica, mas
  resemeando os padrões em vez de restaurar um arquivo.
- `services/backup-file.ts` isola o IO nativo (`expo-file-system`/`expo-sharing`/
  `expo-document-picker`) da lógica pura em `data/backup.ts`.
- **Android**: `app.json` tem `android.allowBackup: false` — sem isso, o Auto
  Backup do Google enviaria o `.db` para a nuvem do usuário, contrariando o
  objetivo de manter os dados só no aparelho. No iOS, o backup do iCloud do
  aparelho ainda pode incluir o `.db` (fora do controle do app).

## Perfil / onboarding (sem login)
Não existe autenticação — apenas um nome, guardado em `settings.profile.name`:
- **`WelcomeScreen`** (`app/welcome.tsx`): primeira tela quando não há nome
  salvo. Formulário único (`NameForm`), "Seus dados ficam só neste aparelho".
- **`EditNameScreen`** (`app/edit-name.tsx`, modal): mesmo `NameForm`,
  pré-preenchido, aberto pelo lápis no Perfil.
- **Guard** em `app/_layout.tsx` (`RootNavigator`): sem nome → `/welcome`; com
  nome, fora do onboarding; se o banco falhar ao abrir, mostra `ErrorState`
  com "Tentar novamente" em vez de tela em branco.
- `CatalogContext` não tem mais gate de sessão — as queries de categorias/bancos
  rodam sempre.

## Dados: hooks React Query sobre o banco local
Os hooks em `src/services/hooks.ts` chamam `src/data/*` diretamente (sem rede)
e passam o resultado pelos transforms PUROS de `src/services/transform.ts`.
**As queryKeys e os tipos de retorno são os mesmos de quando havia API** — a
camada de componentes não mudou na migração.

- `useDashboard`/`useReports` leem uma janela de transações (6 e 12 meses,
  respectivamente) de uma vez e agregam tudo em memória — a antiga API
  precisava de uma chamada por mês por breakdown; localmente isso é só um
  filtro.
- `useTransactions` agrupa por dia (`groupByDay`).
- `useCreateTransaction` grava com `occurredAt = agora` e invalida
  `dashboard`/`transactions`/`reports`/`banks`/`insight` — a versão antiga
  não invalidava `banks`, deixando o saldo do Perfil desatualizado.
- `useCategories`/`useBanks` alimentam o `CatalogContext`.
- `useProfile`/`useSaveName` — nome do onboarding/Perfil.
- `useExportBackup`/`useImportBackup`/`useResetData` — ver seção Backup.

### Catálogo (categorias/bancos)
As telas resolvem ícone/cor/label por id via `useCatalog().catById/bankById`
(`src/context/CatalogContext.tsx`), que carrega categorias e bancos do banco
local uma vez. O fallback (se um id não estiver carregado ainda) vem das
próprias seeds (`src/data/seeds.ts`), não mais de um catálogo mockado à parte.

### Transforms (decisões — o que é "derivado")
- **Valores**: `src/data` guarda tudo em **centavos**; os transforms dividem
  por 100 só na fronteira com a UI.
- **Bank.ink**: derivado por luminância — tile claro (ex. amarelo do BB) → ink
  escuro `#1B1D21`; senão `#FFFFFF`. `cash = name==='Dinheiro'`. `short` derivado
  das 2 primeiras letras se vier null.
- **evolution** (sparkline do Dashboard): **DERIVADO** de `monthlyComparison` —
  soma acumulada de (receitas−despesas) por mês, normalizada 0..1.
- **behavior** (Relatórios): **DERIVADO** (heurística Fase 1) — compara a % de
  transações `isImpulse` do mês atual vs anterior; "—" quando faltam dados. A
  engine real de insights é Fase 2.
- **insight**: sempre o estado "sem insights ainda" — não existe engine local
  ainda (Fase 2). O comportamento é honesto com o que já era verdade na API
  antiga (`GET /insights` sempre voltava `[]`).
- **goal**: primeira meta de `listGoals()` ou um placeholder zerado (Fase 3).

## Config de host (API_BASE_URL)
Não existe mais — não há API. `EXPO_PUBLIC_API_URL`, `10.0.2.2` etc. não se
aplicam a este app.

## Regras
- **Purple `#7C5CFC` (`colors.purple*`) é EXCLUSIVO de insight comportamental.**
- Tudo tipado; sem `any`. Lógica de formatação/cálculo isolada em `src/utils`
  (funções puras). Hooks separados da UI.
- Componentes de UI seguem pixel-perfect o protótipo.
- Acessibilidade: `accessibilityRole`/`accessibilityLabel` nos toques principais.

## Validação
- `npm run typecheck` (ou `npx tsc --noEmit`) → zero erros
- `npm run lint` (ESLint flat config + `eslint-config-expo`) → zero erros
- `npm run test` → jest (jest-expo), todos passam
- `npm run build` (= `expo export --platform android`) → bundle compila sem erro de resolução
- `npx expo-doctor` → 21/21 (pega `app.json` inválido e módulo nativo duplicado)
- **Upgrade de SDK:** `npx expo install expo@^N --fix` por cima do lockfile antigo deixa cópias velhas hoistadas na raiz (ex.: 2 `react-native`; `babel-preset-expo` aninhado em `expo/node_modules`, que o `babel.config.js` não enxerga). Depois de subir, confira que `npm ls react-native` mostra **uma** versão e que o `expo-doctor` passa. `npm dedupe` é amplo demais; prefira ajustar só as entradas do mobile.

## Testes
- **jest-expo** + **@testing-library/react-native 13.3.3** + **react-test-renderer**.
- **Banco de dados nos testes**: `test-utils/test-db.ts` implementa a mesma
  interface `SqlDb` de `data/db.ts` sobre **`sql.js`** (SQLite compilado para
  asm.js, sem módulo nativo, sem filesystem). `setupTestDb()` (chamada uma vez
  no topo do arquivo de teste) cria um banco novo e migrado a cada `beforeEach`
  e o instala via `setDbForTests`, então qualquer chamada a `src/data/*` — direta
  ou através de um hook/tela — usa esse banco transparentemente. `sql.js`
  recompila seu módulo asm.js uma vez por arquivo de teste (custo pago pelo
  primeiro teste do arquivo); por isso `jest.config.js` define `testTimeout: 20000`.
- Setup: `jest.config.js` (preset `jest-expo`, `transformIgnorePatterns` ampliado p/ RN/expo/svg/nativewind/react-query) e `jest.setup.js` (mocks de `expo-router`, `expo-font`, `expo-sqlite` — só lançado se um teste esquecer `setupTestDb()` —, `expo-crypto`, `expo-file-system`, `expo-sharing`, `expo-document-picker`; e `notifyManager.setScheduler` síncrono p/ que as notificações do React Query caiam dentro de `act()`).
- `babel.config.js` desliga o plugin NativeWind quando `api.env('test')` — o transform CSS-interop dele injeta um helper fora de escopo que quebra o hoisting de `jest.mock()`. A UI não usa `className`, então é inócuo.
- Helpers em `src/test-utils/providers.tsx` (`renderWithProviders`/`queryWrapper`, `makeQueryClient`), `src/test-utils/test-db.ts` (banco em memória) e `src/test-utils/fixtures.ts` (transações determinísticas, âncoradas em `Date.now()` — os hooks sob teste também calculam "mês atual" a partir do relógio real, então as fixtures usam offsets em vez de datas fixas).
- Specs: `src/data/*.test.ts` (impulse, reports, migrations, transactions, backup — a lógica de negócio portada da antiga API), `src/utils/*.test.ts` (funções puras), `src/services/transform.test.ts`, `src/services/hooks.test.tsx` (React Query sobre o banco de teste), `src/components/__tests__/*` (Icon, TabBar), `src/screens/**/*.test.tsx` (Add, Welcome, smoke das telas).
- **Pin de versões (NÃO desfazer):** `react`, `react-dom` e `react-test-renderer` DEVEM ser exatamente **`19.2.3`** — o RN 0.86.3 embute `react-native-renderer@19.2.3` no bundle e peer-requer `react@^19.2.3`. Qualquer outra versão (ex: o `19.2.7` que o `react-dom` mais novo arrastava) quebra o app em runtime ("Incompatible React versions: react vs react-native-renderer") E o renderer do jest ("Can't access .root on unmounted test renderer"). O `overrides` no `package.json` raiz força `react`/`react-dom`/`react-test-renderer` a 19.2.3. `tsconfig.json` precisa de `"types": ["jest"]` (o auto-include do @types hoisted não pega com `moduleResolution: bundler`).
