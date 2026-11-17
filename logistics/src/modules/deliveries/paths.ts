import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (code: string | number) => compilePath(path, { code });
  fn.url = path;
  return fn;
}

export const deliveries = {
  index: '/deliveries',
  store: '/deliveries',
  dispatch: createPath('/deliveries/:code/dispatch'),
  completed: createPath('/deliveries/:code/completed'),
  arrived: createPath('/deliveries/:code/arrived'),
} as const;
