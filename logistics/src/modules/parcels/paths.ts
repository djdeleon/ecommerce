import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { trackingNumber: id });
  fn.url = path;
  return fn;
}

export const parcels = {
  getArrivedAtOriginHub: createPath('/parcels/arrived-at-origin-hub'),
  store: '/parcels',
  waybill: createPath('/parcels/:trackingNumber/waybill'),
  pickedUp: createPath('/parcels/:trackingNumber/picked-up'),
  bagged: createPath('/parcels/:trackingNumber/bagged'),
  departedFromHub: createPath('/parcels/:trackingNumber/departed-from-hub'),
  arrivedAtHub: createPath('/parcels/:trackingNumber/arrived-at-hub'),
  delivered: createPath('/parcels/:trackingNumber/delivered'),
  outForDelivery: createPath('/parcels/:trackingNumber/out-for-delivery'),
  journey: createPath('/parcels/:trackingNumber/journey'),
} as const;
