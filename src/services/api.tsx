const API_URL = 'http://localhost:5001/api';

export const api = {
  async get(url: string) {
    const token = localStorage.getItem('token');
    console.log('GET request to:', `${API_URL}${url}`, 'Token:', token ? 'Present' : 'Missing');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${url}`, { headers });
    console.log('GET response status:', response.status);
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return response;
  },

  async post(url: string, data: any) {
    const token = localStorage.getItem('token');
    console.log('POST request to:', `${API_URL}${url}`, 'Token:', token ? 'Present' : 'Missing');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    console.log('POST response status:', response.status);
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return response;
  },

  async put(url: string, data: any) {
    const token = localStorage.getItem('token');
    console.log('PUT request to:', `${API_URL}${url}`, 'Token:', token ? 'Present' : 'Missing');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    
    console.log('PUT response status:', response.status);
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return response;
  },

  async patch(url: string, data: any) {
    const token = localStorage.getItem('token');
    console.log('PATCH request to:', `${API_URL}${url}`, 'Token:', token ? 'Present' : 'Missing');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    
    console.log('PATCH response status:', response.status);
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return response;
  },

  async delete(url: string) {
    const token = localStorage.getItem('token');
    console.log('DELETE request to:', `${API_URL}${url}`, 'Token:', token ? 'Present' : 'Missing');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers,
    });
    
    console.log('DELETE response status:', response.status);
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return response;
  },
};

export default api;
