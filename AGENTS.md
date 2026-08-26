# CLAUDE.md/AGENTS.md

This file provides guidance to Claude Code (claude.ai/code)  or any agentic code tool when working with code in this repository.

## What this is

A Next.js (App Router) MVP built on a Clean Architecture skeleton, generated from the
`nextjs-mvp-template` skill. Business rules live in plain functions with no dependency on
Next.js, Postgres, or any SDK; every external system is reached through a port/adapter pair,
with an in-memory mock adapter for tests. This instance was bootstrapped **without** auth,
Stripe, Supabase, or Sentry — see "Adding an integration later" in README.md if one of those
needs to be added.

## Commands

```bash
npm install
cp .env.example .env.local   # fill in real values for local dev

npm run dev                  # http://localhost:3000
npm run lint                 # ESLint, including the architectural boundary rules
npm run build

npm test                     # jest, STAGE=test (from .env.test), no network/db needed
npm run test:watch
npx jest path/to/file.test.ts          # run a single test file
npx jest -t "test name substring"      # run tests matching a name
```

`jest.config.ts` lists test roots explicitly in `testMatch`
(`tests/unit/application/use-cases/**`, `tests/unit/interface-adapters/**`,
`tests/unit/proxy.test.ts`). A test file placed outside those roots will silently never run —
add the new root to `testMatch` first.

## Environment configuration

Configuration is read in exactly **one** module, `src/env/environments.ts`, validated with Zod.
Nothing else may touch `process.env` — `eslint-plugin-boundaries` enforces this (the `env`
element is the only one allowed to depend on nothing but `entities`).

- `.env.example` — documented list of every variable.
- `.env.local` (gitignored) — real values for local dev.
- `.env.test` (committed) — just `STAGE=test`; under this stage every port binds to its
  in-memory mock, so `npm test` needs no database, network, or secret.
- `stage` is validated eagerly at import time (everything keys off it); every other config
  (e.g. `getDatabaseConfig()`) is validated lazily inside its getter, so a stage that never
  touches an integration is never forced to configure it.

Adding a variable is four edits, in order: `.env.example` → a Zod schema in
`src/env/environments.ts` → the DI module that reads it → `ssm_parameter_keys` in
`iac/bootstrap/variables.tf`.

## Architecture: layered, dependencies point inward

```
src/entities/                       models (Zod schemas + inferred types), error classes.
                                     No framework, no I/O. Depends on nothing but itself.

src/application/repositories/       PORTS for data stores — interfaces only. → entities
src/application/services/           PORTS for external systems — interfaces only. → entities
src/application/use-cases/          business rules, one file per operation. → entities, ports

src/interface-adapters/controllers/ authenticate → validate → call use case → present.
                                     → entities, ports, use cases

src/infrastructure/                 ADAPTERS: real implementations, each with a `.mock.ts`
                                     twin. → entities, ports, env

src/env/                            the only module allowed to read process.env. → entities

di/                                 wires ports to adapters, one module per area under
                                     di/modules/. → everything except entities-only rules

app/                                Next.js routes, Server Actions, pages. → entities, di
```

`eslint-plugin-boundaries` (configured in `eslint.config.mjs`) fails the lint if a file
imports from a layer above it in this list — this is a hard, machine-checked rule, not just
convention. Note in particular: `src/infrastructure/adapters/**` is a distinct `adapters`
element from the rest of `src/infrastructure/**` and is the only element allowed to import
another feature's use case (for cross-module calls); the plain `infrastructure` element may
not.

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

`app/` may never resolve a use case, repository, or service from the container directly —
only a controller, via `getInjection()` in `di/container.ts` — because the controller is the
layer that verifies the caller. Skipping it skips authentication.

Monitoring (`IInstrumentationService`, `ICrashReporterService`) is wired through this same
port/adapter pattern: every use case and controller wraps its body in a named instrumentation
span and reports unexpected errors through these ports. No APM/error-tracking SDK is
configured yet — the real adapters in `src/infrastructure/services/` just log to the console.

### Reference implementation

The `demo` feature (`src/**/demo/**`, `di/modules/demo.module.ts`) is a working, minimal
example of every layer and is meant to be read before adding a real feature — or deleted once
one exists. Look at:
- `src/application/use-cases/demo/get-architecture-fact.use-case.ts` — the higher-order
  function shape every use case follows: dependencies first, input second, body wrapped in a
  named `instrumentationService.startSpan(...)`, exporting
  `type I<Name>UseCase = ReturnType<typeof <name>UseCase>`.
- `src/interface-adapters/controllers/demo/get-architecture-fact.controller.ts` — a controller
  does exactly three things: authenticate, `safeParse` input with Zod, and map the entity
  through a local `presenter()` so no internal field leaks out.
- `di/modules/demo.module.ts` — a DI module has three sections in order (infrastructure → use
  cases → controllers); only the infrastructure section ever branches on `stage`.

### Adding a feature

1. Model it: a Zod schema in `src/entities/models/`, an error class per failure mode in
   `src/entities/errors/`.
2. Declare what it needs from the outside: a data store → `src/application/repositories/`; any
   other external system → `src/application/services/`. Reuse an existing port if one fits.
3. Write failing tests in `tests/unit/application/use-cases/<area>/` against mock adapters.
4. Write the use case in `src/application/use-cases/<area>/`, following the shape above.
5. Implement the adapters in `src/infrastructure/`: the real one and its `.mock.ts` twin, both
   implementing the port.
6. Write the controller in `src/interface-adapters/controllers/<area>/`; test it in
   `tests/unit/interface-adapters/controllers/<area>/`.
7. Register everything in `di/types.ts` (symbol + return type) and a
   `di/modules/<area>.module.ts`, in order infrastructure → use cases → controllers.
8. Expose it from `app/`: a Server Action for a form, a route handler under `app/api/v1/` for
   an external caller. Call `getInjection("I<Name>Controller")` and nothing else.
9. Verify: `npm test && npm run lint && npm run build`.

Steps 1–7 are the same regardless of trigger; only step 8 changes.

## What's deliberately missing

- **Database/migrations**: no migration tool wired in. Point `DATABASE_URL` at any Postgres
  instance, pick a tool (`node-pg-migrate`, `drizzle-kit`, `supabase`, ...), and wire it into
  the `migrate` job placeholder in `.github/workflows/cd.yml`.
- **Auth, Stripe, Supabase, Sentry**: intentionally left out of this bootstrap; each installs
  additively without disturbing existing code (see README.md § "Adding an integration later").

## CI/CD

- `.github/workflows/ci.yml`: runs on PRs into `dev`/`homol`/`prod`. Runs `npm test` only,
  deliberately with no cloud credentials — the whole suite runs under `STAGE=test` against
  in-memory mocks, so a fork PR needs no secret.
- `.github/workflows/cd.yml`: runs on push to `homol`/`prod`. Validates expected SSM parameter
  *names* exist (never reads a value except `DATABASE_URL`, only to run migrations), then
  triggers and polls an AWS Amplify deploy job.
- `iac/bootstrap/`: one-time, operator-run Terraform for the SSM parameter tree and the
  Amplify app. Read `iac/bootstrap/README.md` before running it. Nothing secret is stored in
  this repository.
