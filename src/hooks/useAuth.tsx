import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import ReauthModal from '../components/ReauthModal';
import { api, setUnauthorizedHandler } from '../services/api';
import { shouldRenewToken } from '../services/session';
import { clearDrafts, clearExpiredDrafts } from './useFormDraft';
import '../styles/Session.css';

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

const RENEW_CHECK_INTERVAL_MS = 10 * 60 * 1000;

// Lido já na primeira renderização: se a sessão só aparecesse depois, recarregar a página
// (o celular faz isso sozinho ao voltar para o navegador) jogaria o usuário para o início.
function readStoredSession(): { token: string; user: User } | null {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return token && user ? { token, user } : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => readStoredSession()?.user ?? null);
  const [token, setToken] = useState<string | null>(() => readStoredSession()?.token ?? null);

  // Sessão vencida: resolve() continua a requisição que estava esperando a senha.
  const [reauthOpen, setReauthOpen] = useState(false);
  const resolveReauth = useRef<((recovered: boolean) => void) | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  useEffect(() => {
    clearExpiredDrafts();
    setUnauthorizedHandler(() => {
      if (!userRef.current) return false;
      return new Promise<boolean>((resolve) => {
        resolveReauth.current = resolve;
        setReauthOpen(true);
      });
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const finishReauth = (recovered: boolean) => {
    setReauthOpen(false);
    if (resolveReauth.current) resolveReauth.current(recovered);
    resolveReauth.current = null;
  };

  const storeSession = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let renewing = false;
    const renew = async () => {
      const current = localStorage.getItem('token');
      if (renewing || document.visibilityState === 'hidden' || !shouldRenewToken(current)) return;
      renewing = true;
      try {
        const response = await api.post('/Auth/refresh', {});
        if (!response.ok) return;
        const data = await response.json();
        // Saiu ou entrou de novo enquanto a resposta vinha: não mexe na sessão atual.
        if (data.token && localStorage.getItem('token') === current) storeSession(data.token, data.user);
      } catch (error) {
        console.warn('Sessão não renovada agora; tenta de novo depois.', error);
      } finally {
        renewing = false;
      }
    };

    renew();
    const timer = setInterval(renew, RENEW_CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', renew);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', renew);
    };
  }, [userId]);

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

    storeSession(newToken, userData);

    // Forçar atualização do estado antes de redirecionar
    await new Promise(resolve => setTimeout(resolve, 50));
  };

  const endSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Saída pelo botão "Sair": apaga também os rascunhos guardados no navegador.
  const logout = () => {
    clearDrafts();
    endSession();
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    const permissions = user.permissions.split(',');
    return permissions.indexOf(permission) >= 0;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, hasPermission }}>
      {children}
      {reauthOpen && user && (
        <ReauthModal
          userName={user.fullName || user.userName}
          onConfirm={async (password) => {
            await login(user.userName, password);
            finishReauth(true);
          }}
          onLeave={() => {
            // Mantém os rascunhos: voltam quando este mesmo usuário entrar.
            endSession();
            finishReauth(false);
          }}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);