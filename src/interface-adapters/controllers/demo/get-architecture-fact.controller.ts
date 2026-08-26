import { z } from "zod";

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IGetArchitectureFactUseCase } from "@/src/application/use-cases/demo/get-architecture-fact.use-case";
import { InputParseError } from "@/src/entities/errors/common";
import type { ArchitectureFact } from "@/src/entities/models/architecture-fact";

/**
 * Reference controller. A controller does exactly three things: authenticate
 * the caller (nothing to authenticate here — this route is public), validate
 * raw input into a typed shape, and map the entity the use case returns into
 * a plain serialisable object. It holds no business rule of its own.
 */
function presenter(fact: ArchitectureFact) {
  return { id: fact.id, text: fact.text };
}

const inputSchema = z.object({ excludeId: z.string().optional() });

export type IGetArchitectureFactController = ReturnType<typeof getArchitectureFactController>;

export const getArchitectureFactController =
  (
    instrumentationService: IInstrumentationService,
    getArchitectureFact: IGetArchitectureFactUseCase
  ) =>
  async (
    input: Partial<z.infer<typeof inputSchema>> = {}
  ): Promise<ReturnType<typeof presenter>> => {
    return instrumentationService.startSpan(
      { name: "Get Architecture Fact Controller" },
      async () => {
        const { data, error } = inputSchema.safeParse(input);
        if (error) {
          throw new InputParseError("Invalid architecture fact request", { cause: error });
        }

        return presenter(await getArchitectureFact(data));
      }
    );
  };
