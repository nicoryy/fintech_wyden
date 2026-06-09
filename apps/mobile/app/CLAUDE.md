# CLAUDE.md — app/ (Expo Router)

Roteamento file-based. O entry é `expo-router/entry` (`package.json` `main`).
Os arquivos em `app/` apenas **re-exportam** a tela correspondente de
`src/screens/*` — toda a UI mora em `src/`, mantendo as rotas finas.

## Árvore de rotas
```
_layout.tsx            Stack raiz + providers (QueryClient, SafeArea,
                       GestureHandler), carregamento de fontes (SplashScreen
                       segura o render até Plus Jakarta Sans carregar).
(tabs)/_layout.tsx     Tab navigator (expo-router/js-tabs) com TabBar custom.
(tabs)/index.tsx       Início (Dashboard)
(tabs)/transactions.tsx Transações
(tabs)/reports.tsx     Relatórios
(tabs)/profile.tsx     Perfil (placeholder)
transaction/add.tsx    "Nova transação" — presentation: 'modal'
insight.tsx            Insight comportamental — presentation: 'transparentModal'
                       (bottom sheet sobre scrim translúcido)
```

## TabBar com FAB central
A barra inferior é **custom** (`src/components/TabBar.tsx`), plugada via prop
`tabBar` do `<Tabs>`. Ordem do design: Início, Transações, **[ + ]**, Relatórios,
Perfil. O "+" central é um FAB elevado (verde, `marginTop: -24`, borda do card)
que **não é uma rota de tab** — ele faz `router.push('/transaction/add')` (modal).
Os 4 tabs reais usam `navigation.navigate(name)`. Insets de safe-area são
aplicados no `paddingBottom` da barra.

## Navegação entre telas
- Cards "Ver todas" no Dashboard navegam para `/(tabs)/reports` e
  `/(tabs)/transactions`.
- InsightCard (Dashboard) e BehaviorCompare (Relatórios) abrem `/insight`.
- O modal de add e o sheet de insight fecham com `router.back()`.
