import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { manifestCode: id });
  fn.url = path;
  return fn;
}

export const manifests = {
  index: '/manifests',
  store: '/manifests',
  dispatch: createPath('/manifests/:manifestCode/dispatch'),
  complete: createPath('/manifests/:manifestCode/complete'),
  arrive: createPath('/manifests/:manifestCode/arrive'),
} as const;