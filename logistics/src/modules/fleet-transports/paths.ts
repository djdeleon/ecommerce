import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { id });
  fn.url = path;
  return fn;
}

export const fleetTransports = {
  index: '/api/v1/fleet-transports',
  tasks: '/api/v1/fleet-transports/tasks',
  schedules: '/api/v1/fleet-transports/schedules',
  create: '/api/v1/fleet-transports/create',
  store: '/api/v1/fleet-transports',
  show: createPath('/api/v1/fleet-transports/:id'),
  update: createPath('/api/v1/fleet-transports/:id'),
  delete: createPath('/api/v1/fleet-transports/:id'),
  depart: createPath('/api/v1/fleet-transports/:id/depart'),
  dispatch: createPath('/api/v1/fleet-transports/:id/dispatch'),
  arrive: createPath('/api/v1/fleet-transports/:id/arrive'),
  return: createPath('/api/v1/fleet-transports/:id/return'),
  telemetry: createPath('/api/v1/fleet-transports/:id/telemetry'),
} as const;