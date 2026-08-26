import type {
  IInstrumentationService,
  SpanOptions,
} from "@/src/application/services/instrumentation.service.interface";

export class MockInstrumentationService implements IInstrumentationService {
  startSpan<T>(_options: SpanOptions, callback: () => T): T {
    return callback();
  }

  instrumentServerAction<T>(
    _name: string,
    _options: Record<string, unknown>,
    callback: () => Promise<T>
  ): Promise<T> {
    return callback();
  }
}
