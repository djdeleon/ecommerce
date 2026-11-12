

import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { fleetTransportId: id });
  fn.url = path;
  return fn;
}

export const paths = {
  index: '/fleet-transports',
  store: '/fleet-transports',
  update: createPath('/fleet-transports/:fleetTransportId'),
  delete: createPath('/fleet-transports/:fleetTransportId'),
  depart: createPath('/fleet-transports/:fleetTransportId/depart'),
  telemetry: createPath('/fleet-transports/:fleetTransportId/telemetry'),
  dispatch: createPath('/fleet-transports/:fleetTransportId/dispatch'),
  arrive: createPath('/fleet-transports/:fleetTransportId/arrive'),
} as const;