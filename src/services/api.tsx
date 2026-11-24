export function normalizeApiBaseUrl(rawUrl?: string): string {
  const fallback = 'http://localhost:5000/api';
  const baseUrl = (rawUrl || fallback).trim();
  const withoutTrailingSlash = baseUrl.replace(/\/+$/, '');

  if (!withoutTrailingSlash) {
    return fallback;
  }

  if (/\/api$/i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api`;
}

export function buildApiUrl(path: string, baseUrl?: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizeApiBaseUrl(baseUrl)}${cleanPath}`;
}

const API_URL = normalizeApiBaseUrl(process.env.REACT_APP_API_URL);

// Pede a senha de novo quando a sessão vence; true = entrou e a requisição pode repetir.
type UnauthorizedHandler = () => Promise<boolean> | boolean;

let onUnauthorized: UnauthorizedHandler | null = null;
let recovering: Promise<boolean> | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

async function recoverSession(failedToken: string | null): Promise<boolean> {
  // Outra requisição (ou outra aba) já renovou a sessão nesse meio-tempo.
  const current = localStorage.getItem('token');
  if (current && current !== failedToken) return true;

  if (!onUnauthorized) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return false;
  }

  if (!recovering) {
    const handler = onUnauthorized;
    recovering = (async () => handler())().finally(() => {
      recovering = null;
    });
  }
  return recovering;
}

const isAuthUrl = (url: string) => /^\/?auth\/(login|refresh)$/i.test(url);

function fetchWithToken(url: string, method: string, data: any, token: string | null): Promise<Response> {
  const isFormData = data instanceof FormData;
  const headers: Record<string, string> = {
    // FormData define seu próprio Content-Type (com boundary) — o navegador
    // só faz isso certo se a gente não fixar o header na mão.
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const init: RequestInit = { method, headers };
  if (data !== undefined) {
    init.body = isFormData ? data : JSON.stringify(data);
  }
  return fetch(buildApiUrl(url, API_URL), init);
}

async function send(url: string, method: string, data?: any): Promise<Response> {
  const token = localStorage.getItem('token');
  const response = await fetchWithToken(url, method, data, token);

  // No login, 401 é senha errada; o resto é sessão vencida: recupera e repete a
  // requisição, sem recarregar a página nem perder o formulário aberto.
  if (response.status === 401 && !isAuthUrl(url) && (await recoverSession(token))) {
    return fetchWithToken(url, method, data, localStorage.getItem('token'));
  }
  return response;
}

export const api = {
  get: (url: string) => send(url, 'GET'),
  post: (url: string, data: any) => send(url, 'POST', data),
  put: (url: string, data: any) => send(url, 'PUT', data),
  patch: (url: string, data: any) => send(url, 'PATCH', data),
  delete: (url: string) => send(url, 'DELETE'),
};

export default api;
