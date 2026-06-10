# 🚀 Checklist de produção — Wyden na VPS

Guia passo a passo para subir o backend (API + PostgreSQL + Redis + Nginx) numa
VPS Linux e apontar o app mobile para ela. A stack de produção vive em
`docker-compose.prod.yml` (sem pgadmin, banco/redis sem portas públicas, segredos
via `.env.production`).

> **Footprint medido** (ocioso): API ~56 MiB · Postgres ~38 MiB · Redis ~5 MiB =
> **~100 MiB**. Sob carga, o gargalo é a API (Node single-thread, ~0,8 de 1 core).
> Uma VPS **1 vCPU / 1 GB** roda confortável para uso pessoal; **2 GB** dá folga
> para crescimento do banco e para buildar na própria VPS. Ver §8.

---

## 0. Pré-requisitos
- [ ] VPS Linux (Ubuntu/Debian) com **Docker Engine + plugin `docker compose`**.
- [ ] Um **domínio** (ou subdomínio, ex. `api.seu-dominio.com`) com registro **A**
      apontando para o IP da VPS.
- [ ] Acesso SSH à VPS.

## 1. Clonar o repositório na VPS
```bash
git clone <url-do-repo> wyden && cd wyden
```

## 2. Criar e preencher os segredos
```bash
cp .env.production.example .env.production
# gere segredos fortes:
openssl rand -hex 32   # use para JWT_SECRET
openssl rand -hex 32   # use para JWT_REFRESH_SECRET
nano .env.production    # defina DB_PASS, JWT_SECRET, JWT_REFRESH_SECRET
```
- [ ] `DB_PASS` trocado (não use `wyden_secret`).
- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` trocados (strings aleatórias longas).
- [ ] `.env.production` **não** será commitado (já está no `.gitignore`).

## 3. Ajustar o domínio no Nginx
- [ ] Em `deploy/nginx.conf`, troque `server_name _;` pelo seu domínio.

## 4. Primeiro boot — criar o schema
Ainda **não há migrations**; o schema é criado pelo TypeORM com `DB_SYNCHRONIZE=true`.
Faça isso **uma única vez**:
```bash
# 1) sobe com synchronize ligado só para criar as tabelas + seed das categorias
DB_SYNCHRONIZE=true docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# 2) confirme que a API respondeu e criou o schema
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f api
```
- [ ] Depois que subir, **volte `DB_SYNCHRONIZE=false`** no `.env.production` e recrie a api:
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --force-recreate api
```
> Por quê: `synchronize` em produção pode **alterar/derrubar colunas** a cada
> deploy. Deixe `false` no dia a dia. (TODO do projeto: trocar por migrations.)

## 5. Subir a stack
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```
Neste ponto a API já responde em **HTTP** via Nginx:
```bash
curl http://SEU_DOMINIO/api/v1/health   # ou registre/logue para testar
```

## 6. HTTPS (Let's Encrypt / certbot)
```bash
# emitir o certificado usando o webroot que o nginx já serve
docker run --rm \
  -v "$PWD/deploy/certbot/conf:/etc/letsencrypt" \
  -v "$PWD/deploy/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d api.seu-dominio.com --email voce@email.com --agree-tos --no-eff-email
```
- [ ] Em `deploy/nginx.conf`: trocar a `location /` do bloco `listen 80` por
      `return 301 https://$host$request_uri;` e **descomentar** o bloco `listen 443`
      (ajustando `server_name` e os caminhos dos certs).
- [ ] Recarregar o nginx:
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec nginx nginx -s reload
```
- [ ] Renovação automática (cron/systemd timer): `certbot renew` + `nginx -s reload`.

## 7. Firewall / rede
- [ ] Abrir **apenas 80 e 443** (ufw/security group). `22` para SSH.
- [ ] **Não** publicar 5432 / 6379 / 3000 — no `docker-compose.prod.yml` eles já
      não têm `ports:`, ficam só na rede interna `wyden-network`.

## 8. Recursos da VPS
- **RAM:** stack ~100 MiB ociosa + OS/dockerd (~150–250 MiB) → **1 GB sobra**.
- **Build:** `docker build` da API (compila TS + bcrypt nativo) tem **pico de
  500 MiB–1 GB**. Numa VPS de 1 GB, evite buildar na máquina:
  - [ ] **Opção A:** buildar local/CI → `docker push` p/ um registry → na VPS só
        `docker compose ... pull && up -d`.
  - [ ] **Opção B:** adicionar **swap de 1–2 GB** antes do primeiro build.
- **CPU:** ~0 ociosa; a API satura ~0,8 de 1 core sob carga real moderada.

## 9. Apontar o app mobile para a VPS
O `api.ts` resolve `extra.apiUrl → EXPO_PUBLIC_API_URL → localhost`, então é só
configuração:
- [ ] Buildar o app com `EXPO_PUBLIC_API_URL=https://api.seu-dominio.com/api/v1`.
- [ ] Revisar **CORS** na API (`apps/api/src/main.ts`) se houver build web; para o
      app nativo o CORS não bloqueia (sem `Origin`).

## 10. Operação
- **Logs:** `docker compose --env-file .env.production -f docker-compose.prod.yml logs -f`
- **Backup do banco:**
  ```bash
  docker compose --env-file .env.production -f docker-compose.prod.yml exec postgres \
    pg_dump -U "$DB_USER" "$DB_NAME" > backup_$(date +%F).sql
  ```
- **Atualizar deploy:** `git pull && docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build`
- **Derrubar:** `... down` (os dados ficam no volume `postgres_data`).

## ✅ Checklist de segurança (antes de ir ao ar)
- [ ] `DB_PASS`, `JWT_SECRET`, `JWT_REFRESH_SECRET` trocados dos defaults de dev.
- [ ] `DB_SYNCHRONIZE=false` no dia a dia.
- [ ] Banco e Redis **sem porta pública**.
- [ ] **HTTPS** ativo (certbot) e HTTP redirecionando para HTTPS.
- [ ] `.env.production` fora do git; pgadmin **não** roda em produção.
- [ ] Backups do Postgres agendados.

---

*Stack local de desenvolvimento e credenciais de dev: ver `RESUMO.md` §9–§12.*
