# 📘 RESUMO — Wyden (o "livro" do projeto)

> Documento único para entender **tudo** que existe neste projeto: o que é cada
> coisa, **por que** ela existe, e como se conecta. Escrito para quem chega no
> projeto e quer o mapa completo sem ter que ler todo o código.

Última atualização: 2026-09-28.

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

**É um app pessoal, de um único usuário, 100% local.** Não existe servidor,
não existe login, não existe nuvem — todos os dados ficam num banco SQLite no
próprio aparelho (ver §2 e a issue #1 no histórico do repositório para o porquê
da mudança de arquitetura).

---

## 2. Visão geral da arquitetura

```
┌─────────────────────────┐
│   App Mobile (Expo RN)   │  apps
│   React Native + Expo    │
└───────────┬─────────────┘
            │ chamadas diretas (sem rede)
            ▼
┌─────────────────────────┐
│   src/data (regras +     │
│   queries)                │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  SQLite (expo-sqlite)    │  no aparelho do usuário
└─────────────────────────┘
```

Um app anterior rodava `apps/api` (NestJS) + PostgreSQL + Redis num
`docker-compose`, com login por JWT. Isso foi removido: para um app pessoal,
de um único usuário, manter um servidor sempre ligado (com portas, credenciais
e imagem para manter) era complexidade sem propósito — e dados bancários não
deveriam estar na nuvem de qualquer forma. A camada de negócio (saldo,
detecção de impulso, agregações de relatório, seeds) foi **portada** para
dentro do app, rodando sobre SQLite local.

É um **monorepo** (npm workspaces) com 1 pacote:

| Pacote | O que é | Por que existe |
|--------|---------|----------------|
| `apps` | App React Native (Expo), com o banco local embutido | A interface que o usuário usa — e agora também onde os dados moram |

Cada pasta importante tem seu próprio **`CLAUDE.md`** explicando as regras
daquela área (é a documentação técnica de cada módulo).

---

## 3. Stack tecnológica (e o porquê de cada escolha)

### App (`apps`)
| Tecnologia | Para quê |
|-----------|----------|
| **Expo SDK 57 / React Native 0.86** | Framework do app mobile (iOS/Android) |
| **TypeScript (strict)** | Tipagem forte, menos bugs |
| **Expo Router** | Navegação por arquivos (`app/`) |
| **React Query** | Cache/estado das leituras do banco local (não mais de uma API) |
| **React Hook Form + Zod** | Formulários (onboarding de nome, adicionar transação) com validação |
| **react-native-svg** | Ícones e gráficos (sparkline, donut, anel) |
| **Plus Jakarta Sans** | Fonte do design |
| **expo-sqlite** | Banco de dados local — substitui Postgres + a API inteira |
| **expo-crypto** | Gera os ids (`randomUUID`) das linhas criadas localmente |
| **expo-file-system / expo-sharing / expo-document-picker** | Export/import do backup `.json` |
| **NativeWind** | Configurado, mas a UI usa StyleSheet/inline para fidelidade pixel-perfect |

### Testes
| Tecnologia | Para quê |
|-----------|----------|
| **jest-expo + @testing-library/react-native** | Testes de componentes/hooks |
| **sql.js** | SQLite real (compilado para asm.js) rodando em memória nos testes — sem mocks de banco, sem módulo nativo |

---

## 4. Mapa de pastas

