import { createModule } from "@evyweb/ioctopus";

import { InstrumentationService } from "@/src/infrastructure/services/instrumentation.service";
import { MockInstrumentationService } from "@/src/infrastructure/services/instrumentation.service.mock";
import { CrashReporterService } from "@/src/infrastructure/services/crash-reporter.service";
import { MockCrashReporterService } from "@/src/infrastructure/services/crash-reporter.service.mock";

import { stage } from "@/src/env/environments";
import { DI_SYMBOLS } from "@/di/types";

export function createMonitoringModule() {
  const monitoringModule = createModule();

  // ── Infrastructure: the only conditional in the whole app ──
  if (stage === "test") {
    monitoringModule.bind(DI_SYMBOLS.IInstrumentationService).toClass(MockInstrumentationService);
    monitoringModule.bind(DI_SYMBOLS.ICrashReporterService).toClass(MockCrashReporterService);
  } else {
    monitoringModule.bind(DI_SYMBOLS.IInstrumentationService).toValue(new InstrumentationService());
    monitoringModule.bind(DI_SYMBOLS.ICrashReporterService).toValue(new CrashReporterService());
  }

  return monitoringModule;
}
