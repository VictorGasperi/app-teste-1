import { connection } from "next/server";

import { CenteredCardShell } from "@/components/shared/centered-card-shell";
import { ArchitectureFactCard } from "@/components/demo/architecture-fact-card";
import { getInjection } from "@/di/container";

/**
 * Smoke-test page for a freshly bootstrapped project. It is deliberately a
 * full vertical slice — server component → controller → use case → port →
 * adapter — so that rendering it proves the whole wiring works, not just
 * that Next.js starts. Replace it with your first real page; keep the shape.
 */
export default async function Home() {
  // Without this the page is prerendered at build time and every visitor
  // sees the same fact. `connection()` stops prerendering, so the slice
  // actually runs per request — which is what makes this a smoke test.
  await connection();

  const getArchitectureFact = getInjection("IGetArchitectureFactController");
  const fact = await getArchitectureFact();

  return (
    <CenteredCardShell>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Welcome to nextjs-mvp-template</h1>
          <p className="text-sm text-muted-foreground">
            Your project is initialised and every architectural layer is wired up.
          </p>
        </div>
        <ArchitectureFactCard initialFact={fact} />
      </div>
    </CenteredCardShell>
  );
}
