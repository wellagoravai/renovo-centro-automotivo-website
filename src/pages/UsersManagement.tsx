import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

interface User {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { hasPermission } = useAuth();

  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    fullName: '',
    role: 'Recepção',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    try {
      const url = search ? `/Users?search=${encodeURIComponent(search)}` : '/Users';
      const response = await api.get(url);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    try {
      const url = editingUser ? `/Users/${editingUser.id}` : '/Users';
      const method = editingUser ? 'PUT' : 'POST';

      const dataToSend: any = {
        UserName: formData.userName,
        Email: formData.email,
        FullName: formData.fullName,
        Role: formData.role,
      };

      if (formData.password) {
        dataToSend.Password = formData.password;
      }

      let response;
      if (method === 'POST') {
        response = await api.post(url, dataToSend);
      } else if (method === 'PUT') {
        response = await api.put(url, dataToSend);
      } else if (method === 'PATCH') {
        response = await api.patch(url, dataToSend);
      } else if (method === 'DELETE') {
        response = await api.delete(url);
      } else {
        response = await api.get(url);
      }

      if (response.ok) {
        alert(editingUser ? '✅ Usuário atualizado!' : '✅ Usuário criado!');
        closeModal();
        loadUsers();
      } else {
        const error = await response.json();
        alert(`❌ Erro: ${error.message || 'Erro ao salvar usuário'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('❌ Erro ao salvar usuário');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      password: '',
      confirmPassword: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${user.fullName}?`)) {
      return;
    }

    try {
      const response = await api.delete(`/Users/${user.id}`);

      if (response.ok) {
        alert('✅ Usuário excluído!');
        loadUsers();
      } else {
        alert('❌ Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('❌ Erro ao excluir usuário');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await api.patch(`/Users/${user.id}/toggle-status`, {});

      if (response.ok) {
        loadUsers();
      } else {
        alert('❌ Erro ao alterar status');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('❌ Erro ao alterar status');
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      userName: '',
      email: '',
      fullName: '',
      role: 'Recepção',
      password: '',
      confirmPassword: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const getRoleLabel = (role: string) => {
    const labels: any = {
      'Administrador': 'Administrador',
      'Gerente': 'Gerente',
      'Recepção': 'Recepção',
      'Mecânico': 'Mecânico',
      'Almoxarifado': 'Almoxarifado',
      'Cliente': 'Cliente'
    };
    return labels[role] || role;
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="users-management-page">
      <div className="page-header">
        <h1>👥 Gerenciar Usuários</h1>
        {hasPermission('users.manage') && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Novo Usuário
          </button>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Buscar por nome, usuário ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Usuário</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td><strong>{user.fullName}</strong></td>
                <td>{user.userName}</td>
                <td>{user.email}</td>
                <td>
                  <span className="badge badge-info">{getRoleLabel(user.role)}</span>
                </td>
                <td>
                  <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleEdit(user)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => handleToggleStatus(user)}
                      title={user.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {user.isActive ? '🔒' : '🔓'}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(user)}
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="empty-state">
          <p>Nenhum usuário encontrado</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome Completo *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Usuário *</label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Perfil *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Gerente">Gerente</option>
                  <option value="Recepção">Recepção</option>
                  <option value="Mecânico">Mecânico</option>
                  <option value="Almoxarifado">Almoxarifado</option>
                </select>
              </div>
              <div className="form-group">
                <label>{editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              {(!editingUser || formData.password) && (
                <div className="form-group">
                  <label>Confirmar Senha *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;