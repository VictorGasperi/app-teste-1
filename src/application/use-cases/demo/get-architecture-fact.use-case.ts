import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IArchitectureFactsRepository } from "@/src/application/repositories/architecture-facts.repository.interface";
import { NotFoundError } from "@/src/entities/errors/common";
import type { ArchitectureFact } from "@/src/entities/models/architecture-fact";

/**
 * Reference use case. Note the four things every use case in this codebase
 * does, and nothing more:
 *   - it is a higher-order function: dependencies first, then input;
 *   - its `I<Name>UseCase` type is `ReturnType<typeof ...>`, which is what
 *     di/types.ts imports;
 *   - it wraps its body in a named instrumentation span;
 *   - it depends only on ports and entities, never on an adapter.
 */
export type IGetArchitectureFactUseCase = ReturnType<typeof getArchitectureFactUseCase>;

export const getArchitectureFactUseCase =
  (
    instrumentationService: IInstrumentationService,
    architectureFactsRepository: IArchitectureFactsRepository
  ) =>
  async (input: { excludeId?: string } = {}): Promise<ArchitectureFact> => {
    return instrumentationService.startSpan(
      { name: "Get Architecture Fact Use Case" },
      async () => {
        const facts = await architectureFactsRepository.listAll();
        if (facts.length === 0) {
          throw new NotFoundError("No architecture facts available");
        }

        const candidates =
          facts.length > 1 && input.excludeId
            ? facts.filter((fact) => fact.id !== input.excludeId)
            : facts;

        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    );
  };
