# RITSU - Rute ITS Utama

Campus transportation app for ITS (Institut Teknologi Sepuluh Nopember). Book a driver, track your route, and arrive on time.

Built with **Next.js 16**, **DaisyUI 5**, **PostgreSQL**, and **JWT sessions**.

---

## Tech Stack

| Layer      | Technology                         |
| ---------- | ---------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack) |
| UI         | Tailwind CSS v4 + DaisyUI v5       |
| Language   | TypeScript                         |
| Database   | PostgreSQL 17                      |
| Auth       | JWT via `jose` + `bcryptjs`        |
| Validation | Zod v4                             |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [Docker](https://www.docker.com/) (for the database)

### 1. Clone and install

```sh
git clone <repo-url>
cd ruta-its
npm install
```

### 2. Configure environment

```sh
cp .env.example .env
```

Edit `.env` and set:

- `POSTGRES_PASSWORD`: any password you want
- `DATABASE_URL`: update the password to match (used for `npm run dev` only)
- `SESSION_SECRET`: generate with `openssl rand -base64 32`

### 3. Start the database

```sh
docker compose up -d postgres
```

The migration in `migrations/001_create_users.sql` runs automatically on first start.

### 4. Run the dev server

```sh
npm run dev
```

Open <http://localhost:3000> - you'll land on `/auth/login`.

---

## Running with Docker (full stack)

Builds and starts both the app and the database:

```sh
docker compose up -d            # start da server
```

| URL                     | Service    |
| ----------------------- | ---------- |
| <http://localhost:3000> | App        |
| localhost:5432          | PostgreSQL |

```sh
docker compose logs -f app      # app logs
docker compose down             # stop everything
docker compose down -v          # stop + wipe database
```

---

## Project Structure

```text
app/
├── (main)/              # Authenticated pages (navbar layout)
│   ├── home/            # /home (landing page)
│   └── profile/         # /profile (user profile + driver apply)
├── auth/
│   ├── login/           # /auth/login
│   ├── register/        # /auth/register
│   └── logout/          # /auth/logout
├── actions/
│   └── auth.ts          # Server actions: signup, login, logout
├── components/
│   └── Navbar.tsx       # Top nav (desktop) + dock (mobile)
└── lib/
    ├── db.ts            # PostgreSQL pool
    ├── session.ts       # JWT encrypt/decrypt
    ├── dal.ts           # Data access layer (verifySession, getUser)
    └── definitions.ts   # Zod schemas + types

migrations/
└── 001_create_users.sql

proxy.ts                 # Route protection (Next.js 16 middleware)
```

---

## Pages

| Route            | Description                           | Auth required |
| ---------------- | ------------------------------------- | ------------- |
| `/`              | Redirects to `/home`                  | -             |
| `/home`          | App landing page                      | ✅             |
| `/profile`       | User info, driver application, logout | ✅             |
| `/auth/login`    | Sign in                               | -             |
| `/auth/register` | Create account                        | -             |
| `/auth/logout`   | Clears session, redirects to login    | ✅             |

---

## Environment Variables

See [`.env.example`](.env.example) for the full list.

| Variable            | Used by                 | Description                        |
| ------------------- | ----------------------- | ---------------------------------- |
| `POSTGRES_USER`     | Docker Compose          | DB username                        |
| `POSTGRES_PASSWORD` | Docker Compose          | DB password                        |
| `POSTGRES_DB`       | Docker Compose          | DB name                            |
| `POSTGRES_PORT`     | Docker Compose          | Host-side port                     |
| `DATABASE_URL`      | Next.js (`npm run dev`) | Full connection string (localhost) |
| `SESSION_SECRET`    | Next.js                 | JWT signing secret                 |

:::info
In Docker, `DATABASE_URL` is constructed automatically from `POSTGRES_*` variables, you don't need to set it separately.

:::
