import "server-only";

import { z } from "zod";

/**
 * The ONLY module in the app allowed to read `process.env` (enforced by the
 * `env` element in eslint.config.mjs). Every other layer receives already
 * validated configuration through the DI container.
 *
 * Pattern for adding configuration:
 *   1. add the variable to `.env.example` with a comment saying which
 *      stages require it;
 *   2. add it to the matching `<area>Schema` below, or create a new
 *      schema + `get<Area>Config()` pair for a new integration;
 *   3. read it from the DI module that builds the adapter needing it —
 *      never from a use case, controller, entity, or `app/**`;
 *   4. add the key to `iac/bootstrap/variables.tf` (`ssm_parameter_keys`)
 *      so homol/prod get a parameter for it.
 *
 * `stage` is validated eagerly at import time because everything else keys
 * off it. Every other config is validated LAZILY, inside its getter, so a
 * stage that never touches an integration is never forced to configure it —
 * this is what lets `STAGE=test` run the whole unit suite with no secrets.
 */

const stageSchema = z.enum(["test", "dev", "homol", "prod"]);

export type Stage = z.infer<typeof stageSchema>;

const parsedStage = stageSchema.safeParse(process.env.STAGE);

if (!parsedStage.success) {
  throw new Error(
    `Invalid STAGE: ${JSON.stringify(process.env.STAGE)}. Must be one of: test, dev, homol, prod`
  );
}

/** The one source of truth for where this process is running. */
export const stage: Stage = parsedStage.data;

export const isStage = (...stages: Stage[]) => stages.includes(stage);

const databaseSchema = z.object({
  DATABASE_URL: z.url(),
});

export type DatabaseConfig = z.infer<typeof databaseSchema>;

export function getDatabaseConfig(): DatabaseConfig {
  const result = databaseSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Invalid database configuration for STAGE=${stage}:\n${z.prettifyError(result.error)}`
    );
  }
  return result.data;
}

const appSchema = z.object({
  APP_BASE_URL: z.url(),
});

export type AppConfig = z.infer<typeof appSchema>;

/** Public base URL of this deployment; needed by any integration that builds absolute callback URLs. */
export function getAppConfig(): AppConfig {
  const result = appSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid app configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
