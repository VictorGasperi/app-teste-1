import { createContainer } from "@evyweb/ioctopus";

import { DI_RETURN_TYPES, DI_SYMBOLS } from "@/di/types";
import { createMonitoringModule } from "@/di/modules/monitoring.module";
import { createDemoModule } from "@/di/modules/demo.module";

const ApplicationContainer = createContainer();

// Load order matters: a module that binds a symbol another module resolves
// at construction time must be loaded first. Monitoring goes first because
// every use case and controller takes IInstrumentationService.
ApplicationContainer.load(Symbol("MonitoringModule"), createMonitoringModule());
ApplicationContainer.load(Symbol("DemoModule"), createDemoModule());

/**
 * The single entry point into the container. `app/**` calls this to obtain
 * a controller; it may never resolve a repository, service, or use case
 * directly — that would skip the layer that verifies the caller.
 */
export function getInjection<K extends keyof typeof DI_SYMBOLS>(
  symbol: K
): DI_RETURN_TYPES[K] {
  return ApplicationContainer.get(DI_SYMBOLS[symbol]);
}
