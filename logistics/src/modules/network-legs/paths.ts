import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { networkLegId: id });
  fn.url = path;
  return fn;
}

export const networkLegs = {
  store: '/network-legs',
  update: createPath('/network-legs/:networkLegId'),
  delete: createPath('/network-legs/:networkLegId'),
} as const;
