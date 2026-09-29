# Arquitetura do Sistema

## Visão Geral

Aplicação mobile **local-first**: todo o estado vive num banco SQLite embutido
no próprio aparelho do usuário. Não há backend, não há rede — a app é o
sistema inteiro. (Uma versão anterior rodava um backend NestJS + PostgreSQL em
Docker; foi removida por ser complexidade desnecessária para um app pessoal,
de um único usuário, cujos dados bancários não devem sair do aparelho — ver
issue #1 e o git history.)

```text
Mobile App
    |
Camada de dados (src/data)
    |
SQLite (expo-sqlite, on-device)
```

---

## Frontend

### Stack

* React Native
* Expo
* TypeScript
* NativeWind
* React Query
* React Hook Form
* Zod
* expo-sqlite / expo-crypto / expo-file-system / expo-sharing / expo-document-picker

### Módulos

```text
App
├── Dashboard
├── Transactions
├── Banks
├── Categories
├── Reports
├── Behavioral Insights
├── Goals
├── Settings
└── Backup (export/import de dados)
```

---

## Banco de Dados (local, SQLite)

Sem `user_id` em nenhuma tabela (um único usuário por aparelho). Valores em
**centavos** (inteiro); datas em **epoch ms**.

### settings

```sql
key
value
```

### categories

```sql
id
name
type
icon
color
created_at
```

### banks

```sql
id
name
short
color
initial_balance_cents
created_at
```

O saldo atual **não é uma coluna** — é calculado na leitura como
`initial_balance_cents + Σreceitas − Σdespesas` sobre a tabela `transactions`.

### transactions

```sql
id
bank_id
category_id
amount_cents
type
description
occurred_at
is_impulse
created_at
```

### goals

```sql
id
title
target_cents
current_cents
deadline
status
created_at
updated_at
```

Não existe tabela `insights`: nada nunca gerou insights de verdade (nem a
antiga API); a engine real é Fase 2.

---

## Camada de Insights

Responsável pela análise comportamental. Hoje só a heurística de impulso por
transação é real (`is_impulse`, calculada em `src/data/impulse.ts`); os
indicadores abaixo são o design da engine completa, ainda não implementada
(Fase 2 — ver `roadmap.md`).

### Indicadores

#### Impulsividade

Score de 0 a 100 baseado em:

* Frequência de compras
* Valor médio das compras
* Intervalo entre transações

#### Consistência Financeira

Baseado em:

* Estabilidade de gastos
* Cumprimento de orçamento

#### Planejamento

Baseado em:

* Reserva financeira
* Evolução patrimonial

#### Gastos Emocionais

Baseado em:

* Horário das compras
* Categorias associadas ao lazer
* Crescimento de consumo não planejado

---

## Segurança e privacidade

* **Sem login**: onboarding é só um nome, guardado localmente.
* **Sem rede**: o app nunca envia dados para fora do aparelho.
* **Backup manual**: exportar/importar um arquivo `.json` (o usuário decide
  onde guardá-lo — AirDrop, e-mail, nuvem pessoal, etc.).
* **Android**: `allowBackup: false` no `app.json` evita que o Auto Backup do
  Google suba o banco para a nuvem do usuário sem que ele peça.
* Sem criptografia adicional do arquivo do banco (`SQLCipher`) por ora —
  confia no isolamento de sandbox do sistema operacional; pode ser adicionado
  depois via migração, sem perder dados.

---

## Infraestrutura

Nenhuma. O app roda inteiramente no aparelho do usuário; o CI (GitHub Actions)
só faz typecheck/lint/test/bundle — não há deploy de servidor.
