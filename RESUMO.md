# 📘 RESUMO — Wyden (o "livro" do projeto)

> Documento único para entender **tudo** que existe neste projeto: o que é cada
> coisa, **por que** ela existe, como se conectam, e **quais chaves/credenciais**
> usar para acessar cada serviço. Escrito para quem chega no projeto e quer o
> mapa completo sem ter que ler todo o código.

Última atualização: 2026-06-09.

---

## 1. O que é o Wyden

**Wyden** é um aplicativo mobile de **finanças pessoais com análise comportamental**.

O diferencial não é só registrar receitas e despesas (como qualquer app de
banco), mas responder **"por que você gasta dessa forma?"** — gerando *insights
comportamentais* (impulsividade, gastos emocionais, consistência, planejamento)
a partir das transações do usuário.

- **App tradicional** responde: *"onde seu dinheiro foi gasto?"*
- **Wyden** responde: *"por que você está gastando assim?"*

A cor **roxa (#7C5CFC)** é reservada exclusivamente para a parte de insight
comportamental — é a "marca" visual do diferencial do produto.

---

## 2. Visão geral da arquitetura

```
┌─────────────────────────┐
│   App Mobile (Expo RN)   │  apps/mobile
│   React Native + Expo    │
└───────────┬─────────────┘
            │ HTTP REST (JSON) + JWT
            ▼
┌─────────────────────────┐
│   API REST (NestJS)      │  apps/api
│   Regras de negócio      │
│   + Engine de Insights   │
└───────────┬─────────────┘
            │ TypeORM
            ▼
┌─────────────────────────┐
│  PostgreSQL  +  Redis    │  (Docker)
└─────────────────────────┘
```

É um **monorepo** (npm workspaces) com 3 pacotes:

| Pacote | O que é | Por que existe |
|--------|---------|----------------|
| `apps/mobile` | App React Native (Expo) | A interface que o usuário usa |
| `apps/api` | Backend NestJS | Regras de negócio, dados, autenticação |
| `packages/shared` | Tipos TypeScript compartilhados | Evitar duplicar enums/tipos entre front e back |

Cada pasta importante tem seu próprio **`CLAUDE.md`** explicando as regras
daquela área (é a documentação técnica de cada módulo).

---

## 3. Stack tecnológica (e o porquê de cada escolha)

### Frontend (`apps/mobile`)
| Tecnologia | Para quê |
|-----------|----------|
| **Expo SDK 56 / React Native 0.85** | Framework do app mobile (iOS/Android) |
| **TypeScript (strict)** | Tipagem forte, menos bugs |
| **Expo Router** | Navegação por arquivos (`app/`) |
| **React Query** | Busca/cache de dados da API |
| **React Hook Form + Zod** | Formulários (login/registro) com validação |
| **react-native-svg** | Ícones e gráficos (sparkline, donut, anel) |
| **Plus Jakarta Sans** | Fonte do design |
| **expo-secure-store** | Guardar os tokens JWT com segurança |
| **NativeWind** | Configurado, mas a UI usa StyleSheet/inline para fidelidade pixel-perfect |

### Backend (`apps/api`)
| Tecnologia | Para quê |
|-----------|----------|
| **NestJS 11** | Framework backend (módulos, injeção de dependência) |
| **TypeORM + PostgreSQL** | ORM + banco relacional |
| **JWT (access + refresh)** | Autenticação stateless |
| **bcrypt** | Hash de senhas |
| **class-validator / class-transformer** | Validação de DTOs e serialização |
| **@nestjs/throttler** | Rate limiting |

### Infra
| Tecnologia | Para quê |
|-----------|----------|
| **Docker + docker-compose** | Subir todo o ambiente local |
| **PostgreSQL 16** | Banco de dados principal |
| **Redis 7** | Cache (preparado; ainda não usado em runtime) |
| **pgAdmin** | UI web para inspecionar o banco |
| **GitHub Actions** | CI (lint, testes, build, build da imagem) |

---

## 4. Mapa de pastas

```
fintech_wyden/
├── apps/
│   ├── api/                      ← Backend NestJS
│   │   ├── src/
│   │   │   ├── modules/          ← um módulo por domínio (ver §6)
│   │   │   │   ├── auth/         ← login, refresh, /me, guards, strategies
│   │   │   │   ├── users/        ← cadastro de usuários (+ seed de bancos)
│   │   │   │   ├── banks/        ← contas bancárias
│   │   │   │   ├── categories/   ← categorias (+ seed das 15 padrão)
│   │   │   │   ├── transactions/ ← transações (+ detecção de impulso)
│   │   │   │   ├── reports/      ← agregações (dashboard, gráficos)
│   │   │   │   ├── insights/     ← análise comportamental (stub Fase 2)
│   │   │   │   └── goals/        ← metas financeiras
│   │   │   ├── common/           ← decorators, filtros, interceptors, tipos
│   │   │   ├── database/         ← config TypeORM
│   │   │   └── main.ts           ← bootstrap (prefixo /api/v1, CORS, pipes)
│   │   ├── Dockerfile            ← imagem da API (multi-stage)
│   │   └── CLAUDE.md             ← regras do backend
│   │
│   └── mobile/                   ← App React Native
│       ├── app/                  ← rotas (Expo Router)
│       │   ├── _layout.tsx       ← providers + guard de rotas
│       │   ├── login.tsx         ← tela de login
│       │   ├── register.tsx      ← tela de cadastro
│       │   ├── (tabs)/           ← navegação por abas
│       │   │   ├── index.tsx     ← Dashboard/Início
│       │   │   ├── transactions.tsx
│       │   │   ├── reports.tsx
│       │   │   └── profile.tsx
│       │   ├── transaction/add.tsx  ← adicionar transação (modal)
│       │   └── insight.tsx       ← detalhe do insight (bottom sheet)
│       ├── src/
│       │   ├── components/       ← Card, Icon, TabBar, charts/
│       │   ├── context/          ← AuthContext, CatalogContext
│       │   ├── screens/          ← a UI de cada tela
│       │   ├── services/         ← api.ts, hooks.ts, transform.ts, auth.ts
│       │   ├── theme/            ← tokens de cor/fonte
│       │   └── utils/            ← formatação (R$), geometria dos gráficos
│       └── CLAUDE.md             ← regras do frontend
│
├── packages/shared/             ← tipos/enums compartilhados (@wyden/shared)
├── design_bundle/               ← protótipo original do Claude Design (referência)
├── docker-compose.yml           ← stack: postgres, redis, api, pgadmin
├── .github/workflows/ci.yml     ← pipeline de CI
├── .githooks/pre-push           ← roda o CI antes de cada push
├── CLAUDE.md                    ← guia geral do repositório
└── RESUMO.md                    ← este documento
```

---

## 5. Banco de dados (tabelas e por que existem)

Todas as chaves primárias são **UUID**. Tudo é isolado por `user_id`
(cada usuário só vê os próprios dados).

| Tabela | Para que serve | Campos principais |
|--------|----------------|-------------------|
| **users** | Quem usa o app | id, name, email, **password_hash**, created_at, updated_at |
| **banks** | Contas/carteiras do usuário | id, user_id, name, **short**, **color**, initial_balance, current_balance |
| **categories** | Tipos de gasto/receita | id, name, type (income/expense), icon, color |
| **transactions** | Cada receita/despesa | id, user_id, bank_id, category_id, amount, type, description, transaction_date, **is_impulse** |
| **insights** | Análises comportamentais geradas | id, user_id, type, score, title, description, generated_at |
| **goals** | Metas financeiras | id, user_id, title, target_amount, current_amount, deadline, status |

**Por que `short`/`color` no banco?** O app desenha "tiles" coloridos para cada
conta (Nubank roxo, Itaú laranja…). Esses campos guardam o visual de cada conta.

**Por que `is_impulse` na transação?** É a base da análise comportamental — marca
compras feitas por impulso (ver regra em §6).

> **Schema automático:** em desenvolvimento/Docker o TypeORM cria as tabelas
> sozinho (`synchronize`). Em produção real, o correto é usar *migrations*.

---

## 6. Backend — módulos, endpoints e regras de negócio

Prefixo de todas as rotas: **`/api/v1`**. Tudo (exceto login e cadastro) exige
o header `Authorization: Bearer <access_token>`.

### Endpoints

| Método | Rota | O que faz | Auth? |
|--------|------|-----------|-------|
| POST | `/users/register` | Cria usuário **e seeda 6 bancos padrão** | ❌ |
| POST | `/auth/login` | Retorna `access_token` + `refresh_token` + user | ❌ |
| POST | `/auth/refresh` | Novo access token a partir do refresh | ❌ |
| GET | `/auth/me` | Perfil do usuário logado | ✅ |
| GET/POST/PATCH/DELETE | `/banks` | CRUD de contas | ✅ |
| GET/POST/DELETE | `/categories` | Categorias (+ `POST /categories/seed`) | ✅ |
| GET/POST/PATCH/DELETE | `/transactions` | CRUD de transações (GET aceita filtros) | ✅ |
| GET | `/reports/summary` | Receitas/despesas/saldo/economia do mês | ✅ |
| GET | `/reports/by-category` | Gastos por categoria (com %) | ✅ |
| GET | `/reports/by-bank` | Gastos por banco | ✅ |
| GET | `/reports/monthly-comparison` | Receitas × despesas dos últimos N meses | ✅ |
| GET/POST/PATCH/DELETE | `/goals` | Metas | ✅ |
| GET | `/insights` | Insights comportamentais | ✅ |

### Regras de negócio importantes

**Seed automático no cadastro:** ao registrar, o usuário já ganha:
- **15 categorias padrão** (Alimentação, Delivery, Transporte, Salário…)
- **6 contas bancárias** (Nubank, Banco do Brasil, Caixa, Itaú, Inter, Dinheiro)

Assim o app é utilizável imediatamente, sem o usuário ter que cadastrar tudo.

**Saldo do banco:** toda transação ajusta o `current_balance` da conta
(receita soma, despesa subtrai). Editar ou apagar uma transação reverte o efeito
antigo e aplica o novo corretamente.

**Detecção de impulso (`is_impulse`):** uma despesa é marcada como impulsiva
quando **todas** as condições valem:
1. é uma **despesa**;
2. acontece **à noite (≥ 20h)** OU **no fim de semana**;
3. o valor é **acima da média de gastos** do usuário nos últimos 7 dias
   (se não há histórico, usa o limite fixo de R$ 100).

**Senha nunca vaza:** o `password_hash` é marcado com `@Exclude()` e nunca
aparece nas respostas da API.

---

## 7. Frontend — telas e camada de dados

### Telas
| Tela | Arquivo | O que mostra |
|------|---------|--------------|
| **Login / Registro** | `app/login.tsx`, `app/register.tsx` | Autenticação (entrada no app) |
| **Início (Dashboard)** | `(tabs)/index.tsx` | Saldo, gráfico de evolução, insight, gastos por categoria, meta, atividade recente |
| **Transações** | `(tabs)/transactions.tsx` | Lista agrupada por dia, filtros (todas/receitas/despesas/impulso) |
| **Relatórios** | `(tabs)/reports.tsx` | Economia, comparativo mensal, gastos por categoria/banco, leitura comportamental |
| **Adicionar** | `transaction/add.tsx` | Teclado numérico, categoria, banco — cria a transação |
| **Perfil** | `(tabs)/profile.tsx` | Dados do usuário + botão "Sair" |
| **Insight** | `insight.tsx` | Detalhe do gasto por impulso (bottom sheet) |

### Como os dados chegam na tela
1. A tela usa um **hook** (`useDashboard`, `useTransactions`, etc.) do
   `src/services/hooks.ts`.
2. O hook chama a **API real** via `api` (axios) — `src/services/api.ts`.
3. A resposta crua passa pelos **transforms puros** (`src/services/transform.ts`)
   que convertem o formato da API no formato que o design espera.

**Dados "derivados" (honestidade técnica):** alguns elementos visuais do design
ainda não têm fonte direta na API e são **calculados de forma simples** a partir
do que existe (documentado para a Fase 2 refinar):
- **Gráfico de evolução (sparkline):** derivado do saldo acumulado dos últimos meses.
- **Leitura comportamental (Relatórios):** heurística simples de % de impulso.
- **Detalhe de insight (padrão semanal/dica):** placeholders visuais até a engine da Fase 2.
- **Meta:** usa a primeira meta cadastrada, ou um placeholder zerado.

### Catálogo (categorias e bancos)
O `CatalogContext` carrega categorias e bancos da API **uma vez** e as telas
resolvem ícone/cor/nome por id. Isso evita refazer essas chamadas em cada tela.

---

## 8. Autenticação e segurança (o fluxo completo)

```
Registro/Login → API devolve access_token (7 dias) + refresh_token (30 dias)
   │
   ├─ tokens salvos no expo-secure-store (armazenamento seguro do device)
   │
   ├─ toda request leva "Authorization: Bearer <access_token>"
   │
   └─ se a API responde 401 (token expirou):
        → o app tenta UMA vez POST /auth/refresh com o refresh_token
        → se der certo, repete a request original
        → se falhar, limpa os tokens e volta para a tela de login
```

- O **AuthContext** controla o estado da sessão (`loading` / `authed` / `guest`)
  e o **guard de rotas** redireciona: sem sessão → `/login`; com sessão → abas.
- As senhas são guardadas no banco apenas como **hash bcrypt**.

---

## 9. 🔑 Chaves, credenciais e portas (acesso a tudo)

> ⚠️ Estas são credenciais de **desenvolvimento local**. Em produção, **troque
> todos os segredos** (especialmente os JWT) e nunca os comite.

### Banco de dados (PostgreSQL)
| Item | Valor |
|------|-------|
| Host (local) | `localhost` |
| Host (dentro do Docker) | `postgres` |
| Porta | `5432` |
| Database | `wyden_db` |
| Usuário | `wyden` |
| Senha | `wyden_secret` |

### Redis
| Item | Valor |
|------|-------|
| Host | `localhost` (ou `redis` no Docker) · Porta `6379` |

### pgAdmin (UI web do banco) — `http://localhost:5050`
| Item | Valor |
|------|-------|
| E-mail | `admin@wyden.com` |
| Senha | `admin` |
| Para conectar ao banco lá dentro | host `postgres`, porta `5432`, user `wyden`, senha `wyden_secret` |

### API (NestJS) — `http://localhost:3000`
| Item | Valor |
|------|-------|
| Base URL | `http://localhost:3000/api/v1` |
| Porta | `3000` |
| `JWT_SECRET` | `change-this-secret-in-production` |
| `JWT_EXPIRES_IN` | `7d` (validade do access token) |
| `JWT_REFRESH_SECRET` | `change-this-refresh-secret-in-production` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` (validade do refresh token) |

Essas variáveis ficam em `apps/api/.env` (local) e no bloco `environment` do
serviço `api` no `docker-compose.yml` (container).

### App mobile → API
- Default: `http://localhost:3000/api/v1`.
- **Emulador Android:** `localhost` aponta para o próprio emulador. Use
  `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1` para alcançar a API na máquina.
- iOS simulator pode usar `localhost`.

### Git
| Item | Valor |
|------|-------|
| Autor | Pedro Nicory · `pedronicory@gmail.com` |
| Branch principal de trabalho | `master` |

---

## 10. Docker e infraestrutura

`docker-compose.yml` sobe 4 serviços numa rede interna (`wyden-network`):

| Serviço | Imagem | Porta | Para quê |
|---------|--------|-------|----------|
| `postgres` | postgres:16-alpine | 5432 | Banco de dados (com healthcheck) |
| `redis` | redis:7-alpine | 6379 | Cache (com healthcheck) |
| `api` | build de `apps/api/Dockerfile` | 3000 | Backend (espera os healthchecks) |
| `pgadmin` | dpage/pgadmin4 | 5050 | UI do banco |

- A imagem da API é **multi-stage** (`node:22-alpine`): compila o TypeScript,
  compila o bcrypt nativo, remove dependências de dev e roda como usuário **não-root**.
- No container, a API roda com `NODE_ENV=production` mas com `DB_SYNCHRONIZE=true`
  para criar o schema automaticamente (conveniência local; produção real usaria migrations).

### ⚠️ Nota Docker no Windows
O comando `docker` pode não estar no PATH dos terminais. Se não funcionar, use o
caminho completo `C:\Program Files\Docker\Docker\resources\bin\docker.exe`, ou
adicione `...\resources\bin` ao PATH (também necessário para o
`docker-credential-desktop` ao baixar imagens).

---

## 11. CI/CD (local-first)

Filosofia **local-first**: o mesmo pipeline roda na sua máquina e no GitHub.

- **`npm run ci`** (na raiz) = `typecheck` + `lint` + `test` + `build` para API e
  mobile. Hoje: **179 testes** (95 backend + 84 mobile).
- **`.github/workflows/ci.yml`** roda exatamente isso em cada push/PR (Node 22),
  mais um job que builda a imagem Docker da API.
- **`.githooks/pre-push`** roda o `npm run ci` antes de cada push (ative com
  `npm run setup:hooks`). Para pular numa emergência: `git push --no-verify`.

---

## 12. Como rodar o projeto (passo a passo)

### Pré-requisitos
- Node.js, npm, Docker Desktop.

### 1) Instalar dependências (na raiz)
```bash
npm install
```

### 2) Subir a infraestrutura + API (Docker)
```bash
npm run docker:up      # sobe postgres, redis, api, pgadmin
npm run docker:logs    # acompanhar os logs (opcional)
```
A API fica em `http://localhost:3000/api/v1`. No primeiro boot ela cria o schema
e seeda as 15 categorias.

### 3) Rodar o app mobile
```bash
npm run mobile         # abre o Expo
```
Abra no Expo Go (celular) ou num emulador. **No emulador Android**, configure
`EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1`.

### 4) Primeiro uso
- Crie uma conta na tela de **Registro** → você já entra com 15 categorias e 6
  contas. Adicione transações pelo botão **+**.

### Comandos úteis
| Comando | O que faz |
|---------|-----------|
| `npm run ci` | Roda toda a validação (typecheck/lint/test/build) |
| `npm run docker:up` / `docker:down` | Sobe / derruba o Docker |
| `npm run docker:build` | Rebuilda as imagens |
| `npm run api` | Roda a API local (fora do Docker, modo watch) |
| `npm run mobile` | Inicia o Expo |
| `npm run setup:hooks` | Ativa o git hook de pre-push |

---

## 13. Testes

| Onde | Quantos | O que cobrem |
|------|---------|--------------|
| Backend (`apps/api`) | 95 testes | Lógica de negócio: impulso, saldo, reports, auth, seed |
| Mobile (`apps/mobile`) | 84 testes | Transforms, hooks, auth, componentes, smoke das telas |

Estratégia: **testes unitários com mocks** (sem precisar de banco) para rodar
rápido e em qualquer ambiente. Testes de integração/e2e contra o PostgreSQL real
são um próximo passo do pipeline.

---

## 14. Status atual e próximos passos

### ✅ Pronto e validado
- **Fase 1 (MVP)** do backend: auth, users, banks, categories, transactions, reports, goals.
- **Frontend** completo: todas as telas do design + login/registro/perfil.
- **Integração mobile ↔ API**: o app consome dados reais (não há mais mocks em runtime).
- **Docker** local completo + **CI/CD** local-first.

### 🔜 Próximos passos sugeridos
- **Engine de Insights (Fase 2):** substituir os dados "derivados" (evolução,
  leitura comportamental, padrão semanal de impulso) por cálculos reais do
  motor de análise comportamental.
- **Metas (Fase 3):** telas de criação/acompanhamento de metas e reserva de emergência.
- **Migrations** do banco para produção (substituir o `synchronize`).
- **Testes de integração/e2e** contra PostgreSQL real no CI.
- **Data picker** na tela de adicionar (hoje a data é sempre "hoje").

### Itens conhecidos deixados para depois
- Linhas de configuração no Perfil (Contas, Categorias, Notificações, Sobre) são
  placeholders visuais.
- O detalhe do insight (padrão semanal e dica) é visual até a engine da Fase 2.

---

*Para detalhes técnicos de cada área, veja o `CLAUDE.md` dentro de
`apps/api`, `apps/mobile`, `apps/api/src/modules/reports` e `packages/shared`.*
