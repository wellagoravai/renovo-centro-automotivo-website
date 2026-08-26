import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { validateCpfOrCnpj } from '../utils/helpers';
import '../styles/Customers.css';

interface Customer {
  id: string;
  name: string;
  document: string;
  phone: string;
  whatsApp: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
  vehicleCount: number;
  serviceOrderCount: number;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { hasPermission } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    whatsApp: '',
    email: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    try {
      const url = search ? `/Customers?search=${encodeURIComponent(search)}` : '/Customers';
      const response = await api.get(url);
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCpfOrCnpj(formData.document)) {
      alert('Informe um CPF ou CNPJ válido.');
      return;
    }
    
    try {
      if (editingCustomer) {
        await api.put(`/Customers/${editingCustomer.id}`, formData);
      } else {
        await api.post('/Customers', formData);
      }
      
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({
        name: '',
        document: '',
        phone: '',
        whatsApp: '',
        email: '',
        address: '',
        notes: '',
      });
      loadCustomers();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      document: customer.document,
      phone: customer.phone,
      whatsApp: customer.whatsApp,
      email: customer.email,
      address: customer.address,
      notes: customer.notes,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    
    try {
      await api.delete(`/Customers/${id}`);
      loadCustomers();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      alert('Erro ao excluir cliente');
    }
  };

  const openNewModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      document: '',
      phone: '',
      whatsApp: '',
      email: '',
      address: '',
      notes: '',
    });
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="customers-page">
      <div className="page-header">
        <h1>Clientes</h1>
        {hasPermission('customers.write') && (
          <button className="btn btn-primary" onClick={openNewModal}>
            + Novo Cliente
          </button>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
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
              <th>CPF/CNPJ</th>
              <th>Telefone</th>
              <th>WhatsApp</th>
              <th>Email</th>
              <th>Veículos</th>
              <th>Ordens</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.document}</td>
                <td>{customer.phone}</td>
                <td>{customer.whatsApp}</td>
                <td>{customer.email}</td>
                <td>{customer.vehicleCount}</td>
                <td>{customer.serviceOrderCount}</td>
                <td>
                  <div className="action-buttons">
                    {hasPermission('customers.write') && (
                      <>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => handleEdit(customer)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(customer.id)}
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CPF/CNPJ *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.document}
                    onChange={(e) => setFormData({...formData, document: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Telefone *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.whatsApp}
                    onChange={(e) => setFormData({...formData, whatsApp: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Endereço</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Observações</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;