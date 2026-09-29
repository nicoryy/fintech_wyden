# CLAUDE.md — app/ (Expo Router)

Roteamento file-based. O entry é `expo-router/entry` (`package.json` `main`).
Os arquivos em `app/` apenas **re-exportam** a tela correspondente de
`src/screens/*` — toda a UI mora em `src/`, mantendo as rotas finas.

## Árvore de rotas
```
_layout.tsx            Stack raiz + providers (QueryClient, CatalogProvider,
                       SafeArea, GestureHandler), carregamento de fontes
                       (SplashScreen segura o render até Plus Jakarta Sans
                       carregar) e o guard de onboarding (ver abaixo).
welcome.tsx             Onboarding — só o nome, sem login (ver root CLAUDE.md)
edit-name.tsx           "Editar nome" — presentation: 'modal'
(tabs)/_layout.tsx     Tab navigator (expo-router/js-tabs) com TabBar custom.
(tabs)/index.tsx       Início (Dashboard)
(tabs)/transactions.tsx Transações
(tabs)/reports.tsx     Relatórios
(tabs)/profile.tsx     Perfil (nome local + backup)
transaction/add.tsx    "Nova transação" — presentation: 'modal'
insight.tsx            Insight comportamental — presentation: 'transparentModal'
                       (bottom sheet sobre scrim translúcido)
```

## Guard de onboarding (`_layout.tsx`)
Não existe mais autenticação — o guard olha só se `useProfile()` já tem um
nome salvo: sem nome → `router.replace('/welcome')`; com nome, se ainda estiver
em `/welcome` → `router.replace('/(tabs)')`. Enquanto a query está pendente,
nada é redirecionado. Se o banco local falhar ao abrir, a tela mostra um
`ErrorState` com "Tentar novamente" em vez de ficar em branco.

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
- O lápis no Perfil abre `/edit-name`.
- O modal de add, o modal de editar nome e o sheet de insight fecham com
  `router.back()`.
