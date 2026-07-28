export function useApi<T = any>(url: string, options = {}) {
  const config = useRuntimeConfig();

  const baseDomain = import.meta.server ? config.apiServer : "";
  const absoluteUrl = `${baseDomain}${url}`;

  return useFetch<T>(absoluteUrl, options);
}
