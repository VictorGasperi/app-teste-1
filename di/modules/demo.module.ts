import { createModule } from "@evyweb/ioctopus";

import { ArchitectureFactsRepository } from "@/src/infrastructure/repositories/architecture-facts.repository";
import { getArchitectureFactUseCase } from "@/src/application/use-cases/demo/get-architecture-fact.use-case";
import { getArchitectureFactController } from "@/src/interface-adapters/controllers/demo/get-architecture-fact.controller";

import { DI_SYMBOLS } from "@/di/types";

/**
 * Reference module: delete it once the app has real features, or keep it as
 * the shape to copy. Note the three sections every module has, in this
 * order — infrastructure, use cases, controllers — and that only the
 * infrastructure section is ever allowed to branch on `stage`.
 */
export function createDemoModule() {
  const demoModule = createModule();

  // ── Infrastructure ──
  // This adapter is in-memory in every stage, so it needs no `stage`
  // branch. An adapter that talks to a real system gets one:
  //   if (stage === "test") { bind(...).toClass(MockX) } else { bind(...).toValue(new X()) }
  demoModule
    .bind(DI_SYMBOLS.IArchitectureFactsRepository)
    .toValue(new ArchitectureFactsRepository());

  // ── Use cases ──
  demoModule
    .bind(DI_SYMBOLS.IGetArchitectureFactUseCase)
    .toHigherOrderFunction(getArchitectureFactUseCase, [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.IArchitectureFactsRepository,
    ]);

  // ── Controllers ──
  demoModule
    .bind(DI_SYMBOLS.IGetArchitectureFactController)
    .toHigherOrderFunction(getArchitectureFactController, [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.IGetArchitectureFactUseCase,
    ]);

  return demoModule;
}
