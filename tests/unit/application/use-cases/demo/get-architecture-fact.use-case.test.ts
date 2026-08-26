import { getArchitectureFactUseCase } from "@/src/application/use-cases/demo/get-architecture-fact.use-case";
import { MockArchitectureFactsRepository } from "@/src/infrastructure/repositories/architecture-facts.repository.mock";
import { MockInstrumentationService } from "@/src/infrastructure/services/instrumentation.service.mock";
import { NotFoundError } from "@/src/entities/errors/common";

function makeGetFact(repository = new MockArchitectureFactsRepository()) {
  return getArchitectureFactUseCase(new MockInstrumentationService(), repository);
}

describe("getArchitectureFactUseCase", () => {
  it("returns a fact from the repository", async () => {
    const getFact = makeGetFact();

    await expect(getFact()).resolves.toMatchObject({ id: expect.any(String) });
  });

  it("never returns the excluded fact when another one exists", async () => {
    const getFact = makeGetFact();

    for (let i = 0; i < 20; i++) {
      await expect(getFact({ excludeId: "a" })).resolves.toMatchObject({ id: "b" });
    }
  });

  it("returns the only fact even when it is the excluded one", async () => {
    const getFact = makeGetFact(
      new MockArchitectureFactsRepository([{ id: "only", text: "The only fact" }])
    );

    await expect(getFact({ excludeId: "only" })).resolves.toMatchObject({ id: "only" });
  });

  it("throws NotFoundError when the repository is empty", async () => {
    const getFact = makeGetFact(new MockArchitectureFactsRepository([]));

    await expect(getFact()).rejects.toBeInstanceOf(NotFoundError);
  });

  it("wraps execution in a 'Get Architecture Fact Use Case' span", async () => {
    const instrumentationService = new MockInstrumentationService();
    const spy = jest.spyOn(instrumentationService, "startSpan");
    const getFact = getArchitectureFactUseCase(
      instrumentationService,
      new MockArchitectureFactsRepository()
    );

    await getFact();

    expect(spy).toHaveBeenCalledWith(
      { name: "Get Architecture Fact Use Case" },
      expect.any(Function)
    );
  });
});
