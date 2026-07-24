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
}

const checklistBoxLabels = [
  'Estepe', 'Rodas', 'Faróis', 'Lanternas', 'Retrovisores', 'Vidros',
  'Para-brisa', 'Palhetas', 'Bancos', 'Painel', 'Multimídia', 'Ar-condicionado',
  'Macaco', 'Triângulo', 'Chave reserva', 'Documentos',
];

const checklistLineLabels = [
  'Quilometragem', 'Nível de combustível', 'Nível de óleo',
  'Condição dos pneus', 'Calibragem dos pneus', 'Nível de arrefecimento',
];

const ServiceOrderPrintView: React.FC<Props> = ({ order }) => {
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

      <section className="os-print-checklist-section">
        <h3>Checklist do Veículo (preencher à mão)</h3>
        <div className="os-print-checklist-lines">
          {checklistLineLabels.map(label => (
            <div key={label} className="os-print-line-field">
              <span>{label}:</span>
              <span className="os-print-fill-line" />
            </div>
          ))}
        </div>
        <div className="os-print-checklist-grid">
          {checklistBoxLabels.map(label => (
            <span key={label} className="os-print-check">
              <span className="os-print-checkbox">☐</span>
              {label}
            </span>
          ))}
        </div>
        <div className="os-print-line-field os-print-line-field-wide">
          <span>Estado geral:</span>
          <span className="os-print-fill-line" />
        </div>
        <div className="os-print-line-field os-print-line-field-wide">
          <span>Avarias visuais:</span>
          <span className="os-print-fill-line" />
        </div>
        <div className="os-print-line-field os-print-line-field-wide">
          <span>Observações:</span>
          <span className="os-print-fill-line" />
        </div>
      </section>

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
