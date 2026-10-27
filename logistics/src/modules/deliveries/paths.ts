import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { deliveryCode: id });
  fn.url = path;
  return fn;
}

export const deliveries = {
  index: '/deliveries',
  store: '/deliveries',
  dispatch: createPath('/deliveries/:deliveryCode/dispatch'),
  completed: createPath('/deliveries/:deliveryCode/completed'),
  arrived: createPath('/deliveries/:deliveryCode/arrived'),
} as const;
