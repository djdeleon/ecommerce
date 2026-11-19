import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { id });
  fn.url = path;
  return fn;
}

export const networkLegs = {
  index: '/api/v1/network-legs',
  store: '/api/v1/network-legs',
  show: createPath('/api/v1/network-legs/:id'),
  update: createPath('/api/v1/network-legs/:id'),
  delete: createPath('/api/v1/network-legs/:id'),
} as const;
