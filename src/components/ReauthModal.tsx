import React, { useState } from 'react';

interface ReauthModalProps {
  userName: string;
  onConfirm: (password: string) => Promise<void>;
  onLeave: () => void;
}

// Sessão vencida: pede só a senha por cima da tela atual, sem fechar o formulário.
const ReauthModal: React.FC<ReauthModalProps> = ({ userName, onConfirm, onLeave }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setSubmitting(true);
    try {
      await onConfirm(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
      setSubmitting(false);
    }
  };

  return (
    <div className="reauth-overlay">
      <form className="reauth-card" role="dialog" aria-modal="true" aria-labelledby="reauth-title" onSubmit={handleSubmit}>
        <h2 id="reauth-title">Confirme sua senha</h2>
        <p>Sua sessão venceu. Digite a senha de <strong>{userName}</strong> para continuar: nada do que você preencheu foi perdido.</p>
        <label htmlFor="reauth-password">Senha</label>
        <input
          id="reauth-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />
        {error && <p className="reauth-error" role="alert">{error}</p>}
        <button type="submit" className="reauth-confirm" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Continuar'}
        </button>
        <button type="button" className="reauth-leave" onClick={onLeave} disabled={submitting}>
          Entrar com outro usuário
        </button>
      </form>
    </div>
  );
};

export default ReauthModal;
