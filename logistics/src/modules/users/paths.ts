import { compilePath } from "#commons/utils/path-compiler.js";

const createPath = (path: string) => {
  const fn = (id: string | number) => compilePath(path, { id });
  fn.url = path;
  return fn;
}

export const users = {
  register: '/api/v1/users/register',
  login: '/api/v1/users/login',
  list: '/api/v1/users',
  roles: '/api/v1/users/roles',
  detail: createPath('/api/v1/users/:id'),
  update: createPath('/api/v1/users/:id'),
  delete: createPath('/api/v1/users/:id'),
} as const;