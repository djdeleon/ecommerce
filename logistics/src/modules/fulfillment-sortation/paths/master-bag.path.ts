import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string, paramKey: string) => {
  const fn = (id: string | number) => compilePath(path, { [paramKey]: id });
  fn.url = path;
  return fn;
}

export const masterBags = {
  index: '/api/v1/master-bags',
  store: '/api/v1/master-bags',
  show: createPath('/api/v1/master-bags/:id', 'id'),
  update: createPath('/api/v1/master-bags/:id', 'id'),
  delete: createPath('/api/v1/master-bags/:id', 'id'),
  label: createPath('/api/v1/master-bags/:code/label', 'code'),
  seal: createPath('/api/v1/master-bags/:code/seal', 'code'),
  dispatched: createPath('/api/v1/master-bags/:code/dispatched', 'code'),
  delivered: createPath('/api/v1/master-bags/:code/delivered', 'code'),
  unbag: createPath('/api/v1/master-bags/:code/unbag', 'code'),
} as const;