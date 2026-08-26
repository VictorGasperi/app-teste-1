import { getArchitectureFactController } from "@/src/interface-adapters/controllers/demo/get-architecture-fact.controller";
import { getArchitectureFactUseCase } from "@/src/application/use-cases/demo/get-architecture-fact.use-case";
import { MockArchitectureFactsRepository } from "@/src/infrastructure/repositories/architecture-facts.repository.mock";
import { MockInstrumentationService } from "@/src/infrastructure/services/instrumentation.service.mock";
import { InputParseError } from "@/src/entities/errors/common";

function makeController() {
  const instrumentationService = new MockInstrumentationService();
  const controller = getArchitectureFactController(
    instrumentationService,
    getArchitectureFactUseCase(instrumentationService, new MockArchitectureFactsRepository())
  );
  return { controller, instrumentationService };
}

describe("getArchitectureFactController", () => {
  it("returns only the presented fields", async () => {
    const { controller } = makeController();

    const result = await controller();

    expect(Object.keys(result).sort()).toEqual(["id", "text"]);
  });

  it("honours excludeId", async () => {
    const { controller } = makeController();

    await expect(controller({ excludeId: "a" })).resolves.toMatchObject({ id: "b" });
  });

  it("throws InputParseError for a malformed input", async () => {
    const { controller } = makeController();

    await expect(
      controller({ excludeId: 42 } as unknown as { excludeId?: string })
    ).rejects.toBeInstanceOf(InputParseError);
  });

  it("wraps execution in a 'Get Architecture Fact Controller' span", async () => {
    const { controller, instrumentationService } = makeController();
    const spy = jest.spyOn(instrumentationService, "startSpan");

    await controller();

    expect(spy).toHaveBeenCalledWith(
      { name: "Get Architecture Fact Controller" },
      expect.any(Function)
    );
  });
});
