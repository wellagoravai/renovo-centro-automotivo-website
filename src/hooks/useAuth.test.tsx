import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';
import { api } from '../services/api';

const USER = { id: '1', userName: 'wesley', fullName: 'Wesley', email: '', role: 'Administrador', permissions: 'orders.write' };
const response = (status: number, body: unknown = {}) => ({ status, ok: status < 400, json: async () => body } as Response);
const jwt = (iat: number, exp: number) => `x.${btoa(JSON.stringify({ iat, exp }))}.x`;

const results: number[] = [];
const Screen: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const save = async () => {
    results.push((await api.post('/service-orders', { a: 1 })).status);
  };
  return (
    <>
      <span>{isAuthenticated ? 'dentro' : 'fora'}</span>
      <input aria-label="placa" defaultValue="" />
      <button onClick={save}>salvar</button>
    </>
  );
};

const renderApp = () => render(<AuthProvider><Screen /></AuthProvider>);

describe('sessão', () => {
  beforeEach(() => {
    localStorage.clear();
    results.length = 0;
    localStorage.setItem('token', 'velho');
    localStorage.setItem('user', JSON.stringify(USER));
  });

  it('já abre logado na primeira renderização, sem passar pela tela de login', () => {
    const seen: string[] = [];
    const Probe: React.FC = () => {
      seen.push(String(useAuth().isAuthenticated));
      return null;
    };
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(seen[0]).toBe('true');
  });

  it('pede a senha sem perder o formulário e repete a requisição', async () => {
    global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const auth = (init!.headers as Record<string, string>)['Authorization'];
      if (String(url).endsWith('/Auth/login')) {
        return JSON.parse(String(init!.body)).Password === 'certa'
          ? response(200, { token: 'novo', user: USER })
          : response(401, { message: 'Credenciais inválidas.' });
      }
      return response(auth === 'Bearer novo' ? 201 : 401);
    }) as jest.Mock;

    renderApp();
    fireEvent.change(screen.getByLabelText('placa'), { target: { value: 'ABC-1D23' } });
    // Duas requisições juntas: um pedido de senha só.
    fireEvent.click(screen.getByText('salvar'));
    fireEvent.click(screen.getByText('salvar'));

    const password = await screen.findByLabelText('Senha');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    fireEvent.change(password, { target: { value: 'errada' } });
    fireEvent.click(screen.getByText('Continuar'));
    expect(await screen.findByText('Credenciais inválidas.')).toBeInTheDocument();

    fireEvent.change(password, { target: { value: 'certa' } });
    fireEvent.click(screen.getByText('Continuar'));
    await waitFor(() => expect(results).toEqual([201, 201]));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByLabelText('placa')).toHaveValue('ABC-1D23');
    expect(screen.getByText('dentro')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('novo');
  });

  it('"Entrar com outro usuário" encerra a sessão e mantém o rascunho', async () => {
    global.fetch = jest.fn().mockResolvedValue(response(401)) as jest.Mock;
    localStorage.setItem('renovo:draft:1:nova-os', JSON.stringify({ savedAt: Date.now(), data: {} }));
    renderApp();
    fireEvent.click(screen.getByText('salvar'));
    fireEvent.click(await screen.findByText('Entrar com outro usuário'));

    expect(await screen.findByText('fora')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('renovo:draft:1:nova-os')).not.toBeNull();
    await waitFor(() => expect(results).toEqual([401]));
  });

  it('renova sozinho o token emitido há mais de uma hora', async () => {
    const now = Math.floor(Date.now() / 1000);
    localStorage.setItem('token', jwt(now - 2 * 3600, now + 3600));
    global.fetch = jest.fn().mockResolvedValue(response(200, { token: 'renovado', user: USER })) as jest.Mock;
    renderApp();
    await waitFor(() => expect(localStorage.getItem('token')).toBe('renovado'));
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toMatch(/\/Auth\/refresh$/);
  });

  it('não renova token recente nem vencido', () => {
    const now = Math.floor(Date.now() / 1000);
    global.fetch = jest.fn() as jest.Mock;
    [jwt(now - 60, now + 3600), jwt(now - 9 * 3600, now - 3600)].forEach((token) => {
      localStorage.setItem('token', token);
      const { unmount } = renderApp();
      unmount();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
