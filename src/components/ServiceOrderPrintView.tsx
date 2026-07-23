import React from 'react';
import '../styles/ServiceOrderPrintView.css';

interface ServiceOrderItem {
  id: string;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
}

interface ChecklistData {
  mileage: number;
  fuelLevel: string;
  tireCondition: string;
  coolingLevel: string;
  oilLevel: string;
  tirePressure: string;
  spareTire: boolean;
  rims: boolean;
  headlights: boolean;
  taillights: boolean;
  mirrors: boolean;
  windows: boolean;
  windshield: boolean;
  wipers: boolean;
  seats: boolean;
  dashboard: boolean;
  multimedia: boolean;
  airConditioning: boolean;
  jack: boolean;
  triangle: boolean;
  spareKey: boolean;
  documents: boolean;
  generalState: string;
  observations: string;
}

interface ServiceOrderForPrint {
  number: string;
  status: string;
  customerName: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  entryDate: string;
  estimatedDate?: string;
  problemReported: string;
  diagnosis?: string;
  services?: string;
  value?: number;
  photos?: string;
  items: ServiceOrderItem[];
}

interface Props {
  order: ServiceOrderForPrint;
  checklist: ChecklistData | null;
}

const checklistLabels: { key: keyof ChecklistData; label: string }[] = [
  { key: 'spareTire', label: 'Estepe' },
  { key: 'rims', label: 'Rodas' },
  { key: 'headlights', label: 'Faróis' },
  { key: 'taillights', label: 'Lanternas' },
  { key: 'mirrors', label: 'Retrovisores' },
  { key: 'windows', label: 'Vidros' },
  { key: 'windshield', label: 'Para-brisa' },
  { key: 'wipers', label: 'Palhetas' },
  { key: 'seats', label: 'Bancos' },
  { key: 'dashboard', label: 'Painel' },
  { key: 'multimedia', label: 'Multimídia' },
  { key: 'airConditioning', label: 'Ar-condicionado' },
  { key: 'jack', label: 'Macaco' },
  { key: 'triangle', label: 'Triângulo' },
  { key: 'spareKey', label: 'Chave reserva' },
  { key: 'documents', label: 'Documentos' },
];

const ServiceOrderPrintView: React.FC<Props> = ({ order, checklist }) => {
  const firstPhoto = order.photos ? order.photos.split(',').filter(Boolean)[0] : null;

  return (
    <div className="print-only os-print">
      <div className="os-print-header">
        <div>
          <h1>Renovo Centro Automotivo</h1>
          <p>Ordem de Serviço nº {order.number}</p>
        </div>
        <div className="os-print-status">{order.status}</div>
      </div>

      {firstPhoto && (
        <div className="os-print-photo">
          <img src={firstPhoto} alt="Veículo" />
        </div>
      )}

      <div className="os-print-grid">
        <div>
          <h3>Cliente</h3>
          <p>{order.customerName}</p>
        </div>
        <div>
          <h3>Veículo</h3>
          <p>{order.vehiclePlate} — {order.vehicleBrand} {order.vehicleModel}</p>
        </div>
        <div>
          <h3>Entrada</h3>
          <p>{new Date(order.entryDate).toLocaleString('pt-BR')}</p>
        </div>
        <div>
          <h3>Previsão de Conclusão</h3>
          <p>{order.estimatedDate ? new Date(order.estimatedDate).toLocaleString('pt-BR') : 'Não definida'}</p>
        </div>
      </div>

      <section>
        <h3>Problema Relatado</h3>
        <p>{order.problemReported || '—'}</p>
      </section>

      <section>
        <h3>Diagnóstico</h3>
        <p>{order.diagnosis || '—'}</p>
      </section>

      <section>
        <h3>Serviços Realizados</h3>
        <p>{order.services || '—'}</p>
      </section>

      {order.items.length > 0 && (
        <section>
          <h3>Peças e Insumos Utilizados</h3>
          <table className="os-print-table">
            <thead>
              <tr><th>Código</th><th>Descrição</th><th>Qtd</th><th>Valor Unit.</th><th>Total</th></tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id}>
                  <td>{item.itemCode}</td>
                  <td>{item.itemDescription}</td>
                  <td>{item.quantity}</td>
                  <td>R$ {item.unitValue.toFixed(2)}</td>
                  <td>R$ {item.totalValue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {checklist && (
        <section>
          <h3>Checklist do Veículo</h3>
          <div className="os-print-checklist-meta">
            <span>KM: {checklist.mileage.toLocaleString('pt-BR')}</span>
            <span>Combustível: {checklist.fuelLevel || '—'}</span>
            <span>Nível de óleo: {checklist.oilLevel || '—'}</span>
            <span>Pneus: {checklist.tireCondition || '—'}</span>
            <span>Arrefecimento: {checklist.coolingLevel || '—'}</span>
            <span>Calibragem: {checklist.tirePressure || '—'}</span>
          </div>
          <div className="os-print-checklist-grid">
            {checklistLabels.map(({ key, label }) => (
              <label key={key} className="os-print-check">
                <span className="os-print-checkbox">{checklist[key] ? '☑' : '☐'}</span>
                {label}
              </label>
            ))}
          </div>
          {checklist.generalState && (
            <p><strong>Estado geral:</strong> {checklist.generalState}</p>
          )}
          {checklist.observations && (
            <p><strong>Observações do checklist:</strong> {checklist.observations}</p>
          )}
        </section>
      )}

      {typeof order.value === 'number' && order.value > 0 && (
        <section>
          <h3>Valor Total</h3>
          <p className="os-print-value">R$ {order.value.toFixed(2)}</p>
        </section>
      )}

      <div className="os-print-signatures">
        <div className="os-print-signature">
          <span>Assinatura do Cliente</span>
        </div>
        <div className="os-print-signature">
          <span>Assinatura do Responsável Técnico</span>
        </div>
      </div>
    </div>
  );
};

export default ServiceOrderPrintView;
