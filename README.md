# app-teste-1

A Next.js MVP built on a Clean Architecture skeleton.

Generated with **nextjs-mvp-template**: a Next.js + TypeScript starting point
whose one goal is that the fastest way to add a feature stays the same on
day 1 and on day 200. Business rules live in plain functions that know
nothing about Next.js, Postgres, or any SDK; everything external enters
through an interface and is swapped for an in-memory double in tests.

This instance was bootstrapped **without** auth, Stripe, Supabase, or Sentry.
All four are additive — see [Adding an integration later](#adding-an-integration-later).

## Prerequisites

- Node.js 20+ and npm
- A Postgres database (any host) — only once you add a real repository
- Terraform >= 1.5 and AWS credentials — only when you deploy

## Install

```bash
npm install
cp .env.example .env.local
```

## Environment

Configuration is read in exactly one module, `src/env/environments.ts`,
validated with Zod. Nothing else in the codebase may touch `process.env` —
ESLint enforces it.

- `.env.example` — the documented list of every variable. Copy it to
  `.env.local` (gitignored) and fill in real values for local development.
- `.env.test` — committed, contains only `STAGE=test`. Under that stage
  every port is bound to an in-memory double, so the unit suite runs with no
  database, no network, and no secret.

| Variable | Required in | Notes |
| --- | --- | --- |
| `STAGE` | always | `test` \| `dev` \| `homol` \| `prod` |
| `DATABASE_URL` | dev, homol, prod | Postgres connection string |
| `APP_BASE_URL` | dev, homol, prod | public base URL, for absolute callback URLs |

Adding a variable means four edits, in this order: `.env.example`, a Zod
schema in `src/env/environments.ts`, the DI module that reads it, and
`ssm_parameter_keys` in `iac/bootstrap/variables.tf`.

## Local development

```bash
npm run dev      # http://localhost:3000
npm run lint     # ESLint, including the architectural boundary rules
```

## Tests

```bash
npm test
npm run test:watch
```

Tests run under `STAGE=test` (from `.env.test`) and live in `tests/unit/`,
mirroring the source tree. What is tested is what holds the rules: use cases
and controllers, wired to the mock adapters in
`src/infrastructure/**/*.mock.ts`. Real adapters are not unit tested.

`jest.config.ts` lists test roots explicitly in `testMatch`. If you add a
test directory outside the existing ones, add it there too or the file will
never run.

## Database and migrations

No database or migration tool is wired in yet (this bootstrap skipped
Supabase). When a feature needs one:

1. Point `DATABASE_URL` at any Postgres instance — local Docker, RDS, Neon,
   Supabase, etc. `pg` is already a dependency.
2. Pick a migration tool (`node-pg-migrate`, `drizzle-kit`, `supabase`, ...)
   and wire its "apply migrations" step into the `migrate` job in
   `.github/workflows/cd.yml`, which currently has a placeholder there.

## Infrastructure

`iac/bootstrap/` holds a Terraform scaffold for a one-time, local, operator-run
bootstrap: the SSM Parameter Store tree (names only) and an AWS Amplify
Hosting app with `homol`/`prod` branches. Read `iac/bootstrap/README.md`
before running it.

You must supply: `aws_region`, `amplify_app_name` (which must match
`vars.AMPLIFY_APP_NAME` in GitHub), `github_repository_url`, a short-lived
GitHub PAT, and the real SSM parameter values. Nothing secret is stored in
this repository.

Deployment then runs from `.github/workflows/cd.yml` on pushes to `homol`
and `prod`: migrate, then deploy, both under that stage's GitHub
Environment.

## Architecture

Dependencies point inward. A module may only import from the layers below
it in this list, never above — `eslint-plugin-boundaries` fails the lint if
you get it wrong.

| Directory | Depends on | Holds |
| --- | --- | --- |
| `src/entities/` | itself only | models (Zod schemas + inferred types) and error classes. No framework, no I/O. |
| `src/application/repositories/` | entities | **ports** for data stores — interfaces only |
| `src/application/services/` | entities | **ports** for external systems — interfaces only |
| `src/application/use-cases/` | entities, ports | the business rules, one file per operation |
| `src/interface-adapters/controllers/` | entities, ports, use cases | authenticate the caller, validate input, present output |
| `src/infrastructure/` | entities, ports, env | **adapters**: the real implementations, plus a `.mock.ts` twin for each |
| `src/env/` | entities | the only module that reads `process.env` |
| `di/` | everything except entities-only rules | wires ports to adapters, one module per area |
| `app/` | entities, di | Next.js routes, Server Actions, pages |

A request travels one way:

```
app/ (page · Server Action · route handler)
    ↓ getInjection("I<Name>Controller")
controller        authenticate → validate → call use case → present
    ↓
use case          the business rule; talks only to ports
    ↓
port (interface)
    ↓
adapter           src/infrastructure/** — Postgres, an SDK, an HTTP API
```

`app/` may never resolve a use case, repository, or service from the
container: the controller is the layer that verifies the caller, so
skipping it skips authentication.

Monitoring (`IInstrumentationService`, `ICrashReporterService`) is already
wired through this same port/adapter pattern — every use case and
controller wraps its body in a span and reports unexpected errors through
these ports. No APM/error-tracking SDK is configured yet (this bootstrap
skipped Sentry): the real adapters in `src/infrastructure/services/` just
log to the console. Swap them for a real SDK later without touching a use
case or controller.

## Adding a feature

1. **Model it.** Add or extend a Zod schema in `src/entities/models/`; add
   an error class in `src/entities/errors/` for each way it can fail.
2. **Declare what it needs from the outside.** A data store → an interface
   in `src/application/repositories/`; anything else external → an interface
   in `src/application/services/`. Reuse an existing port if one fits.
3. **Write the failing tests** for the rule, in
   `tests/unit/application/use-cases/<area>/`, against the mock adapters.
4. **Write the use case** in `src/application/use-cases/<area>/` as a
   higher-order function: dependencies first, input second, body wrapped in
   a named instrumentation span. Export
   `type I<Name>UseCase = ReturnType<typeof <name>UseCase>`.
5. **Implement the adapters** in `src/infrastructure/`: the real one and its
   `.mock.ts` twin, both implementing the port.
6. **Write the controller** in `src/interface-adapters/controllers/<area>/`:
   verify the access token, `safeParse` the input, call the use case, map the
   entity through a local `presenter()` so no internal field leaks out. Test
   it in `tests/unit/interface-adapters/controllers/<area>/`.
7. **Register everything** in `di/types.ts` (symbol + return type) and a
   `di/modules/<area>.module.ts`, in the order
   infrastructure → use cases → controllers.
8. **Expose it** from `app/`: a Server Action for a form, a route handler
   under `app/api/v1/` for an external caller. Call
   `getInjection("I<Name>Controller")` and nothing else.
9. **Verify**: `npm test && npm run lint && npm run build`.

Steps 1–7 are the same regardless of how the feature is triggered. Only
step 8 changes.

## Adding an integration later

This bootstrap deliberately left four things out. Each installs cleanly
without disturbing what already exists:

- **Auth** — the `nextjs-mvp-template` skill's `auth` pack adds an
  `IAuthenticationService` port, a Supabase GoTrue adapter + mock, sign-in/
  sign-up use cases and controllers, and `proxy.ts` route protection.
- **Stripe** — add an `IPaymentService` port in `src/application/services/`
  and a Stripe-backed adapter + mock behind it, the same way any other
  external service is added.
- **Supabase** — run `supabase init && supabase start` for local Postgres,
  or point `DATABASE_URL` at any other Postgres instance; see
  [Database and migrations](#database-and-migrations).
- **Sentry** — `npm install @sentry/nextjs`, then replace the console-based
  bodies of `src/infrastructure/services/instrumentation.service.ts` and
  `crash-reporter.service.ts` with calls into the SDK. The ports and every
  call site are already in place.

Incluindo essa linha para startar deploy