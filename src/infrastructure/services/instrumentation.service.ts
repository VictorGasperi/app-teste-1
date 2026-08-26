import type {
  IInstrumentationService,
  SpanOptions,
} from "@/src/application/services/instrumentation.service.interface";

/**
 * No APM/tracing SDK is wired in yet, so spans are not exported anywhere —
 * this just runs the wrapped work. Swap it for a real adapter (Sentry,
 * OpenTelemetry, ...) behind this same port when one is needed; every use
 * case and controller already calls `startSpan`/`instrumentServerAction`,
 * so nothing above this layer has to change.
 */
export class InstrumentationService implements IInstrumentationService {
  startSpan<T>(_options: SpanOptions, callback: () => T): T {
    return callback();
  }

  async instrumentServerAction<T>(
    _name: string,
    _options: Record<string, unknown>,
    callback: () => Promise<T>
  ): Promise<T> {
    return callback();
  }
}