```
fintech_wyden/
├── apps/
│   └── mobile/                   ← App React Native (e o banco local)
│       ├── app/                  ← rotas (Expo Router)
│       │   ├── _layout.tsx       ← providers + guard de onboarding
│       │   ├── welcome.tsx       ← onboarding (só o nome, sem login)
│       │   ├── edit-name.tsx     ← editar nome (modal)
│       │   ├── (tabs)/           ← navegação por abas
│       │   │   ├── index.tsx     ← Dashboard/Início
│       │   │   ├── transactions.tsx
│       │   │   ├── reports.tsx
│       │   │   └── profile.tsx
│       │   ├── transaction/add.tsx  ← adicionar transação (modal)
│       │   └── insight.tsx       ← detalhe do insight (bottom sheet)
│       ├── src/
│       │   ├── data/             ← banco local: db, migrations, seeds, catalog,
│       │   │                        transactions, impulse, reports, profile,
│       │   │                        goals, backup, errors (ver apps/CLAUDE.md)
│       │   ├── components/       ← Card, Icon, TabBar, Field, NameForm, charts/
│       │   ├── context/          ← CatalogContext (sem auth)
│       │   ├── screens/          ← a UI de cada tela (incl. welcome/, profile/EditNameScreen)
│       │   ├── services/         ← hooks.ts, transform.ts, backup-file.ts, types.ts
│       │   ├── test-utils/       ← providers, test-db (sql.js), fixtures
│       │   ├── theme/            ← tokens de cor/fonte
│       │   └── utils/            ← formatação (R$), geometria dos gráficos, meses, erros
│       └── CLAUDE.md             ← regras do app
│
├── design_bundle/               ← protótipo original do Claude Design (referência)
├── .github/workflows/ci.yml     ← pipeline de CI (typecheck/lint/test/bundle)
├── .githooks/pre-push           ← roda o CI antes de cada push
├── CLAUDE.md                    ← guia geral do repositório
└── RESUMO.md                    ← este documento
```

---

## 5. Banco de dados (tabelas e por que existem)

Todas as chaves primárias são **UUID** (geradas com `expo-crypto`), exceto os
ids de seed (categorias/bancos padrão), que são slugs fixos (`compras`,
`nubank`, …). **Não há `user_id` em nenhuma tabela** — é um único usuário por
aparelho. Valores monetários em **centavos** (inteiro); datas em **epoch ms**.

| Tabela | Para que serve | Campos principais |
|--------|----------------|-------------------|
| **settings** | Só o nome do usuário (a "conta" inteira) | key, value |
| **categories** | Tipos de gasto/receita (globais, seedadas) | id, name, type (income/expense), icon, color |
| **banks** | Contas/carteiras do usuário | id, name, **short**, **color**, initial_balance_cents |
| **transactions** | Cada receita/despesa | id, bank_id, category_id, amount_cents, type, description, occurred_at, **is_impulse** |
| **goals** | Metas financeiras (leitura; sem tela de criação ainda) | id, title, target_cents, current_cents, deadline, status |

Não existe tabela `insights` — nada nunca gerou insights de verdade (nem a
antiga API), então não há nada real para persistir ainda (ver §6).

**Por que `short`/`color` no banco?** O app desenha "tiles" coloridos para cada
conta (Nubank roxo, Itaú laranja…). Esses campos guardam o visual de cada conta.

**Por que `is_impulse` na transação?** É a base da análise comportamental — marca
compras feitas por impulso (ver regra abaixo).

**Por que o saldo do banco não é uma coluna?** É calculado **na leitura**
(`initial_balance_cents + Σreceitas − Σdespesas`), o que elimina toda a lógica
de "revertVersão antiga/aplicar de novo" que a API antiga precisava ao editar
ou apagar uma transação — hoje não há nem edição/exclusão de transação na UI,
então nunca existe esse problema.

> **Schema versionado:** `PRAGMA user_version` controla as migrations
> (`apps/src/data/migrations.ts`) — cada versão nova do schema é um
> passo a mais nesse array, aplicado uma vez por banco.

---

## 6. Regras de negócio (portadas da antiga API para `src/data`)

### Seed automático na primeira abertura
Assim que o banco é criado, ele já ganha:
- **15 categorias padrão** (Alimentação, Delivery, Transporte, Salário…)
- **6 contas bancárias** (Nubank, Banco do Brasil, Caixa, Itaú, Inter, Dinheiro)

Assim o app é utilizável imediatamente, sem o usuário ter que cadastrar tudo.
Os ids são fixos (`compras`, `nubank`, …), então um backup importado sempre
casa com as mesmas linhas.

### Detecção de impulso (`is_impulse`)
Em `src/data/impulse.ts`. Uma despesa é marcada como impulsiva quando **todas**
as condições valem:
1. é uma **despesa**;
2. acontece **à noite (≥ 20h)** OU **no fim de semana**, no horário **local do
   aparelho** (a versão da API usava um offset fixo de UTC-3; sem servidor
   separado, "local" agora é só o aparelho do usuário);
