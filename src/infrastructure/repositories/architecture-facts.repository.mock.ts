import type { IArchitectureFactsRepository } from "@/src/application/repositories/architecture-facts.repository.interface";
import type { ArchitectureFact } from "@/src/entities/models/architecture-fact";

export class MockArchitectureFactsRepository implements IArchitectureFactsRepository {
  constructor(
    private readonly _facts: ArchitectureFact[] = [
      { id: "a", text: "Fact A" },
      { id: "b", text: "Fact B" },
    ]
  ) {}

  async listAll(): Promise<ArchitectureFact[]> {
    return this._facts;
  }
}
