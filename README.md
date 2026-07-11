# Kutandisa — Backend

API REST em Node.js + TypeScript + Express + SQLite para a plataforma de turismo Kutandisa.
Foi construída para casar 1:1 com o cliente HTTP já existente em `src/services/api.ts` do frontend.

## Stack

- **Node.js + Express** — servidor HTTP
- **TypeScript** — tipagem estática (partilha os mesmos tipos usados no frontend: `User`, `Destination`, `Booking`, `Operator`, `Payment`, `Stats`)
- **better-sqlite3** — base de dados ficheiro único, sem necessidade de instalar um SGBD à parte
- **JWT (jsonwebtoken)** — autenticação por token
- **bcryptjs** — hash de passwords
- **zod** — validação de payloads

## Instalação

```bash
npm install
cp .env.example .env      # ajusta o JWT_SECRET em produção
npm run seed               # cria a base de dados e popula com dados demo
npm run dev                 # arranca em modo desenvolvimento (http://localhost:3001)
```

Para produção:

```bash
npm run build
npm start
```

## Credenciais demo (criadas pelo `npm run seed`)

| Papel     | Email                 | Password  |
|-----------|-----------------------|-----------|
| Cliente   | maria@kutandisa.ao    | 123456    |
| Operador  | hotel@kutandisa.ao    | hotel123  |
| Admin     | admin@kutandisa.ao    | admin123  |

Estas são exatamente as mesmas credenciais que já estavam hardcoded em `Login.tsx` no frontend.

## Ligar ao frontend

No projeto **kutandisa** (frontend), o ficheiro `.env.local` já aponta para:

```
VITE_API_URL=http://localhost:3001/api
```

Corre os dois em simultâneo:

```bash
# terminal 1
cd kutandisa-backend && npm run dev

# terminal 2
cd kutandisa && npm run dev
```

O `Login.tsx` tenta primeiro autenticar contra este backend real; se o backend estiver em baixo, cai automaticamente no modo demo local (`switchRole`). Com o backend a correr, o login passa a ser 100% real, com JWT emitido pelo servidor.

## Endpoints

Todas as rotas estão prefixadas com `/api`.

| Método | Rota                       | Auth              | Descrição |
|--------|-----------------------------|-------------------|-----------|
| GET    | `/health`                   | —                 | Verificação de saúde do servidor |
| POST   | `/auth/login`                | —                 | Login (email + password) |
| POST   | `/auth/register`             | —                 | Registo de novo cliente/operador |
| GET    | `/auth/me`                   | Bearer token      | Dados do utilizador autenticado |
| GET    | `/destinations`              | —                 | Lista de destinos (filtros: `province`, `category`, `search`) |
| GET    | `/destinations/:id`          | —                 | Detalhe de um destino |
| GET    | `/bookings`                  | Bearer token      | Cliente vê só as suas; admin/operador vêem todas (filtro `status`) |
| POST   | `/bookings`                  | Bearer (client)   | Cria uma reserva |
| PATCH  | `/bookings/:id/status`       | Bearer (operator/admin) | Confirma/cancela reserva |
| GET    | `/users`                     | Bearer (admin)    | Lista utilizadores (filtros: `search`, `status`, `role`) |
| PATCH  | `/users/:id/status`          | Bearer (admin)    | Ativa/suspende utilizador |
| DELETE | `/users/:id`                 | Bearer (admin)    | Remove utilizador |
| GET    | `/operators`                 | Bearer (admin)    | Lista operadores |
| PATCH  | `/operators/:id/status`      | Bearer (admin)    | Ativa/suspende operador |
| GET    | `/payments`                  | Bearer (admin)    | Lista pagamentos |
| GET    | `/payments/stats`            | Bearer (admin)    | Estatísticas agregadas (usadas no dashboard) |

## Esquema da base de dados

- `users` — clientes, operadores e admins (password em hash bcrypt)
- `destinations` — os 9 destinos angolanos já usados no frontend (Miradouro da Lua, Kalandula, Mussulo, etc.)
- `operators` — perfil de negócio ligado a um `user` com papel `operator`
- `bookings` — reservas, ligadas a cliente + destino + operador
- `payments` — pagamentos ligados a reservas
- `favourites` — tabela pronta para guardar favoritos por utilizador (ainda não exposta em rota — o frontend atual também não usa isto ainda; fica pronta para quando ligares essa funcionalidade)

Para recomeçar do zero, apaga o ficheiro `kutandisa.db` (e `-wal`/`-shm` se existirem) e corre `npm run seed` outra vez.

## Notas de segurança

- Muda `JWT_SECRET` no `.env` antes de qualquer deploy real.
- As passwords nunca são guardadas em texto simples — só o hash bcrypt.
- CORS está limitado à origem definida em `CORS_ORIGIN` (por defeito, o Vite dev server).
