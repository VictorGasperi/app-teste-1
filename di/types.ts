import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ICrashReporterService } from "@/src/application/services/crash-reporter.service.interface";
import type { IArchitectureFactsRepository } from "@/src/application/repositories/architecture-facts.repository.interface";

import type { IGetArchitectureFactUseCase } from "@/src/application/use-cases/demo/get-architecture-fact.use-case";

import type { IGetArchitectureFactController } from "@/src/interface-adapters/controllers/demo/get-architecture-fact.controller";

/**
 * Every injectable in the app has exactly one entry here and one in
 * DI_RETURN_TYPES below, keyed by the interface name. `Symbol.for()` looks
 * the symbol up in the global registry and creates it if absent, so the
 * same key always resolves to the same symbol across module instances.
 *
 * Adding a dependency = add the symbol here, add its type below, bind it in
 * a `di/modules/*.module.ts`. Nothing else in the app references the
 * container directly.
 */
export const DI_SYMBOLS = {
  // Services
  IInstrumentationService: Symbol.for("IInstrumentationService"),
  ICrashReporterService: Symbol.for("ICrashReporterService"),

  // Repositories
  IArchitectureFactsRepository: Symbol.for("IArchitectureFactsRepository"),

  // Use Cases
  IGetArchitectureFactUseCase: Symbol.for("IGetArchitectureFactUseCase"),

  // Controllers
  IGetArchitectureFactController: Symbol.for("IGetArchitectureFactController"),
};

export interface DI_RETURN_TYPES {
  IInstrumentationService: IInstrumentationService;
  ICrashReporterService: ICrashReporterService;

  IArchitectureFactsRepository: IArchitectureFactsRepository;

  IGetArchitectureFactUseCase: IGetArchitectureFactUseCase;

  IGetArchitectureFactController: IGetArchitectureFactController;
}
