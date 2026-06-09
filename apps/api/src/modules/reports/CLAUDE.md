# CLAUDE.md — modules/reports

Módulo de relatórios/agregações financeiras do Wyden. Apenas leitura — não
muta dados. Injeta o repositório de `Transaction` (read-only) via
`TypeOrmModule.forFeature([Transaction])`.

## Regras gerais
- Tudo protegido por `JwtAuthGuard`.
- Todas as agregações são **isoladas por `userId`** (filtro obrigatório no `where`).
- O parâmetro `month` é sempre `YYYY-MM`; quando ausente, usa o **mês atual**.
- Validação do `month` via regex `^\d{4}-(0[1-9]|1[0-2])$` no DTO.
- Valores monetários vêm como `decimal` (string) do TypeORM — sempre `Number(x)`
  antes de somar.
- Estratégia de agregação: `find` + `reduce`/`Map` em memória (mais simples e
  legível que QueryBuilder para o volume da Fase 1). Trocar por QueryBuilder
  agregado se o volume crescer.

## Janela de mês (`monthRange`)
- `start` = primeiro dia do mês às 00:00:00.000.
- `end` = último dia do mês às 23:59:59.999 (cobre colunas `date` e `timestamp`).
- Filtra com `Between(start, end)` sobre `transactionDate`.

## Endpoints

### `GET /reports/summary?month=YYYY-MM`
Retorna `{ receitas, despesas, saldo, economia }`:
- `receitas` = soma de transações INCOME do mês.
- `despesas` = soma de transações EXPENSE do mês.
- `saldo` = `receitas - despesas`.
- `economia` = espelha o saldo (resultado líquido / quanto foi poupado no mês).

### `GET /reports/by-category?month=YYYY-MM&type=expense|income`
- `type` default = `expense`.
- Agrupa por `categoryId`, carrega a relação `category` para expor `name/icon/color`.
- `pct` = participação (%) da categoria no total do tipo no mês.
- Ordenado por `total` desc. Itens: `{ categoryId, name, icon, color, total, pct }`.

### `GET /reports/by-bank?month=YYYY-MM`
- Considera apenas **despesas** (movimento de saída por banco).
- Agrupa por `bankId`, carrega a relação `bank` para o `name`.
- Ordenado por `total` desc. Itens: `{ bankId, name, total }`.

### `GET /reports/monthly-comparison?months=N`
- `months` default = 6, range válido 1..24 (validado no DTO).
- Retorna os últimos N meses (mais antigo primeiro), `[{ month, receitas, despesas }]`.
- Meses sem transações vêm **zerados** (buckets pré-criados na janela).
