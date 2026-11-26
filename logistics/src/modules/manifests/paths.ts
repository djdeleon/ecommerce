import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (code: string | number) => compilePath(path, { code });
  fn.url = path;
  return fn;
}

export const manifests = {
  index: '/api/v1/manifests',
  store: '/api/v1/manifests',
  show: createPath('/api/v1/manifests/:code'),
  update: createPath('/api/v1/manifests/:code'),
  dispatch: createPath('/api/v1/manifests/:code/dispatch'),
  accumulate: createPath('/api/v1/manifests/:code/accumulate'),
  complete: createPath('/api/v1/manifests/:code/complete'),
  arrive: createPath('/api/v1/manifests/:code/arrive'),
  cancel: createPath('/api/v1/manifests/:code/cancel'),
  delete: createPath('/api/v1/manifests/:code'),
} as const;