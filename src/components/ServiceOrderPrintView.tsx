import React from 'react';
import { DAMAGE_POINTS } from './VehicleDamageDiagram';
import '../styles/ServiceOrderPrintView.css';

interface ServiceOrderItem {
  id: string;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
}

interface ServiceOrderPhoto {
  id: string;
  url: string;
}

interface TowServiceDetails {
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

interface ServiceOrderForPrint {
  number: string;
  status: string;
  serviceType?: string;
  customerName: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor?: string;
  vehicleYear?: number;
  entryDate: string;
  estimatedDate?: string;
  problemReported: string;
  diagnosis?: string;
  services?: string;
  value?: number;
  photos?: string;
  responsibleUser?: string;
  towDetails?: TowServiceDetails | null;
  items: ServiceOrderItem[];
}

interface ChecklistForPrint {
  mileage: number;
  fuelLevel: string;
  oilLevel: string;
  steeringFluidLevel: string;
  tireCondition: string;
  tirePressure: string;
  coolingLevel: string;
  generalState: string;
  visualDamage: string;
  observations: string;
  responsibleUser: string;
  damagePoints?: string;
}

interface Props {
  order: ServiceOrderForPrint;
  checklist?: ChecklistForPrint | null;
  checklistBooleanFields?: { key: string; label: string }[];
  photos?: ServiceOrderPhoto[];
}

const DamageDiagramPrint: React.FC<{ markedPoints: string[] }> = ({ markedPoints }) => (
  <div className="os-print-damage-diagram">
    <svg viewBox="0 0 300 500" className="os-print-damage-svg" role="img" aria-label="Diagrama de avarias do veículo">
      <rect x="75" y="45" width="150" height="425" rx="35" fill="#f8f9fa" stroke="#bdc3c7" strokeWidth="2" />
      <rect x="95" y="122" width="110" height="34" rx="6" fill="#eef2f5" stroke="#ccd3d8" />
      <rect x="95" y="344" width="110" height="34" rx="6" fill="#eef2f5" stroke="#ccd3d8" />
      <rect x="16" y="152" width="24" height="52" rx="6" fill="#34495e" />
      <rect x="260" y="152" width="24" height="52" rx="6" fill="#34495e" />
      <rect x="16" y="307" width="24" height="52" rx="6" fill="#34495e" />
      <rect x="260" y="307" width="24" height="52" rx="6" fill="#34495e" />
      {DAMAGE_POINTS.map(point => {
        const marked = markedPoints.includes(point.key);
        return (
          <circle
            key={point.key}
            cx={point.cx}
            cy={point.cy}
            r={12}
            className={`os-print-damage-point ${marked ? 'marked' : ''}`}
          >
            <title>{point.label}</title>
          </circle>
        );
      })}
    </svg>
    <div className="os-print-damage-legend">
      {DAMAGE_POINTS.filter(p => markedPoints.includes(p.key)).map(point => (
        <span key={point.key} className="os-print-damage-legend-item">• {point.label}</span>
      ))}
      {markedPoints.length === 0 && <span className="os-print-damage-legend-item">Nenhuma avaria marcada.</span>}
    </div>
  </div>
);

const checklistLineFields: { key: keyof ChecklistForPrint; label: string; suffix?: string }[] = [
  { key: 'mileage', label: 'Quilometragem', suffix: ' km' },
  { key: 'fuelLevel', label: 'Nível de combustível' },
  { key: 'oilLevel', label: 'Nível de óleo do motor' },
  { key: 'steeringFluidLevel', label: 'Nível de óleo de direção' },
  { key: 'tireCondition', label: 'Condição dos pneus' },
  { key: 'tirePressure', label: 'Calibragem dos pneus' },
  { key: 'coolingLevel', label: 'Nível de arrefecimento' },
];

const ServiceOrderPrintView: React.FC<Props> = ({ order, checklist, checklistBooleanFields = [], photos = [] }) => {
  const mechanicName = checklist?.responsibleUser || order.responsibleUser;
  const isTow = order.serviceType === 'Guincho';
  const damagePoints = checklist?.damagePoints ? checklist.damagePoints.split(',').filter(Boolean) : [];
  const towDetails = order.towDetails;
  const items = order.items || [];

  return (
    <div className="print-only os-print">
      <div className="os-print-header">
        <div>
          <h1>Renovo Centro Automotivo</h1>
          <p>Ordem de Serviço nº {order.number}</p>
        </div>
        <div className="os-print-status">{order.status}</div>
      </div>

      <div className="os-print-grid">
        <div>
          <h3>Cliente</h3>
          <p>{order.customerName}</p>
        </div>
        <div>
          <h3>Veículo</h3>
          <p>{order.vehiclePlate} — {order.vehicleBrand} {order.vehicleModel}</p>
          <p>
            {[order.vehicleColor, order.vehicleYear ? String(order.vehicleYear) : null]
              .filter(Boolean)
              .join(' · ') || '—'}
          </p>
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

      {items.length > 0 && (
        <section>
          <h3>Peças e Insumos Utilizados</h3>
          <table className="os-print-table">
            <thead>
              <tr><th>Código</th><th>Descrição</th><th>Qtd</th><th>Valor Unit.</th><th>Total</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
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

      <section className="os-print-checklist-section">
        <h3>Checklist do Veículo{!checklist && ' (preencher à mão)'}</h3>
        <div className="os-print-checklist-lines">
          {checklistLineFields.map(({ key, label, suffix }) => {
            const rawValue = checklist ? (checklist as unknown as Record<string, unknown>)[key] : null;
            const hasValue = rawValue !== null && rawValue !== undefined && rawValue !== '' && rawValue !== 0;
            return (
              <div key={label} className="os-print-line-field">
                <span>{label}:</span>
                {hasValue ? (
                  <strong>{String(rawValue)}{suffix || ''}</strong>
                ) : (
                  <span className="os-print-fill-line" />
                )}
              </div>
            );
          })}
        </div>
        <div className="os-print-checklist-grid">
          {checklistBooleanFields.map(({ key, label }) => (
            <span key={key} className="os-print-check">
              <span className="os-print-checkbox">{checklist && (checklist as unknown as Record<string, unknown>)[key] ? '☑' : '☐'}</span>
              {label}
            </span>
          ))}
        </div>
        <div className="os-print-line-field os-print-line-field-wide">
          <span>Estado geral:</span>
          {checklist?.generalState ? <strong>{checklist.generalState}</strong> : <span className="os-print-fill-line" />}
        </div>
        <div className="os-print-line-field os-print-line-field-wide">
          <span>Avarias visuais:</span>
          {checklist?.visualDamage ? <strong>{checklist.visualDamage}</strong> : <span className="os-print-fill-line" />}
        </div>
        <div className="os-print-line-field os-print-line-field-wide">
          <span>Observações:</span>
          {checklist?.observations ? <strong>{checklist.observations}</strong> : <span className="os-print-fill-line" />}
        </div>
      </section>

      {photos.length > 0 && (
        <section className="os-print-photos-section">
          <h3>Fotos do Veículo</h3>
          <div className="os-print-photo-grid">
            {photos.map(photo => (
              <div key={photo.id} className="os-print-photo-item">
                <img src={photo.url} alt="Foto do veículo" />
              </div>
            ))}
          </div>
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
          <span>Assinatura do Responsável Técnico{mechanicName ? ` — ${mechanicName}` : ''}</span>
        </div>
      </div>

      {isTow && (
        <div className="os-print-page-break">
          <div className="os-print-header">
            <div>
              <h1>Renovo Centro Automotivo</h1>
              <p>Laudo de Avarias do Veículo — OS nº {order.number}</p>
            </div>
            <div className="os-print-status">Guincho</div>
          </div>

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
              <h3>Seguradora</h3>
              <p>{towDetails?.insuranceCompany || '—'}</p>
            </div>
            <div>
              <h3>Nº do Sinistro</h3>
              <p>{towDetails?.claimNumber || '—'}</p>
            </div>
            <div>
              <h3>Assistência</h3>
              <p>{towDetails?.assistanceCompany || '—'}</p>
            </div>
            <div>
              <h3>Viatura</h3>
              <p>{towDetails?.towUnit || '—'}</p>
            </div>
            <div>
              <h3>Local do Atendimento</h3>
              <p>{towDetails?.pickupLocation || '—'}</p>
            </div>
            <div>
              <h3>Destino da Entrega</h3>
              <p>{towDetails?.deliveryDestination || '—'}</p>
            </div>
          </div>

          <section>
            <h3>Diagrama de Avarias</h3>
            <DamageDiagramPrint markedPoints={damagePoints} />
          </section>

          <section>
            <h3>Avarias Visuais</h3>
            <p>{checklist?.visualDamage || '—'}</p>
          </section>

          <section>
            <h3>Observações</h3>
            <p>{checklist?.observations || '—'}</p>
          </section>

          <div className="os-print-signatures">
            <div className="os-print-signature">
              <span>
                Entregue por{towDetails?.deliveredByName ? `: ${towDetails.deliveredByName}` : ''}
                {towDetails?.deliveredByDocument ? ` — ${towDetails.deliveredByDocument}` : ''}
              </span>
            </div>
            <div className="os-print-signature">
              <span>
                Recebido por{towDetails?.receivedByName ? `: ${towDetails.receivedByName}` : ''}
                {towDetails?.receivedByDocument ? ` — ${towDetails.receivedByDocument}` : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrderPrintView;
