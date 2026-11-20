import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (code: string | number) => compilePath(path, { code });
  fn.url = path;
  return fn;
}

export const deliveries = {
  index: '/api/v1/deliveries',
  store: '/api/v1/deliveries',
  dispatch: createPath('/api/v1/deliveries/:code/dispatch'),
  completed: createPath('/api/v1/deliveries/:code/completed'),
  arrived: createPath('/api/v1/deliveries/:code/arrived'),
} as const;
