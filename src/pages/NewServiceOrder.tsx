import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

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
}

interface ServiceOrderData {
  problemReported: string;
  services: string;
  observations: string;
  estimatedDelivery: string;
  responsibleUser: string;
}

const NewServiceOrder: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

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

  const handleNext = () => {
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
    setLoading(true);

    try {
      // Log para debug
      console.log('Criando OS com dados:', {
        customer,
        vehicle,
        serviceOrder
      });

      const requestData = {
        problemReported: serviceOrder.problemReported,
        services: serviceOrder.services,
        notes: serviceOrder.observations,
        estimatedDate: serviceOrder.estimatedDelivery || null,
        status: 'Recebido',
        responsibleUser: serviceOrder.responsibleUser,
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

      console.log('Request data:', requestData);

      console.log('Making API request to:', '/service-orders/with-customer-vehicle');
      const response = await api.post('/service-orders/with-customer-vehicle', requestData);

      console.log('Response status:', response.status);
      
      // Log headers manually for compatibility
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log('Response headers:', headers);

      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        alert('Ordem de serviço criada com sucesso!');
        navigate(`/service-orders/${data.id}`);
      } else {
        let errorMessage = `Erro ao criar ordem de serviço (Status: ${response.status})`;
        
        // Try to parse error details
        try {
          const error = JSON.parse(responseText);
          console.error('Error details:', error);
          
          if (response.status === 401) {
            errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
          } else if (error.message) {
            errorMessage = `Erro: ${error.message}`;
          } else if (error.errors) {
            // Validation errors
            const errorEntries = Object.keys(error.errors);
            const validationErrors = errorEntries
              .map(field => {
                const messages = error.errors[field];
                const messageArray = Array.isArray(messages) ? messages : [messages];
                return `${field}: ${messageArray.join(', ')}`;
              })
              .join('\n');
            errorMessage = `Erro de validação:\n${validationErrors}`;
          }
        } catch {
          errorMessage = responseText || errorMessage;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Erro completo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao criar ordem de serviço: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="wizard-step">
      <h2>Etapa 1 - Dados do Cliente</h2>
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
      <h2>Etapa 2 - Dados do Veículo</h2>
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
    </div>
  );

  const renderStep3 = () => (
    <div className="wizard-step">
      <h2>Etapa 3 - Recepção</h2>
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

  return (
    <div className="new-service-order">
      <div className="wizard-header">
        <h1>Nova Ordem de Serviço</h1>
        <div className="wizard-progress">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
        </div>
      </div>

      <div className="wizard-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      <div className="wizard-actions">
        {currentStep > 1 && (
          <button className="btn-secondary" onClick={handleBack}>
            Voltar
          </button>
        )}
        {currentStep < 3 ? (
          <button className="btn-primary" onClick={handleNext}>
            Próximo
          </button>
        ) : (
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Ordem de Serviço'}
          </button>
        )}
      </div>
    </div>
  );
};

export default NewServiceOrder;