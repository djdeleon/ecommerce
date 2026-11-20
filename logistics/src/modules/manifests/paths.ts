import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (code: string | number) => compilePath(path, { code });
  fn.url = path;
  return fn;
}

export const manifests = {
  index: '/api/v1/manifests',
  store: '/api/v1/manifests',
  dispatch: createPath('/api/v1/manifests/:code/dispatch'),
  complete: createPath('/api/v1/manifests/:code/complete'),
  arrive: createPath('/api/v1/manifests/:code/arrive'),
} as const;