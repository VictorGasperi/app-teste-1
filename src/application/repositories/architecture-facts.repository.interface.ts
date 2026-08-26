import type { ArchitectureFact } from "@/src/entities/models/architecture-fact";

export interface IArchitectureFactsRepository {
  listAll(): Promise<ArchitectureFact[]>;
}
