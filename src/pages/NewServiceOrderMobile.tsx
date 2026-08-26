import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { validateCpfOrCnpj } from '../utils/helpers';
import '../styles/NewServiceOrder.css';

interface CustomerData {
  name: string;
  document: string;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
}

interface VehicleData {
  plate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  mileage: string;
  fuel: string;
  photos: string[];
}

interface ServiceOrderData {
  problemReported: string;
  services: string;
  observations: string;
  estimatedDelivery: string;
  responsibleUser: string;
}

interface TowDetailsData {
  insuranceCompany: string;
  assistanceCompany: string;
  claimNumber: string;
  pickupLocation: string;
  deliveryDestination: string;
  towUnit: string;
  deliveredByName: string;
  deliveredByDocument: string;
  receivedByName: string;
  receivedByDocument: string;
}

const emptyTowDetails: TowDetailsData = {
  insuranceCompany: '',
  assistanceCompany: '',
  claimNumber: '',
  pickupLocation: '',
  deliveryDestination: '',
  towUnit: '',
  deliveredByName: '',
  deliveredByDocument: '',
  receivedByName: '',
  receivedByDocument: '',
};

const NewServiceOrderMobile: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [serviceType, setServiceType] = useState<'Oficina' | 'Guincho'>('Oficina');
  const [towDetails, setTowDetails] = useState<TowDetailsData>(emptyTowDetails);

  const handleTowDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTowDetails({ ...towDetails, [e.target.name]: e.target.value });
  };

  const [customer, setCustomer] = useState<CustomerData>({
    name: '',
    document: '',
    whatsapp: '',
    phone: '',
    email: '',
    address: '',
  });

  const [vehicle, setVehicle] = useState<VehicleData>({
    plate: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    mileage: '',
    fuel: 'Flex',
    photos: [],
  });

  const [serviceOrder, setServiceOrder] = useState<ServiceOrderData>({
    problemReported: '',
    services: '',
    observations: '',
    estimatedDelivery: '',
    responsibleUser: '',
  });

  const [loading, setLoading] = useState(false);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setVehicle({ ...vehicle, [e.target.name]: e.target.value });
  };

  const handleServiceOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setServiceOrder({ ...serviceOrder, [e.target.name]: e.target.value });
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setVehicle(prev => ({
            ...prev,
            photos: [...prev.photos, reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setVehicle(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const trimmedDocument = customer.document.trim();
      if (!validateCpfOrCnpj(trimmedDocument)) {
        alert('❌ Informe um CPF ou CNPJ válido antes de continuar.');
        return;
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const trimmedDocument = customer.document.trim();
    if (!validateCpfOrCnpj(trimmedDocument)) {
      alert('❌ CPF/CNPJ inválido ou ausente. Não é possível abrir o check-in sem documento válido.');
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        problemReported: serviceOrder.problemReported,
        services: serviceOrder.services,
        notes: serviceOrder.observations,
        estimatedDate: serviceOrder.estimatedDelivery || null,
        status: serviceType === 'Guincho' ? 'Chamado recebido' : 'Recebido',
        responsibleUser: serviceOrder.responsibleUser,
        photos: vehicle.photos.join(','),
        serviceType,
        towDetails: serviceType === 'Guincho' ? towDetails : null,
        customer: {
          name: customer.name,
          document: customer.document,
          whatsApp: customer.whatsapp,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
        },
        vehicle: {
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          year: parseInt(vehicle.year) || 0,
          color: vehicle.color,
          mileage: parseInt(vehicle.mileage) || 0,
          fuel: vehicle.fuel,
        },
      };

      const response = await api.post('/service-orders/with-customer-vehicle', requestData);

      if (response.ok) {
        const data = await response.json();
        alert('✅ Ordem de serviço criada com sucesso!');
        navigate(`/service-orders/${data.id}`);
      } else {
        const error = await response.json();
        alert(`❌ Erro: ${error.message || 'Erro ao criar ordem de serviço'}`);
      }
    } catch (error) {
      console.error('Erro completo:', error);
      alert('❌ Erro ao criar ordem de serviço');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="wizard-step">
      <h2>Dados do Cliente</h2>
      <div className="form-group">
        <label>Nome Completo *</label>
        <input
          type="text"
          name="name"
          value={customer.name}
          onChange={handleCustomerChange}
          placeholder="Digite o nome completo"
          required
        />
      </div>
      <div className="form-group">
        <label>CPF/CNPJ *</label>
        <input
          type="text"
          name="document"
          value={customer.document}
          onChange={handleCustomerChange}
          placeholder="000.000.000-00"
          required
        />
      </div>
      <div className="form-group">
        <label>WhatsApp *</label>
        <input
          type="tel"
          name="whatsapp"
          value={customer.whatsapp}
          onChange={handleCustomerChange}
          placeholder="(00) 00000-0000"
          required
        />
      </div>
      <div className="form-group">
        <label>Telefone</label>
        <input
          type="tel"
          name="phone"
          value={customer.phone}
          onChange={handleCustomerChange}
          placeholder="(00) 0000-0000"
        />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={customer.email}
          onChange={handleCustomerChange}
          placeholder="cliente@email.com"
        />
      </div>
      <div className="form-group">
        <label>Endereço</label>
        <input
          type="text"
          name="address"
          value={customer.address}
          onChange={handleCustomerChange}
          placeholder="Rua, número, bairro, cidade - UF"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="wizard-step">
      <h2>Dados do Veículo</h2>
      <div className="form-group">
        <label>Placa *</label>
        <input
          type="text"
          name="plate"
          value={vehicle.plate}
          onChange={handleVehicleChange}
          placeholder="ABC-1234"
          required
        />
      </div>
      <div className="form-group">
        <label>Marca *</label>
        <input
          type="text"
          name="brand"
          value={vehicle.brand}
          onChange={handleVehicleChange}
          placeholder="Ex: Toyota"
          required
        />
      </div>
      <div className="form-group">
        <label>Modelo *</label>
        <input
          type="text"
          name="model"
          value={vehicle.model}
          onChange={handleVehicleChange}
          placeholder="Ex: Corolla"
          required
        />
      </div>
      <div className="form-group">
        <label>Ano *</label>
        <input
          type="number"
          name="year"
          value={vehicle.year}
          onChange={handleVehicleChange}
          placeholder="2024"
          required
        />
      </div>
      <div className="form-group">
        <label>Cor</label>
        <input
          type="text"
          name="color"
          value={vehicle.color}
          onChange={handleVehicleChange}
          placeholder="Ex: Prata"
        />
      </div>
      <div className="form-group">
        <label>Quilometragem</label>
        <input
          type="number"
          name="mileage"
          value={vehicle.mileage}
          onChange={handleVehicleChange}
          placeholder="0"
        />
      </div>
      <div className="form-group">
        <label>Combustível</label>
        <select name="fuel" value={vehicle.fuel} onChange={handleVehicleChange}>
          <option value="Flex">Flex</option>
          <option value="Gasolina">Gasolina</option>
          <option value="Etanol">Etanol</option>
          <option value="Diesel">Diesel</option>
          <option value="Elétrico">Elétrico</option>
          <option value="Híbrido">Híbrido</option>
        </select>
      </div>

      {/* Photo Upload Section */}
      <div className="form-group">
        <label>Fotos do Veículo</label>
        <div className="photo-upload-container">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoCapture}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn-camera"
            onClick={() => fileInputRef.current?.click()}
          >
            📷 Tirar Foto
          </button>
          <button
            type="button"
            className="btn-gallery"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.click();
              }
            }}
          >
            🖼️ Galeria
          </button>
        </div>

        {/* Photo Preview */}
        {vehicle.photos.length > 0 && (
          <div className="photo-preview-grid">
            {vehicle.photos.map((photo, index) => (
              <div key={index} className="photo-preview-item">
                <img src={photo} alt={`Veículo ${index + 1}`} />
                <button
                  type="button"
                  className="photo-remove"
                  onClick={() => removePhoto(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="wizard-step">
      <h2>Recepção</h2>
      <div className="form-group">
        <label>Problema Informado pelo Cliente *</label>
        <textarea
          name="problemReported"
          value={serviceOrder.problemReported}
          onChange={handleServiceOrderChange}
          placeholder="Descreva o problema relatado pelo cliente"
          rows={4}
          required
        />
      </div>
      <div className="form-group">
        <label>Serviço no Veículo</label>
        <textarea
          name="services"
          value={serviceOrder.services}
          onChange={handleServiceOrderChange}
          placeholder="Ex: Trocar óleo e filtros"
          rows={3}
        />
      </div>
      <div className="form-group">
        <label>Observações</label>
        <textarea
          name="observations"
          value={serviceOrder.observations}
          onChange={handleServiceOrderChange}
          placeholder="Observações adicionais"
          rows={3}
        />
      </div>
      <div className="form-group">
        <label>Previsão de Entrega</label>
        <input
          type="datetime-local"
          name="estimatedDelivery"
          value={serviceOrder.estimatedDelivery}
          onChange={handleServiceOrderChange}
        />
      </div>
      <div className="form-group">
        <label>Mecânico Responsável</label>
        <input
          type="text"
          name="responsibleUser"
          value={serviceOrder.responsibleUser}
          onChange={handleServiceOrderChange}
          placeholder="Nome do mecânico responsável"
        />
      </div>
    </div>
  );

  const renderActions = (variant: 'top' | 'bottom') => (
    <div className={`wizard-actions wizard-actions-${variant}`}>
      {currentStep > 1 && (
        <button className="btn-secondary" onClick={handleBack}>
          ← Voltar
        </button>
      )}
      {currentStep < 3 ? (
        <button className="btn-primary" onClick={handleNext}>
          Próximo →
        </button>
      ) : (
        <button className="btn-success" onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Criando...' : '✅ Criar Ordem de Serviço'}
        </button>
      )}
    </div>
  );

  const scrollDown = () => {
    window.scrollBy({ top: Math.round(window.innerHeight * 0.6), behavior: 'smooth' });
  };

  const renderServiceTypeSelector = () => (
    <div className="service-type-section">
      <label className="service-type-title">Tipo de Atendimento</label>
      <div className="service-type-toggle">
        <button
          type="button"
          className={`service-type-btn ${serviceType === 'Oficina' ? 'active' : ''}`}
          onClick={() => setServiceType('Oficina')}
        >
          🔧 Oficina
        </button>
        <button
          type="button"
          className={`service-type-btn service-type-btn-tow ${serviceType === 'Guincho' ? 'active' : ''}`}
          onClick={() => setServiceType('Guincho')}
        >
          🚛 Guincho 24h
        </button>
      </div>

      {serviceType === 'Guincho' && (
        <div className="tow-details-grid">
          <div className="form-group">
            <label>Seguradora</label>
            <input
              type="text"
              name="insuranceCompany"
              value={towDetails.insuranceCompany}
              onChange={handleTowDetailsChange}
              placeholder="Ex: Porto Seguro"
            />
          </div>
          <div className="form-group">
            <label>Assistência</label>
            <input
              type="text"
              name="assistanceCompany"
              value={towDetails.assistanceCompany}
              onChange={handleTowDetailsChange}
              placeholder="Ex: Assist24"
            />
          </div>
          <div className="form-group">
            <label>Sinistro</label>
            <input
              type="text"
              name="claimNumber"
              value={towDetails.claimNumber}
              onChange={handleTowDetailsChange}
              placeholder="Número do sinistro"
            />
          </div>
          <div className="form-group">
            <label>Local do Atendimento</label>
            <input
              type="text"
              name="pickupLocation"
              value={towDetails.pickupLocation}
              onChange={handleTowDetailsChange}
              placeholder="Endereço do resgate"
            />
          </div>
          <div className="form-group">
            <label>Destino da Entrega</label>
            <input
              type="text"
              name="deliveryDestination"
              value={towDetails.deliveryDestination}
              onChange={handleTowDetailsChange}
              placeholder="Endereço de destino"
            />
          </div>
          <div className="form-group">
            <label>Viatura</label>
            <input
              type="text"
              name="towUnit"
              value={towDetails.towUnit}
              onChange={handleTowDetailsChange}
              placeholder="Identificação do guincho"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="new-service-order-mobile">
      {renderServiceTypeSelector()}

      <div className="wizard-header">
        <h1>Nova Ordem de Serviço</h1>
        <div className="wizard-progress-bar">
          <div className="wizard-progress-track">
            <div
              className="wizard-progress-fill"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />
          </div>
          <div className="step-labels">
            {['Cliente', 'Veículo', 'Recepção'].map((label, i) => (
              <span key={label} className={currentStep >= i + 1 ? 'active' : ''}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {renderActions('top')}

      <div className="wizard-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {renderActions('bottom')}

      <button
        type="button"
        className="scroll-down-fab"
        aria-label="Rolar para baixo"
        onClick={scrollDown}
      >
        ↓
      </button>
    </div>
  );
};

export default NewServiceOrderMobile;