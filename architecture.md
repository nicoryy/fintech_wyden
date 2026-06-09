# Arquitetura do Sistema

## Visão Geral

Arquitetura baseada em aplicação mobile com backend centralizado e banco de dados relacional.

```text
Mobile App
    |
API REST
    |
Business Rules
    |
PostgreSQL
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
└── Settings
```

---

## Backend

### Stack

* Node.js
* NestJS
* TypeScript

### Módulos

```text
Backend
├── Auth
├── Users
├── Transactions
├── Banks
├── Categories
├── Reports
├── Insights
└── Goals
```

---

## Banco de Dados

### User

```sql
id
name
email
password_hash
created_at
updated_at
```

### Bank

```sql
id
user_id
name
initial_balance
current_balance
created_at
```

### Category

```sql
id
name
type
created_at
```

### Transaction

```sql
id
user_id
bank_id
category_id
amount
type
description
transaction_date
created_at
```

### Insight

```sql
id
user_id
type
score
title
description
generated_at
```

### Goal

```sql
id
user_id
title
target_amount
current_amount
deadline
status
```

---

## Camada de Insights

Responsável pela análise comportamental.

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

## Segurança

### Autenticação

* JWT
* Refresh Token

### Criptografia

* bcrypt

### Proteção

* Rate Limiting
* Validation Pipes
* Input Sanitization

---

## Infraestrutura

### Ambiente

Docker

### Serviços

```
VPS
├── Frontend
├── Backend
├── PostgreSQL
├── Redis
└── Nginx
```

### Monitoramento

* Logs estruturados
* Health Checks
* Backup automático
