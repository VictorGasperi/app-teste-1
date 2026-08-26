import type { ICrashReporterService } from "@/src/application/services/crash-reporter.service.interface";

/**
 * No APM/error-tracking SDK is wired in yet. This logs to stderr so nothing
 * is silently swallowed in dev/prod; swap it for a real adapter (Sentry,
 * Datadog, ...) behind this same port when one is needed — nothing above
 * this layer has to change.
 */
export class CrashReporterService implements ICrashReporterService {
  report(error: unknown): string {
    const eventId = crypto.randomUUID();
    console.error(`[crash-reporter:${eventId}]`, error);
    return eventId;
  }
}
