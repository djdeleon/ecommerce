import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (trackingNumber: string | number) => compilePath(path, { trackingNumber });
  fn.url = path;
  return fn;
}

export const parcels = {
  //   getArrivedAtOriginHub: createPath('/parcels/arrived-at-origin-hub'),
  store: '/parcels',
  //   waybill: createPath('/parcels/:trackingNumber/waybill'),
  //   pickedUp: createPath('/parcels/:trackingNumber/picked-up'),
  //   bagged: createPath('/parcels/:trackingNumber/bagged'),
  //   departedFromHub: createPath('/parcels/:trackingNumber/departed-from-hub'),
  //   arrivedAtHub: createPath('/parcels/:trackingNumber/arrived-at-hub'),
  //   delivered: createPath('/parcels/:trackingNumber/delivered'),
  //   outForDelivery: createPath('/parcels/:trackingNumber/out-for-delivery'),
  //   journey: createPath('/parcels/:trackingNumber/journey'),
} as const;

export const adminParcels = {
  index: '/api/v1/admin/parcels',
  store: '/api/v1/admin/parcels',
  show: createPath('/api/v1/admin/parcels/:trackingNumber'),
  update: createPath('/api/v1/admin/parcels/:trackingNumber'),
  pickedUp: createPath('/parcels/:trackingNumber/picked-up'),
  delete: createPath('/api/v1/admin/parcels/:trackingNumber'),
} as const;

export const clientParcels = {
  index: '/api/v1/client/parcels',
  store: '/api/v1/client/parcels',
  show: createPath('/api/v1/client/parcels/:trackingNumber'),
  update: createPath('/api/v1/client/parcels/:trackingNumber'),
  delete: createPath('/api/v1/client/parcels/:trackingNumber'),
} as const;