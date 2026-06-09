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
- Axios configurado em `src/services/api.ts` (pronto para a API; ainda não usado)
- React Hook Form + Zod disponíveis para formulários futuros

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
  _layout.tsx                <- providers (QueryClient, SafeArea, Gesture) + fontes + Stack
  (tabs)/
    _layout.tsx              <- Tabs com TabBar custom (FAB central)
    index.tsx                <- Início/Dashboard
    transactions.tsx         <- Transações
    reports.tsx              <- Relatórios
    profile.tsx              <- Perfil (placeholder)
  transaction/add.tsx        <- Adicionar transação (modal)
  insight.tsx                <- Insight comportamental (transparentModal/bottom sheet)
src/
  components/                <- Card, Icon, Press, Txt, ProgressBar, TabBar
    charts/                  <- Sparkline, Donut, ProgressRing (react-native-svg)
  screens/                   <- 1 pasta por tela (a UI vive aqui; app/* só re-exporta)
    dashboard/ transactions/ reports/ add/ insight/ profile/
  services/                  <- camada de dados
    api.ts                   <- instância axios (ponto de troca p/ API)
    types.ts                 <- tipos de domínio (alinhados a @wyden/shared + entities)
    hooks.ts                 <- hooks React Query (useDashboard, useTransactions, ...)
    mock/                    <- catalog.ts (CATS/INCOME_CATS/BANKS) + data.ts (seeds)
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

## Dados: mock hoje, API depois (ponto de troca)
Não há backend rodando. Os hooks em `src/services/hooks.ts` resolvem os mocks de
`src/services/mock/data.ts` via `Promise.resolve`. **Para ligar a API real, troque
apenas o corpo de cada `queryFn`/`mutationFn` por uma chamada `api.<verbo>(...)`**
(há comentários `// SWAP:` em cada hook). A camada de componentes não muda — só
consome os hooks. `api.ts` já tem baseURL (`extra.apiUrl` → `EXPO_PUBLIC_API_URL`
→ `http://localhost:3000/api/v1`) e `setAuthToken`. Os tipos em `types.ts`
reaproveitam os enums de `@wyden/shared` e espelham as entities do backend.

## Regras
- **Purple `#7C5CFC` (`colors.purple*`) é EXCLUSIVO de insight comportamental.**
- Tudo tipado; sem `any`. Lógica de formatação/cálculo isolada em `src/utils`
  (funções puras). Hooks separados da UI.
- Componentes de UI seguem pixel-perfect o protótipo.
- Acessibilidade: `accessibilityRole`/`accessibilityLabel` nos toques principais.

## Validação
- `npm run typecheck` (ou `npx tsc --noEmit`) → zero erros
- `npm run lint` (ESLint flat config + `eslint-config-expo`) → zero erros
- `npx expo export --platform android` → bundle compila sem erro de resolução
```
