export type SpanOptions = {
  name: string;
  op?: string;
  attributes?: Record<string, string | number | boolean>;
};

export interface IInstrumentationService {
  startSpan<T>(options: SpanOptions, callback: () => T): T;
  instrumentServerAction<T>(
    name: string,
    options: Record<string, unknown>,
    callback: () => Promise<T>
  ): Promise<T>;
}
