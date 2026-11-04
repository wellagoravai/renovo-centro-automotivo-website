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

export const api = {
  async get(url: string) {
    const fullUrl = buildApiUrl(url, API_URL);
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(fullUrl, { headers });
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return response;
  },

  async post(url: string, data: any) {
    const fullUrl = buildApiUrl(url, API_URL);
    const token = localStorage.getItem('token');
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {
      // FormData define seu próprio Content-Type (com boundary) — o navegador
      // só faz isso certo se a gente não fixar o header na mão.
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return response;
  },

  async put(url: string, data: any) {
    const fullUrl = buildApiUrl(url, API_URL);
    const token = localStorage.getItem('token');
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return response;
  },

  async patch(url: string, data: any) {
    const fullUrl = buildApiUrl(url, API_URL);
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(fullUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return response;
  },

  async delete(url: string) {
    const fullUrl = buildApiUrl(url, API_URL);
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return response;
  },
};

export default api;
