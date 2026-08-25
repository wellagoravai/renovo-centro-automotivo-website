import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import '../styles/Inventory.css';

interface InventoryItem {
  id: string;
  code: string;
  description: string;
  supplier: string;
  brand: string;
  category: string;
  quantity: number;
  minimumQuantity: number;
  location: string;
  purchaseValue: number;
  averageValue: number;
  saleValue: number;
  marginPercent: number;
  createdAt: string;
  isLowStock: boolean;
}

interface InventoryFormData {
  code: string;
  description: string;
  supplier: string;
  brand: string;
  category: string;
  quantity: number;
  minimumQuantity: number;
  location: string;
  purchaseValue: number;
  marginPercent: number;
  saleValue: number;
}

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { hasPermission } = useAuth();

  const calculateSaleValue = (purchaseValue: number, marginPercent: number) => {
    const safePurchaseValue = Number(purchaseValue) || 0;
    const safeMarginPercent = Number(marginPercent) || 0;
    return Number((safePurchaseValue * (1 + safeMarginPercent / 100)).toFixed(2));
  };

  const [formData, setFormData] = useState<InventoryFormData>({
    code: '',
    description: '',
    supplier: '',
    brand: '',
    category: '',
    quantity: 0,
    minimumQuantity: 0,
    location: '',
    purchaseValue: 0,
    marginPercent: 0,
    saleValue: 0,
  });

  useEffect(() => {
    loadCategories();
    loadItems();
  }, [search, categoryFilter, showLowStock]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/Inventory/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadItems = async () => {
    try {
      let url = '/Inventory';
      const params = new URLSearchParams();
      
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (showLowStock) params.append('lowStock', 'true');
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      description: '',
      supplier: '',
      brand: '',
      category: '',
      quantity: 0,
      minimumQuantity: 0,
      location: '',
      purchaseValue: 0,
      marginPercent: 0,
      saleValue: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    const marginPercent = item.purchaseValue > 0 ? Number((((item.saleValue - item.purchaseValue) / item.purchaseValue) * 100).toFixed(2)) : 0;
    setFormData({
      code: item.code,
      description: item.description,
      supplier: item.supplier,
      brand: item.brand,
      category: item.category,
      quantity: item.quantity,
      minimumQuantity: item.minimumQuantity,
      location: item.location,
      purchaseValue: item.purchaseValue,
      marginPercent,
      saleValue: item.saleValue,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        // Update existing item
        const response = await api.put(`/Inventory/${editingItem.id}`, formData);
        if (response.ok) {
          alert('✅ Item atualizado com sucesso!');
          setShowModal(false);
          loadItems();
        } else {
          alert('❌ Erro ao atualizar item');
        }
      } else {
        // Create new item
        const response = await api.post('/Inventory', formData);
        if (response.ok) {
          alert('✅ Item cadastrado com sucesso!');
          setShowModal(false);
          loadItems();
        } else {
          const error = await response.json();
          alert(`❌ ${error.message || 'Erro ao cadastrar item'}`);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      alert('❌ Erro ao salvar item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    try {
      const response = await api.delete(`/Inventory/${id}`);
      if (response.ok) {
        alert('✅ Item excluído com sucesso!');
        loadItems();
      } else {
        alert('❌ Erro ao excluir item');
      }
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      alert('❌ Erro ao excluir item');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const next = {
        ...prev,
        [name]: name === 'code' || name === 'description' || name === 'supplier' ||
          name === 'brand' || name === 'category' || name === 'location'
          ? value
          : parseFloat(value) || 0,
      } as InventoryFormData;

      if (name === 'purchaseValue' || name === 'marginPercent') {
        next.saleValue = calculateSaleValue(next.purchaseValue, next.marginPercent);
      }

      return next;
    });
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1>📦 Estoque</h1>
        {hasPermission('inventory.write') && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Novo Item
          </button>
        )}
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Buscar por código, descrição ou marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-control search-input"
        />
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="form-control filter-select"
        >
          <option value="">Todas as Categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showLowStock}
            onChange={(e) => setShowLowStock(e.target.checked)}
          />
          <span>Apenas Estoque Baixo</span>
        </label>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Marca</th>
              <th>Localização</th>
              <th>Qtd</th>
              <th>Mínimo</th>
              <th>Valor Compra</th>
              <th>Valor Venda</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className={item.isLowStock ? 'low-stock' : ''}>
                <td>{item.code}</td>
                <td>{item.description}</td>
                <td>{item.category}</td>
                <td>{item.brand}</td>
                <td>{item.location}</td>
                <td>{item.quantity}</td>
                <td>{item.minimumQuantity}</td>
                <td>R$ {item.purchaseValue.toFixed(2)}</td>
                <td>R$ {item.saleValue.toFixed(2)}</td>
                <td>
                  {item.isLowStock ? (
                    <span className="badge badge-danger">Baixo</span>
                  ) : (
                    <span className="badge badge-success">OK</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    {hasPermission('inventory.write') && (
                      <>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => openEditModal(item)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          🗑️
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

      {items.length === 0 && (
        <div className="empty-state">
          <p>Nenhum item encontrado</p>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Editar Item' : 'Novo Item'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="inventory-code">Código *</label>
                  <input
                    id="inventory-code"
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                    disabled={editingItem !== null}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-description">Descrição *</label>
                  <input
                    id="inventory-description"
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-category">Categoria *</label>
                  <input
                    id="inventory-category"
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                    list="categories-list"
                  />
                  <datalist id="categories-list">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-brand">Marca *</label>
                  <input
                    id="inventory-brand"
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-supplier">Fornecedor</label>
                  <input
                    id="inventory-supplier"
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-location">Localização</label>
                  <input
                    id="inventory-location"
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-quantity">Quantidade *</label>
                  <input
                    id="inventory-quantity"
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-minimumQuantity">Quantidade Mínima *</label>
                  <input
                    id="inventory-minimumQuantity"
                    type="number"
                    name="minimumQuantity"
                    value={formData.minimumQuantity}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-purchaseValue">Valor de Compra (R$) *</label>
                  <input
                    id="inventory-purchaseValue"
                    type="number"
                    name="purchaseValue"
                    value={formData.purchaseValue}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-marginPercent">Margem (%) *</label>
                  <input
                    id="inventory-marginPercent"
                    type="number"
                    name="marginPercent"
                    value={formData.marginPercent}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-saleValue">Valor de Venda (R$) *</label>
                  <input
                    id="inventory-saleValue"
                    type="number"
                    name="saleValue"
                    value={formData.saleValue}
                    className="form-control"
                    readOnly
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;