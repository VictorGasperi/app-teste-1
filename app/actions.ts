"use server";

import { getInjection } from "@/di/container";

/**
 * Server Actions are the `web` layer's entry point: they read transport
 * concerns (cookies, headers, redirects), hand a plain input to a
 * controller, and return a serialisable result. No business rule, no
 * repository access, no direct env read lives here.
 */
export async function nextArchitectureFactAction(input: {
  excludeId?: string;
}): Promise<{ id: string; text: string }> {
  const getArchitectureFact = getInjection("IGetArchitectureFactController");
  return getArchitectureFact(input);
}