3. o valor é **acima da média de despesas** do usuário nos últimos 7 dias
   (se não há histórico, usa o limite fixo de R$ 100).

### Relatórios (`src/data/reports.ts`)
Agregações em memória sobre as transações já carregadas (`summarize`,
`totalsByCategory`, `totalsByBank`, `monthlyComparison`) — a mesma lógica que
a antiga `ReportsService` fazia contra o Postgres, agora sem round-trip de
rede: os hooks (`useDashboard`/`useReports`) leem uma janela de transações de
uma vez (6 e 12 meses) e derivam tudo localmente.

### Backup, não mais "banco always-on"
Sem servidor, não existe uma cópia "de verdade" rodando em outro lugar — o
backup é um arquivo `.json` que o próprio usuário exporta e guarda onde
quiser (ver `apps/CLAUDE.md`, seção Backup). Importar substitui todos
os dados atomicamente; se o arquivo for inválido ou tiver uma referência
quebrada, nada é alterado (rollback).

---

## 7. Frontend — telas e camada de dados

### Telas
| Tela | Arquivo | O que mostra |
|------|---------|--------------|
| **Onboarding** | `app/welcome.tsx` | Só um campo: "Como podemos te chamar?" — sem conta, sem senha |
| **Início (Dashboard)** | `(tabs)/index.tsx` | Saldo, gráfico de evolução, insight, gastos por categoria, meta, atividade recente |
| **Transações** | `(tabs)/transactions.tsx` | Lista agrupada por dia, filtros (todas/receitas/despesas/impulso) |
| **Relatórios** | `(tabs)/reports.tsx` | Economia, comparativo mensal, gastos por categoria/banco, leitura comportamental |
| **Adicionar** | `transaction/add.tsx` | Teclado numérico, categoria, banco — cria a transação |
| **Perfil** | `(tabs)/profile.tsx` | Nome local, contas, exportar/importar backup, apagar todos os dados |
| **Editar nome** | `app/edit-name.tsx` | Reabre o mesmo formulário do onboarding |
| **Insight** | `insight.tsx` | Detalhe do gasto por impulso (bottom sheet) |

### Como os dados chegam na tela
1. A tela usa um **hook** (`useDashboard`, `useTransactions`, etc.) do
   `src/services/hooks.ts`.
2. O hook chama **`src/data/*`** diretamente — sem rede, sem servidor.
3. O resultado passa pelos **transforms puros** (`src/services/transform.ts`)
   que convertem os registros do banco (centavos, epoch ms) no formato que o
   design espera (reais, labels formatados).

**Dados "derivados" (honestidade técnica):** alguns elementos visuais do design
ainda não têm uma fonte real e são **calculados de forma simples** a partir do
que existe (documentado para a Fase 2 refinar):
- **Gráfico de evolução (sparkline):** derivado do saldo acumulado dos últimos meses.
- **Leitura comportamental (Relatórios):** heurística simples de % de impulso.
- **Detalhe de insight:** sempre o estado "sem insights ainda" — não existe
  engine local (nem existia de verdade na API antiga: `GET /insights` sempre
  voltava `[]`).
- **Meta:** usa a primeira meta cadastrada, ou um placeholder zerado.

### Catálogo (categorias e bancos)
O `CatalogContext` carrega categorias e bancos do banco local **uma vez** e as
telas resolvem ícone/cor/nome por id. Não há mais nenhum gate de sessão — as
queries sempre rodam.

---

## 8. Privacidade (sem autenticação)

```
Primeira abertura → tela única pedindo um nome
   │
   ├─ nome salvo em settings.profile.name (SQLite local)
   │
   └─ guard de rotas (app/_layout.tsx): sem nome → /welcome; com nome → abas
```

- **Não existe conta, senha, e-mail, token ou sessão.** Não há nada para
  vazar num servidor porque não há servidor.
- Os dados nunca saem do aparelho a menos que o próprio usuário exporte um
  backup e o compartilhe.
- `android.allowBackup: false` no `app.json` evita que o Auto Backup do
  Google suba o banco para a nuvem da conta do usuário sem ele pedir.
