# CLAUDE.md — apps/mobile

Frontend mobile React Native + Expo para o Wyden. Recria, pixel-perfect, o
protótipo em `design_bundle/fintech-wyden/`.

## Stack
- Expo SDK 56, React Native 0.85, TypeScript (strict)
- **Expo Router** (file-based, `app/`) — entry: `expo-router/entry` (ver `package.json` `main`)
- **React Query** (@tanstack/react-query) para data fetching/cache
- **react-native-svg** para ícones e gráficos (sparkline, donut, ring)
- **Plus Jakarta Sans** via `@expo-google-fonts/plus-jakarta-sans` + `expo-font`
- NativeWind 4 configurado (preset no babel + tokens no `tailwind.config.js`),
  mas a UI usa majoritariamente `StyleSheet`/estilos inline para fidelidade
  pixel-perfect (ver decisão abaixo)
- Axios em `src/services/api.ts` — **ligado à API real** (interceptors de Bearer
  token + refresh em 401). Os hooks consomem a API (não há mais mocks runtime).
- React Hook Form + Zod usados nas telas de login/registro
- `expo-secure-store` para guardar os tokens JWT (access + refresh)

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
  _layout.tsx                <- providers (QueryClient, Auth, Catalog, SafeArea,
                                Gesture) + fontes + Stack + route guard
  login.tsx / register.tsx   <- telas de auth (re-export de src/screens/auth)
  (tabs)/
    _layout.tsx              <- Tabs com TabBar custom (FAB central)
    index.tsx                <- Início/Dashboard
    transactions.tsx         <- Transações
    reports.tsx              <- Relatórios
    profile.tsx              <- Perfil (usuário real + logout)
  transaction/add.tsx        <- Adicionar transação (modal)
  insight.tsx                <- Insight comportamental (transparentModal/bottom sheet)
