import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string, paramKey: string) => {
  const fn = (id: string | number) => compilePath(path, { [paramKey]: id });
  fn.url = path;
  return fn;
}

export const sortingBatches = {
  index: '/api/v1/sorting-batches',
  store: '/api/v1/sorting-batches',
  show: createPath('/api/v1/sorting-batches/:id', 'id'),
  update: createPath('/api/v1/sorting-batches/:id', 'id'),
  delete: createPath('/api/v1/sorting-batches/:id', 'id'),
  tunnelScan: createPath('/api/v1/sorting-batches/:trackingNumber/tunnel-scan', 'trackingNumber'),
} as const;