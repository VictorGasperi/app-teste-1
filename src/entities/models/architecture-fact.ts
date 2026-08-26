import { z } from "zod";

export const architectureFactSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
});

export type ArchitectureFact = z.infer<typeof architectureFactSchema>;
