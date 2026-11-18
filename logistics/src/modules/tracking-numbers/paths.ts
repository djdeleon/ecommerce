import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (number: string | number) => compilePath(path, { number });
  fn.url = path;
  return fn;
}

export const trackingNumbers = {
  index: '/api/v1/tracking-numbers',
  store: '/api/v1/tracking-numbers',
  show: createPath('/api/v1/tracking-numbers/:number'),
} as const;
