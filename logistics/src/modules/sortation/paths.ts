import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string, paramKey: string) => {
  const fn = (id: string | number) => compilePath(path, { [paramKey]: id });
  fn.url = path;
  return fn;
}

export const sortations = {
  sortingBatches: {
    store: '/sortation-batches',
    update: createPath('/sortation-batches/:sortingBatchId', 'sortingBatchId'),
    delete: createPath('/sortation-batches/:sortingBatchId', 'sortingBatchId'),
    tunnelScan: createPath('/sortation-batches/:trackingNumber/tunnel-scan', 'trackingNumber'),
  },
  masterBags: {
    store: '/master-bags',
    update: createPath('/master-bags/:masterBagId', 'masterBagId'),
    delete: createPath('/master-bags/:masterBagId', 'masterBagId'),
    label: createPath('/master-bags/:masterBagCode/label', 'masterBagCode'),
    seal: createPath('/master-bags/:masterBagCode/seal', 'masterBagCode'),
  },
} as const;