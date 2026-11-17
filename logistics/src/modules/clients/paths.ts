import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { id });
  fn.url = path;
  return fn;
}

export const clients = {
  index: '/api/v1/clients',
  store: '/api/v1/clients',
  show: createPath('/api/v1/clients/:id'),
  update: createPath('/api/v1/clients/:id'),
  destroy: createPath('/api/v1/clients/:id'),
} as const;