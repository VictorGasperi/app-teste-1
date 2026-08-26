import type { ICrashReporterService } from "@/src/application/services/crash-reporter.service.interface";

export class MockCrashReporterService implements ICrashReporterService {
  private _reportedErrors: unknown[] = [];

  report(error: unknown): string {
    this._reportedErrors.push(error);
    return `mock-event-id-${this._reportedErrors.length}`;
  }

  get reportedErrors(): readonly unknown[] {
    return this._reportedErrors;
  }
}
