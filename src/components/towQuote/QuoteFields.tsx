import React from 'react';
import { Link } from 'react-router-dom';
import type { TowQuote } from '../../utils/towQuote/types';
import { quoteStatusColors } from '../../utils/towQuote/quoteStatus';
import { PAYMENT_METHODS, UF_LIST, describePayment, type InvoiceData } from '../../utils/towQuote/quoteForm';
import { formatCpfCnpj } from '../../utils/helpers';

// Campos comuns aos orçamentos (guincho e empilhadeira).

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}

export const TextField: React.FC<TextFieldProps> = ({ label, value, onChange, placeholder, type = 'text', inputMode }) => (
  <div className="form-group">
    <label>{label}</label>
    <input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

interface PaymentFieldsProps {
  methods: string[];
  deadline: string;
  onMethodsChange: (methods: string[]) => void;
  onDeadlineChange: (deadline: string) => void;
}

export const PaymentFields: React.FC<PaymentFieldsProps> = ({ methods, deadline, onMethodsChange, onDeadlineChange }) => {
  const terms = describePayment(methods, deadline);
  return (
    <>
      <div className="form-group" style={{ marginTop: 14 }}>
        <label>Condição de pagamento</label>
        <div className="form-row">
          {PAYMENT_METHODS.map((method) => (
            <label key={method} className="checkbox-row">
              <input
                type="checkbox"
                checked={methods.includes(method)}
                onChange={(e) => onMethodsChange(PAYMENT_METHODS.filter((m) => (m === method ? e.target.checked : methods.includes(m))))}
              />
              {method}
            </label>
          ))}
        </div>
      </div>
      <TextField label="Prazo (opcional)" value={deadline} onChange={onDeadlineChange} placeholder="Ex: 10 dias após o serviço" />
      <p className="hint">{terms || 'Selecione ao menos uma forma de pagamento.'}</p>
    </>
  );
};

interface InvoiceFieldsProps {
  invoice: InvoiceData;
  onChange: (invoice: InvoiceData) => void;
}

export const InvoiceFields: React.FC<InvoiceFieldsProps> = ({ invoice, onChange }) => {
  const set = (key: keyof InvoiceData) => (value: string) => onChange({ ...invoice, [key]: value });
  return (
    <details className="freight-quote-box quote-invoice">
      <summary>
        <strong>Dados para emissão da nota fiscal</strong>
        <span className="hint">Opcional · quem paga o serviço (associação, seguradora, empresa)</span>
      </summary>
      <div className="compact-fields">
        <div className="form-row">
          <TextField label="Nome / Razão social" value={invoice.name} onChange={set('name')} />
          <TextField label="CNPJ / CPF" value={invoice.document} onChange={(value) => set('document')(formatCpfCnpj(value))} placeholder="00.000.000/0000-00" />
        </div>
        <TextField label="Endereço" value={invoice.address} onChange={set('address')} />
        <div className="form-row">
          <TextField label="Município" value={invoice.city} onChange={set('city')} />
          <div className="form-group form-group-uf">
            <label>UF</label>
            <select value={invoice.state} onChange={(e) => set('state')(e.target.value)}>
              <option value="">—</option>
              {UF_LIST.map((uf) => <option key={uf.sigla} value={uf.sigla}>{uf.sigla}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <TextField label="CEP" value={invoice.zipCode} onChange={set('zipCode')} inputMode="numeric" />
          <TextField label="Telefone" value={invoice.phone} onChange={set('phone')} type="tel" />
        </div>
        <div className="form-row">
          <TextField label="Insc. estadual" value={invoice.stateRegistration} onChange={set('stateRegistration')} />
          <TextField label="Insc. municipal" value={invoice.cityRegistration} onChange={set('cityRegistration')} />
        </div>
        <TextField label="E-mail" type="email" value={invoice.email} onChange={set('email')} />
      </div>
    </details>
  );
};

// Faixa de situação do orçamento salvo (pendente / aprovado com a OS / recusado).
export const QuoteStatusBanner: React.FC<{ quote: TowQuote }> = ({ quote }) => (
  <div className="quote-status-banner" style={{ borderLeftColor: quoteStatusColors[quote.status] }}>
    <span className="status-badge" style={{ backgroundColor: quoteStatusColors[quote.status] }}>{quote.status}</span>
    <span className="hint">
      {quote.status === 'Aprovado' && quote.serviceOrderId && (
        <>OS <Link to={`/service-orders/${quote.serviceOrderId}`}>{quote.serviceOrderNumber ?? 'aberta'}</Link> · alterações não são mais salvas</>
      )}
      {quote.status === 'Recusado' && 'Gerar um novo PDF volta o orçamento para pendente.'}
      {quote.status === 'Pendente' && `Salvo em ${new Date(quote.updatedAt).toLocaleString('pt-BR')}`}
    </span>
  </div>
);