src/
  components/                <- Card, Icon, Press, Txt, ProgressBar, TabBar
    charts/                  <- Sparkline, Donut, ProgressRing (react-native-svg)
  context/                   <- AuthContext (sessão/guard) + CatalogContext (cat/bancos)
  screens/                   <- 1 pasta por tela (a UI vive aqui; app/* só re-exporta)
    dashboard/ transactions/ reports/ add/ insight/ profile/ auth/
  services/                  <- camada de dados
    api.ts                   <- axios + interceptors (Bearer + refresh 401)
    api-types.ts             <- shapes BRUTOS da API (amount string, etc.)
    transform.ts             <- transforms PUROS API→UI (testáveis)
    auth.ts / auth-storage.ts<- serviço de auth + tokens no SecureStore
    types.ts                 <- tipos de domínio (alinhados a @wyden/shared + entities)
    hooks.ts                 <- hooks React Query reais (useDashboard, useBanks, ...)
    mock/                    <- catalog.ts (fallback de ícones) + data.ts (fixtures dev)
  test-utils/                <- providers + api-fixtures (mock de axios p/ testes)
  theme/                     <- tokens.ts (cores/raios/sombras), fonts.ts
  utils/                     <- format.ts (brl/brlParts), charts.ts (sparkPaths/donutSegments)
```

## Componentes de gráfico
Todos em `src/components/charts/`, sobre `react-native-svg`, usando geradores de
path puros em `src/utils/charts.ts`:
- `Sparkline` — linha suave + área com gradiente + ponta (BalanceCard)
- `Donut` — anel segmentado com label central (CategoryCard)
- `ProgressRing` — anel de progresso com % central (GoalCard)
Barras simples (Comparativo mensal, CategoryBars, BankBreakdown, padrão semanal
do insight) são `View`s flex; `ProgressBar` é um componente reutilizável.

## Dados: API real (NestJS)
Os hooks em `src/services/hooks.ts` chamam a API real via `api` (axios) e passam
as respostas pelos transforms PUROS de `src/services/transform.ts` para produzir
os tipos de UI de `types.ts`. **As queryKeys e os tipos de retorno são idênticos
aos da versão mock — a camada de componentes não mudou.**

- `useDashboard`/`useReports` compõem várias chamadas via `Promise.all`.
- `useTransactions` agrupa por dia (`groupByDay`).
- `useCreateTransaction` faz `POST /transactions` (envia `transactionDate=agora`)
  e invalida `dashboard`/`transactions`/`reports`.
- `useCategories`/`useBanks` alimentam o `CatalogContext`.

### Catálogo (categorias/bancos)
As telas resolvem ícone/cor/label por id via `useCatalog().catById/bankById`
(`src/context/CatalogContext.tsx`), que carrega categorias e bancos da API uma
vez. `src/services/mock/catalog.ts` permanece como **fallback de ícones/cores**
(se um id não estiver carregado) — não é mais a fonte primária.

### Transforms (decisões — o que é "derivado")
- **amount**: a API manda `amount` como string decimal positiva; a UI usa valor
  SINALIZADO (`expense` → negativo) via `signedAmount`.
- **Bank.ink**: derivado por luminância — tile claro (ex. amarelo do BB) → ink
  escuro `#1B1D21`; senão `#FFFFFF`. `cash = name==='Dinheiro'`. `short` derivado
  das 2 primeiras letras se vier null.
- **evolution** (sparkline do Dashboard): **DERIVADO** de
  `/reports/monthly-comparison` — soma acumulada de (receitas−despesas) por mês,
  normalizada 0..1. O backend não expõe série de patrimônio.
- **behavior** (Relatórios): **DERIVADO** (heurística Fase 1) — compara a % de
  transações `isImpulse` do mês atual vs anterior; "—" quando faltam dados. A
  engine real de insights é Fase 2.
- **insight**: **DERIVADO** de `GET /insights` (flat na Fase 1) → mapeado no
  `InsightDetail`; `weeklyPattern`/`tip` ficam como placeholders visuais até a
  engine da Fase 2. Lista vazia → empty-state amigável.
- **goal**: `/goals[0]` ou um placeholder zerado (Fase 3).

## Auth
Camada nova de autenticação real (JWT access + refresh):
- `auth-storage.ts`: tokens no `expo-secure-store` (in-memory no web).
- `auth.ts`: `register`/`login`/`me`/`logout` sobre a API.
- `api.ts`: interceptor de request anexa `Bearer`; em 401 tenta `POST
  /auth/refresh` **uma vez** e repete a request; se falhar, limpa tokens e
  dispara `onAuthFailure` (logout).
- `context/AuthContext.tsx`: `{user, status:'loading'|'authed'|'guest'}` +
  `signIn`/`signUp`/`signOut`. No mount valida o token guardado com `/auth/me`.
- **Route guard** em `app/_layout.tsx` (`RootNavigator`): `guest` → `/login`,
  `authed` fora das rotas de auth → `/(tabs)`.
- Telas: `app/login.tsx`, `app/register.tsx` (React Hook Form + Zod; erros de
  validação e de API exibidos inline). `Field` compartilhado entre as duas.

## Config de host (API_BASE_URL)
`api.ts` resolve `extra.apiUrl` → `EXPO_PUBLIC_API_URL` →
`http://localhost:3000/api/v1`. **No emulador Android, `localhost` aponta para o
próprio emulador** — use `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1` para
alcançar a API na máquina host. iOS simulator pode usar `localhost`.

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
- `npx expo export --platform android` → bundle compila sem erro de resolução

## Testes
- **jest-expo** + **@testing-library/react-native 13.3.3** + **react-test-renderer**.
- Setup: `jest.config.js` (preset `jest-expo`, `transformIgnorePatterns` ampliado p/ RN/expo/svg/nativewind/react-query/@wyden) e `jest.setup.js` (mocks de `expo-router`, `expo-font` e `expo-secure-store`; e `notifyManager.setScheduler` síncrono p/ que as notificações do React Query caiam dentro de `act()`).
- `babel.config.js` desliga o plugin NativeWind quando `api.env('test')` — o transform CSS-interop dele injeta um helper fora de escopo que quebra o hoisting de `jest.mock()`. A UI não usa `className`, então é inócuo.
- Helpers em `src/test-utils/providers.tsx` (`renderWithProviders` agora inclui o `CatalogProvider`, `queryWrapper`, `makeQueryClient`) e `src/test-utils/api-fixtures.ts` (mock de `api.get`/`api.post` por URL — os testes exercitam os transforms reais sobre fixtures).
- Os testes de hooks/telas fazem `jest.mock('.../services/api')` para resolver fixtures sem rede. O override de ESLint em `eslint.config.js` libera `require()`/`import/first` apenas nos `*.test.*` (necessário p/ o hoisting do `jest.mock`).
- Specs: `src/utils/*.test.ts` (funções puras), `src/services/transform.test.ts` (todos os transforms), `src/services/hooks.test.tsx` (React Query c/ axios mockado), `src/services/auth-storage.test.ts`, `src/context/AuthContext.test.tsx`, `src/components/__tests__/*` (Icon, TabBar), `src/screens/**/*.test.tsx` (Add + smoke das telas).
- **Pin de versões (NÃO desfazer):** `react`, `react-dom` e `react-test-renderer` DEVEM ser exatamente **`19.2.3`** — o RN 0.85.3 embute `react-native-renderer@19.2.3` no bundle e peer-requer `react@^19.2.3`. Qualquer outra versão (ex: o `19.2.7` que o `react-dom` mais novo arrastava) quebra o app em runtime ("Incompatible React versions: react vs react-native-renderer") E o renderer do jest ("Can't access .root on unmounted test renderer"). O `overrides` no `package.json` raiz força `react`/`react-dom`/`react-test-renderer` a 19.2.3. `tsconfig.json` precisa de `"types": ["jest"]` (o auto-include do @types hoisted não pega com `moduleResolution: bundler`).
```
