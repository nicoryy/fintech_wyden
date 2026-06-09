# CLAUDE.md — apps/mobile

Frontend mobile React Native + Expo para o Wyden.

## Stack
- Expo SDK 56+, React Native, TypeScript
- NativeWind (TailwindCSS para RN) — use classes tailwind ao invés de StyleSheet quando possível
- React Query (@tanstack/react-query) para data fetching e cache
- React Hook Form + Zod para formulários e validação
- Expo Router para navegação (file-based routing em app/)
- Axios para HTTP (configurado em src/services/api.ts)

## Estrutura
```
app/                    <- rotas (Expo Router)
  (tabs)/               <- tab navigator
    index.tsx           <- Dashboard/Início
    transactions.tsx    <- Transações
    reports.tsx         <- Relatórios
    profile.tsx         <- Perfil
  transaction/
    add.tsx             <- Adicionar transação
src/
  components/           <- componentes reutilizáveis
  services/             <- chamadas de API
  hooks/                <- custom hooks
  store/                <- estado global (zustand ou context)
  theme/                <- tokens de design
```

## Design Tokens (do protótipo)
- **Font**: Plus Jakarta Sans
- **Background**: #F3F4F6
- **Card**: #FFFFFF
- **Green** (primária/receita): #17A06A
- **Orange** (despesa): #F0742B
- **Purple** (insight comportamental): #7C5CFC — reservado EXCLUSIVAMENTE para insights
- **Ink** (texto principal): #1B1D21
- **Border-radius cards**: 22px

## Regras
- Usar NativeWind ao invés de StyleSheet sempre que possível
- Purple (#7C5CFC) APENAS para funcionalidades de insight comportamental
- Toda chamada de API deve usar React Query (useQuery/useMutation)
- Validação de formulários sempre com Zod + React Hook Form
- Componentes de UI devem seguir pixel-perfect o design do protótipo
