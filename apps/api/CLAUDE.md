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
- **transactions**: Transações com flag isImpulse
- **insights**: Engine de análise comportamental (gerado automaticamente)
- **goals**: Metas financeiras

## Regras
- Todas as rotas (exceto auth e POST /users/register) exigem JwtAuthGuard
- DTOs sempre com class-validator decorators
- Entities TypeORM com synchronize=true apenas em development
- Nunca expor passwordHash nas responses (usar @Exclude() + ClassSerializerInterceptor)
- Prefixo global: /api/v1
- Transações devem atualizar currentBalance do Bank ao serem criadas/deletadas
- isImpulse=true quando: transação é despesa, valor > média de gastos do usuário em 7 dias, criada entre 20h-23h59 ou no final de semana (lógica no InsightsService)

## Database
- PostgreSQL via Docker (localhost:5432)
- synchronize: true apenas em development/test
- Migrations para production: `npm run migration:generate` e `npm run migration:run`

## Endpoints base
- POST /api/v1/auth/login
- POST /api/v1/users/register
- GET/PATCH/DELETE /api/v1/users/:id
- CRUD /api/v1/banks
- CRUD /api/v1/categories
- CRUD /api/v1/transactions
- GET /api/v1/insights
- CRUD /api/v1/goals
