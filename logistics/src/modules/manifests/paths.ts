import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (code: string | number) => compilePath(path, { code });
  fn.url = path;
  return fn;
}

export const manifests = {
  index: '/manifests',
  store: '/manifests',
  dispatch: createPath('/manifests/:code/dispatch'),
  complete: createPath('/manifests/:code/complete'),
  arrive: createPath('/manifests/:code/arrive'),
} as const;