"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { nextArchitectureFactAction } from "@/app/actions";

type Fact = { id: string; text: string };

export function ArchitectureFactCard({ initialFact }: { initialFact: Fact }) {
  const [fact, setFact] = useState(initialFact);
  const [isPending, startTransition] = useTransition();

  function onAnotherFact() {
    startTransition(async () => {
      setFact(await nextArchitectureFactAction({ excludeId: fact.id }));
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-background p-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        Clean Architecture fact
      </span>
      <p className="text-sm">{fact.text}</p>
      <Button type="button" onClick={onAnotherFact} disabled={isPending}>
        {isPending ? "Loading…" : "Another fact"}
      </Button>
    </div>
  );
}
