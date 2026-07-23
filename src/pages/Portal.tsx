import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Portal.css';

const Portal: React.FC = () => {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(window.location.search);
    const [modalOpen, setModalOpen] = useState(searchParams.get('login') === 'true');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const openModal = () => {
        setError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setUsername('');
        setPassword('');
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            // Pequeno delay para garantir que o token foi salvo no localStorage
            await new Promise(resolve => setTimeout(resolve, 100));
            // O redirecionamento é feito pelo useEffect quando isAuthenticated mudar
        } catch (err) {
            setError('Usuário ou senha inválidos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="portal-page">
            <div className="container">
                <div className="portal-header">
                    <h1>Área do Cliente</h1>
                    <p>Para acessar os recursos exclusivos do portal, faça login.</p>
                    <button type="button" className="portal-login-button" onClick={openModal}>
                        <span className="portal-login-icon" aria-hidden="true">🔑</span>
                        Entrar no Portal
                    </button>
                </div>

                <div className="portal-content">
                    <div className="portal-card">
                        <div className="card-icon">📋</div>
                        <h2>Checklist de Veículo</h2>
                        <p>Acompanhe o checklist completo do seu veículo em tempo real.</p>
                    </div>

                    <div className="portal-card">
                        <div className="card-icon">🔧</div>
                        <h2>Ordens de Serviço</h2>
                        <p>Visualize e acompanhe suas ordens de serviço abertas.</p>
                    </div>

                    <div className="portal-card">
                        <div className="card-icon">📊</div>
                        <h2>Dashboard</h2>
                        <p>Visão geral completa do histórico e status dos seus serviços.</p>
                    </div>

                    <div className="portal-card">
                        <div className="card-icon">📅</div>
                        <h2>Agendamentos</h2>
                        <p>Consulte e gerencie seus agendamentos de serviços.</p>
                    </div>
                </div>
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Login no Portal</h2>
                            <button type="button" className="modal-close" onClick={closeModal}>
                                ×
                            </button>
                        </div>
                        <form className="modal-form" onSubmit={handleSubmit}>
                            {error && <div className="modal-error">{error}</div>}
                            <label htmlFor="portal-username">Usuário</label>
                            <input
                                id="portal-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                            />
                            <label htmlFor="portal-password">Senha</label>
                            <input
                                id="portal-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="button modal-submit" disabled={loading}>
                                {loading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portal;