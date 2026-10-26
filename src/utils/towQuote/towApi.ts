import { api as siteApi } from '../../services/api';

// O código do orçamento veio do app da equipe, que usa um cliente HTTP que já
// devolve o JSON e lança erro com a mensagem do backend. Este adaptador dá a
// mesma interface sobre o `api` do site (que devolve o Response cru).
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function check(response: Response): Promise<Response> {
  if (response.status === 401) throw new ApiError(401, 'Sessão expirada. Faça login novamente.');
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.message || 'Erro na requisição.');
  }
  return response;
}

async function json<T>(pending: Promise<Response>): Promise<T> {
  const response = await check(await pending);
  if (response.status === 204) return undefined as unknown as T;
  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => json<T>(siteApi.get(path)),
  getBlob: async (path: string) => (await check(await siteApi.get(path))).blob(),
  post: <T>(path: string, body?: unknown) => json<T>(siteApi.post(path, body ?? {})),
  put: <T>(path: string, body?: unknown) => json<T>(siteApi.put(path, body)),
  delete: <T>(path: string) => json<T>(siteApi.delete(path)),
};
