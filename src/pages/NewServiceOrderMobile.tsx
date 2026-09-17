import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { validateCpfOrCnpj } from '../utils/helpers';
import FreightQuoteCalculator, { emptyFreightQuoteValue } from '../components/FreightQuoteCalculator';
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
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  pricePerKm: number | null;
  axleCount: number | null;
  distanceKm: number | null;
  tollsValue: number | null;
  freightTotal: number | null;
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
  ...emptyFreightQuoteValue,
};

interface FipeMarca {
  codigo: string;
  nome: string;
}

interface ServiceOrderDraft {
  currentStep: number;
  serviceType: 'Oficina' | 'Guincho';
  customer: CustomerData;
  vehicle: VehicleData;
  serviceOrder: ServiceOrderData;
  towDetails: TowDetailsData;
}

const DRAFT_STORAGE_KEY = 'renovo:newServiceOrderDraft';

const NewServiceOrderMobile: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [serviceType, setServiceType] = useState<'Oficina' | 'Guincho'>('Oficina');
  const [towDetails, setTowDetails] = useState<TowDetailsData>(emptyTowDetails);

  const handleTowDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTowDetails({ ...towDetails, [e.target.name]: e.target.value });
  };

  const handleFreightQuoteChange = (patch: Partial<TowDetailsData>) => {
    setTowDetails(prev => ({ ...prev, ...patch }));
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

  const [checkingDocument, setCheckingDocument] = useState(false);
  const [customerChecked, setCustomerChecked] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);

  // Restaura o rascunho salvo antes de mandar o operador cadastrar o cliente (ver
  // handleGoRegisterCustomer) e já reverifica o documento — a essa altura o cliente
  // deve existir de verdade, cadastrado na tela de Clientes.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      const draft: ServiceOrderDraft = JSON.parse(raw);
      setServiceType(draft.serviceType);
      setCustomer(draft.customer);
      setVehicle(draft.vehicle);
      setServiceOrder(draft.serviceOrder);
      setTowDetails(draft.towDetails);
      setCurrentStep(draft.currentStep);
      if (draft.customer.document) {
        checkCustomerDocument(draft.customer.document);
      }
    } catch (error) {
      console.error('Erro ao restaurar rascunho da OS:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkCustomerDocument = async (documentToCheck: string) => {
    const trimmedDocument = documentToCheck.trim();
    if (!validateCpfOrCnpj(trimmedDocument)) return;

    setCheckingDocument(true);
    try {
      const response = await api.get(`/Customers/lookup?document=${encodeURIComponent(trimmedDocument)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.customer) {
          setCustomer(prev => ({
            ...prev,
            document: trimmedDocument,
            name: data.customer.name || '',
            whatsapp: data.customer.whatsApp || '',
            phone: data.customer.phone || '',
            email: data.customer.email || '',
            address: data.customer.address || '',
          }));
          setCustomerFound(true);
          return;
        }
      }
      setCustomerFound(false);
    } catch (error) {
      console.error('Erro ao verificar cliente:', error);
      setCustomerFound(false);
    } finally {
      setCheckingDocument(false);
      setCustomerChecked(true);
    }
  };

  const handleCheckDocument = () => {
    if (!validateCpfOrCnpj(customer.document.trim())) {
      alert('❌ Informe um CPF ou CNPJ válido.');
      return;
    }
    checkCustomerDocument(customer.document);
  };

  // Cliente com esse CPF/CNPJ ainda não existe: em vez de criar um cadastro
  // incompleto na hora, guarda o progresso do wizard e manda o operador cadastrar
  // o cliente de verdade na tela de Clientes. A OS só é criada de fato depois que
  // o operador volta pra cá e o documento é reverificado com sucesso.
  const handleGoRegisterCustomer = () => {
    const draft: ServiceOrderDraft = {
      currentStep,
      serviceType,
      customer,
      vehicle: { ...vehicle, photos: [] },
      serviceOrder,
      towDetails,
    };
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error('Erro ao salvar rascunho da OS:', error);
    }
    const trimmedDocument = customer.document.trim();
    navigate(`/customers?new=1&document=${encodeURIComponent(trimmedDocument)}&returnTo=${encodeURIComponent('/new-service-order')}`);
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
    if (e.target.name === 'document') {
      setCustomerChecked(false);
      setCustomerFound(false);
    }
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setVehicle({ ...vehicle, [e.target.name]: e.target.value });
  };

  // Marcas/modelos vêm da tabela FIPE pública (sem chave, sem custo) — a lista de
  // marcas carrega uma vez ao montar a tela; os modelos de cada marca só são
  // buscados quando o operador digita/seleciona uma marca reconhecida (o campo
  // continua aceitando texto livre pra marcas fora da tabela FIPE).
  const [fipeMarcas, setFipeMarcas] = useState<FipeMarca[]>([]);
  const [fipeModelosCache, setFipeModelosCache] = useState<Record<string, string[]>>({});
  const [loadingFipeModelos, setLoadingFipeModelos] = useState(false);

  useEffect(() => {
    fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas')
      .then(res => res.json())
      .then(data => setFipeMarcas(Array.isArray(data) ? data : []))
      .catch(error => console.error('Erro ao carregar marcas FIPE:', error));
  }, []);

  const currentFipeMarca = fipeMarcas.find(m => m.nome.toLowerCase() === vehicle.brand.trim().toLowerCase());
  const fipeModelOptions = currentFipeMarca ? (fipeModelosCache[currentFipeMarca.codigo] || []) : [];

  const handleBrandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleVehicleChange(e);

    const marca = fipeMarcas.find(m => m.nome.toLowerCase() === e.target.value.trim().toLowerCase());
    if (!marca || fipeModelosCache[marca.codigo]) return;

    setLoadingFipeModelos(true);
    fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marca.codigo}/modelos`)
      .then(res => res.json())
      .then(data => {
        const nomes = Array.isArray(data?.modelos)
          ? data.modelos.map((m: { nome: string }) => m.nome).sort((a: string, b: string) => a.localeCompare(b, 'pt-BR'))
          : [];
        setFipeModelosCache(prev => ({ ...prev, [marca.codigo]: nomes }));
      })
      .catch(error => console.error('Erro ao carregar modelos FIPE:', error))
      .finally(() => setLoadingFipeModelos(false));
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
    if (currentStep === 1 && !customerFound) {
      alert(customerChecked
        ? '❌ Cadastre o cliente antes de continuar.'
        : '❌ Verifique o cliente pelo CPF/CNPJ antes de continuar.');
      return;
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
    if (!customerFound) {
      alert('❌ Cliente ainda não verificado. Volte ao passo 1 e verifique/cadastre o cliente antes de continuar.');
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
      <p className="tab-hint">
        O cadastro do cliente é feito na tela de Clientes. Aqui você só confere se ele já existe pelo CPF/CNPJ.
      </p>
      <div className="form-group">
        <label>CPF/CNPJ *</label>
        <div className="customer-picker">
          <input
            type="text"
            name="document"
            value={customer.document}
            onChange={handleCustomerChange}
            onKeyDown={(e) => e.key === 'Enter' && handleCheckDocument()}
            placeholder="000.000.000-00"
            required
          />
          <button type="button" className="btn-secondary" onClick={handleCheckDocument} disabled={checkingDocument}>
            {checkingDocument ? 'Verificando...' : 'Verificar Cliente'}
          </button>
        </div>
      </div>

      {customerChecked && customerFound && (
        <div className="customer-found-card">
          <p>✅ Cliente encontrado: <strong>{customer.name}</strong></p>
          <p>
            {[customer.phone, customer.whatsapp, customer.email].filter(Boolean).join(' · ') || 'Sem contato cadastrado'}
          </p>
        </div>
      )}

      {customerChecked && !customerFound && (
        <div className="customer-not-found-card">
          <p>⚠️ Nenhum cliente cadastrado com este CPF/CNPJ.</p>
          <button type="button" className="btn-primary" onClick={handleGoRegisterCustomer}>
            Cadastrar Cliente
          </button>
        </div>
      )}
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
          list="fipe-marcas-list"
          name="brand"
          value={vehicle.brand}
          onChange={handleBrandChange}
          placeholder="Digite para buscar (Ex: Toyota)"
          required
        />
        <datalist id="fipe-marcas-list">
          {fipeMarcas.map(marca => (
            <option key={marca.codigo} value={marca.nome} />
          ))}
        </datalist>
      </div>
      <div className="form-group">
        <label>Modelo *</label>
        <input
          type="text"
          list="fipe-modelos-list"
          name="model"
          value={vehicle.model}
          onChange={handleVehicleChange}
          placeholder={loadingFipeModelos ? 'Carregando modelos...' : 'Digite para buscar (Ex: Corolla)'}
          required
        />
        <datalist id="fipe-modelos-list">
          {fipeModelOptions.map(modelo => (
            <option key={modelo} value={modelo} />
          ))}
        </datalist>
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
        <button className="btn-primary" onClick={handleNext} disabled={currentStep === 1 && !customerFound}>
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

      {serviceType === 'Guincho' && (
        <FreightQuoteCalculator value={towDetails} onChange={handleFreightQuoteChange} />
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