- Sem criptografia adicional do arquivo do banco (SQLCipher) por ora — confia
  no isolamento de sandbox do sistema operacional.

---

## 9. CI/CD (local-first)

Filosofia **local-first**: o mesmo pipeline roda na sua máquina e no GitHub.

- **`npm run ci`** (na raiz) = `typecheck` + `lint` + `test` + `build`
  (bundle export) para o app. Hoje: **125 testes**.
- **`.github/workflows/ci.yml`** roda exatamente isso em cada push/PR (Node 22).
- **`.githooks/pre-push`** roda o `npm run ci` antes de cada push (ative com
  `npm run setup:hooks`). Para pular numa emergência: `git push --no-verify`.

---

## 10. Como rodar o projeto (passo a passo)

### Pré-requisitos
- Node.js e npm. **Nada de Docker.**

### 1) Instalar dependências (na raiz)
```bash
npm install
```

### 2) Rodar o app
```bash
npm run mobile         # abre o Expo
```
Abra no Expo Go (celular) ou num emulador — funciona **em modo avião**, já que
não há nenhuma chamada de rede.

### 3) Primeiro uso
- A primeira tela pede só o seu nome → você já entra com 15 categorias e 6
  contas padrão. Adicione transações pelo botão **+**.

### Comandos úteis
| Comando | O que faz |
|---------|-----------|
| `npm run ci` | Roda toda a validação (typecheck/lint/test/build) |
| `npm run mobile` | Inicia o Expo |
| `npm run setup:hooks` | Ativa o git hook de pre-push |

---

## 11. Testes

| Onde | Quantos | O que cobrem |
|------|---------|--------------|
| `apps/src/data` | parte dos 125 | Lógica de negócio portada: impulso, migrations, reports, transações, backup — sobre um SQLite real em memória (`sql.js`), não mocks |
| `apps/src/services` e `src/screens` | resto dos 125 | Transforms, hooks (React Query sobre o banco de teste), componentes, smoke das telas |

Estratégia: **SQLite real em memória** (`sql.js`) em vez de mockar o banco —
os testes de `src/data` exercitam o SQL de verdade (inclusive violação de
foreign key / rollback no backup), não uma simulação.

---

## 12. Status atual e próximos passos

### ✅ Pronto e validado
- **Migração completa para local-first**: sem API, sem Docker, sem login —
  todos os dados num SQLite no aparelho (issue #1).
- **Frontend** completo: todas as telas do design, agora com onboarding de
  nome em vez de login/registro.
- **Backup manual**: exportar/importar `.json`, e "apagar todos os dados".
- **CI local-first** sem infraestrutura nenhuma para manter.

### 🔜 Próximos passos sugeridos
- **Engine de Insights (Fase 2):** substituir os dados "derivados" (evolução,
  leitura comportamental, padrão semanal de impulso) por cálculos reais do
  motor de análise comportamental, rodando localmente.
- **Metas (Fase 3):** telas de criação/acompanhamento de metas e reserva de emergência.
- **Data picker** na tela de adicionar (hoje a data é sempre "hoje").

### ⚠️ Pendências de UI (a corrigir manualmente)
- **Perfil — barras de traços comportamentais** (Consciente/Impulsivo/Planejador):
  hoje usam um mapeamento Fase-1 do índice de impulso, **não são scores reais por
  traço** (Fase 2). Ajuste visual/numérico será feito manualmente.
- **TabBar — FAB "+"**: reposicionado para não ser clipado pelo host do tab
  navigator (faixa transparente no topo + botão flutuante dentro dos limites).
  Conferir a elevação/sombra no device e refinar manualmente se necessário.

### Itens conhecidos deixados para depois
- Linhas de Perfil que ainda são placeholders visuais (sem ação): **Minhas
  metas** e **Adicionar conta**. Os toggles de **Notificações**/**Alertas de
  impulso** são estado local apenas.
- **Data picker** na tela de adicionar (hoje a data é sempre "hoje"; a linha tem
  o chevron do design mas ainda não abre seletor).
- O detalhe do insight (padrão semanal e dica) é visual até a engine da Fase 2.

---

*Para detalhes técnicos, veja o `CLAUDE.md` dentro de `apps` e
`apps/app`.*
