import type { IArchitectureFactsRepository } from "@/src/application/repositories/architecture-facts.repository.interface";
import type { ArchitectureFact } from "@/src/entities/models/architecture-fact";

/**
 * Reference adapter. It happens to hold its data in memory, but the layer
 * above it cannot tell — swapping this for a Postgres-backed implementation
 * is a change to this file and one binding in di/modules/demo.module.ts,
 * nothing else.
 */
const FACTS: ArchitectureFact[] = [
  { id: "dependency-rule", text: "Source code dependencies point only inward, toward higher-level policy." },
  { id: "boundaries", text: "A boundary is drawn where the axis of change differs — not where the folders differ." },
  { id: "details", text: "The database and the web framework are details, deferred as long as possible." },
  { id: "testability", text: "Business rules that need a running database to test are not isolated yet." },
  { id: "screaming", text: "A good architecture screams what the system does, not which framework it uses." },
  { id: "inversion", text: "Dependency inversion is what lets a low-level detail depend on a high-level policy." },
];

export class ArchitectureFactsRepository implements IArchitectureFactsRepository {
  async listAll(): Promise<ArchitectureFact[]> {
    return FACTS;
  }
}
