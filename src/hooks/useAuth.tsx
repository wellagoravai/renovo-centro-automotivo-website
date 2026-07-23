import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await api.post('/Auth/login', { Username: username, Password: password });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.message || 'Usuário ou senha inválidos';
      throw new Error(message);
    }

    const data = await response.json();
    const { token: newToken, user: userData } = data;

    if (!newToken) {
      throw new Error('Token não recebido do servidor');
    }

    setToken(newToken);
    setUser(userData);

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Forçar atualização do estado antes de redirecionar
    await new Promise(resolve => setTimeout(resolve, 50));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    const permissions = user.permissions.split(',');
    return permissions.indexOf(permission) >= 0;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);