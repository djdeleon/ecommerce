

import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { id });
  fn.url = path;
  return fn;
}

export const fleetTransports = {
  index: '/fleet-transports',
  tasks: '/fleet-transports/tasks',
  schedules: '/fleet-transports/schedules',
  create: '/fleet-transports/create',
  store: '/fleet-transports',
  update: createPath('/fleet-transports/:id'),
  delete: createPath('/fleet-transports/:id'),
  depart: createPath('/fleet-transports/:id/depart'),
  telemetry: createPath('/fleet-transports/:id/telemetry'),
  dispatch: createPath('/fleet-transports/:id/dispatch'),
  arrive: createPath('/fleet-transports/:id/arrive'),
} as const;