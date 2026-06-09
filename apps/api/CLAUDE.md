# CLAUDE.md — apps/api

Backend NestJS para o Wyden.

## Stack
- NestJS + TypeScript
- TypeORM + PostgreSQL
- JWT (access + refresh token)
- bcrypt para senhas
- class-validator + class-transformer para DTOs
- @nestjs/throttler para rate limiting

## Módulos
- **auth**: Login, registro, refresh token, guards JWT/Local
- **users**: CRUD de usuários
- **banks**: Contas bancárias por usuário
- **categories**: Categorias de transações (seed com defaults)
- **transactions**: Transações com flag isImpulse + filtros
- **reports**: Agregações financeiras (summary, por categoria, por banco, comparação mensal)
- **insights**: Engine de análise comportamental (gerado automaticamente)
- **goals**: Metas financeiras

## Regras
- Todas as rotas (exceto auth e POST /users/register) exigem JwtAuthGuard
- DTOs sempre com class-validator decorators
- Entities TypeORM com synchronize=true apenas em development
- Nunca expor passwordHash nas responses (usar @Exclude() + ClassSerializerInterceptor)
- Prefixo global: /api/v1
- Transações devem atualizar currentBalance do Bank ao serem criadas, atualizadas e deletadas

## Seed de categorias
- `CategoriesService.seedDefaults()` cria as categorias padrão do app (10 EXPENSE, 5 INCOME) com icon/color alinhados ao design do frontend.
- É **idempotente**: usa a chave `(type, name)` (case-insensitive) para não duplicar. Retorna `{ created: N }`.
- Roda automaticamente no bootstrap via `OnModuleInit` (envolto em try/catch — se o banco não estiver pronto, apenas loga um warning, não derruba a app).
- Exposto também via `POST /categories/seed` (protegido por JwtAuthGuard).

## Heurística de isImpulse (final)
Marcada no `TransactionsService.detectImpulse(userId, dto)` durante o `create` (a menos que o cliente envie `isImpulse` explícito). `isImpulse = true` quando **TODAS** as condições são verdadeiras:
1. `type === EXPENSE`;
2. ocorre em horário noturno (`hora >= 20`) **OU** em fim de semana (sábado/domingo), com base em `transactionDate`;
3. o valor é maior que a **média de gastos (EXPENSE)** do usuário nos últimos 7 dias. Se não houver histórico nos 7 dias, usa fallback fixo: `valor > 100`.

## Filtros de transações
`GET /transactions` aceita query params opcionais (validados via `QueryTransactionDto`):
`type`, `categoryId`, `bankId`, `startDate`, `endDate` (ISO date), `onlyImpulse` (bool). Datas usam `Between`/`MoreThanOrEqual`/`LessThanOrEqual`.

## Reports
Todas protegidas por JwtAuthGuard, isoladas por `userId`. Mês default = mês atual.
- `GET /reports/summary?month=YYYY-MM` → `{ receitas, despesas, saldo, economia }`
- `GET /reports/by-category?month=YYYY-MM&type=expense|income` → `[{ categoryId, name, icon, color, total, pct }]` ordenado por total desc
- `GET /reports/by-bank?month=YYYY-MM` → `[{ bankId, name, total }]` (despesas por banco)
- `GET /reports/monthly-comparison?months=6` → últimos N meses `[{ month: 'YYYY-MM', receitas, despesas }]` (meses sem dados vêm zerados)

## Refresh token
- `AuthService.login` retorna `access_token` + `refresh_token` (JWT com expiração maior, default `30d`).
- `POST /auth/refresh` recebe `{ refresh_token }`, valida assinatura/expiração e retorna novo `{ access_token }`.
- Segredo: `JWT_REFRESH_SECRET` (default para `JWT_SECRET`). Expiração: `JWT_REFRESH_EXPIRES_IN` (default `30d`).
- Refresh tokens são **stateless** nesta fase (não persistidos no banco).

## Database
- PostgreSQL via Docker (localhost:5432)
- synchronize: true apenas em development/test
- Migrations para production: `npm run migration:generate` e `npm run migration:run`

## Registro e bancos padrão
- `POST /users/register` cria o usuário E **seeda 6 contas bancárias padrão** (Nubank, Banco do Brasil, Caixa, Itaú, Inter, Dinheiro — ver `modules/banks/default-banks.ts`) com `short`/`color` alinhados ao design, para o app ter contas logo de cara.
- A entidade `Bank` tem `short` (rótulo curto do tile, ex. "Nu") e `color` (hex do tile), ambos nullable; `CreateBankDto` aceita os dois opcionalmente.

## Endpoints base
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- GET /api/v1/auth/me  (perfil do usuário logado — { id, name, email })
- POST /api/v1/users/register
- GET/PATCH/DELETE /api/v1/users/:id
- CRUD /api/v1/banks
- CRUD /api/v1/categories
- POST /api/v1/categories/seed
- CRUD /api/v1/transactions (GET aceita filtros via query)
- GET /api/v1/reports/summary
- GET /api/v1/reports/by-category
- GET /api/v1/reports/by-bank
- GET /api/v1/reports/monthly-comparison
- GET /api/v1/insights
- CRUD /api/v1/goals
