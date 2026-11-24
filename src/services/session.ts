// Renovação da sessão: o token é trocado por um novo enquanto o sistema está em uso,
// para não vencer no meio do preenchimento de uma OS ou orçamento.
const RENEW_AFTER_MS = 60 * 60 * 1000;

function readToken(token: string): { iat?: number; exp?: number } {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

// Vale renovar: emitido há mais de uma hora e ainda não vencido.
export function shouldRenewToken(token: string | null, now = Date.now()): boolean {
  if (!token) return false;
  const { iat, exp } = readToken(token);
  if (!iat || !exp) return false;
  return now < exp * 1000 && now - iat * 1000 > RENEW_AFTER_MS;
}
