import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { InvoiceFields, PaymentFields, QuoteStatusBanner, TextField } from '../components/towQuote/QuoteFields';
import {
  EMPTY_INVOICE,
  PAYMENT_METHODS,
  describePayment,
  errorMessage,
  formatIsoDate,
  invoiceLines,
  toNumber,
  today,
  type InvoiceData,
} from '../utils/towQuote/quoteForm';
import { useAuth } from '../hooks/useAuth';
import { useSavedQuote } from '../hooks/useSavedQuote';
import { formatCpfCnpj } from '../utils/helpers';
import { api } from '../utils/towQuote/towApi';
import type { CreatedServiceOrder, TowQuote } from '../utils/towQuote/types';
import { buildForkliftQuotePdf } from '../utils/towQuote/forkliftQuotePdf';
import {
  FORKLIFT_RENTAL_MODES,
  calculateForkliftPrice,
  describeQuantity,
  rentalModeInfo,
  type ForkliftRentalMode,
} from '../utils/towQuote/forkliftPricing';
import { formatCurrency, shareOrDownloadPdf } from '../utils/towQuote/pdfKit';
import { FORKLIFT_KIND, FORKLIFT_LABEL, FORKLIFT_QUOTES_PATH, TOW_QUOTES_PATH } from '../utils/towQuote/quoteKind';
import '../styles/TowQuoteEditor.css';

const OPERATOR_OPTIONS = ['Com operador', 'Sem operador'];
const TRANSPORT_DESCRIPTION = 'Transporte da empilhadeira pelo guincho (ida e volta)';

// Formulário salvo no histórico (TowQuote.formData), no mesmo endpoint dos
// orçamentos de guincho; `kind` separa os dois tipos.
interface ForkliftFormData {
  kind: typeof FORKLIFT_KIND;
  customer?: Partial<typeof EMPTY_CUSTOMER>;
  equipment?: Partial<typeof EMPTY_EQUIPMENT>;
  rental?: Partial<RentalForm>;
  pallets?: Partial<typeof EMPTY_PALLETS>;
  transport?: Partial<typeof EMPTY_TRANSPORT>;
  paymentMethods?: string[];
  paymentDeadline?: string;
  invoice?: Partial<InvoiceData>;
  notes?: string;
}

type RentalForm = {
  mode: ForkliftRentalMode;
  quantity: string;
  unitValue: string;
  startDate: string;
  endDate: string;
  workAddress: string;
};

const EMPTY_CUSTOMER = { name: '', document: '', phone: '', address: '' };
const EMPTY_EQUIPMENT = { model: '', capacity: '', operator: OPERATOR_OPTIONS[0] };
const EMPTY_PALLETS = { count: '', pricePerPallet: '' };
const EMPTY_TRANSPORT = { included: true, value: '' };

// Orçamento de locação de empilhadeira (hora, diária, mês ou contrato por
// período). Faz parte do serviço de guincho: o guincho leva a empilhadeira, e o
// aprovado vira OS de guincho. Valores digitados à mão por enquanto.
const ForkliftQuoteEditor: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: routeQuoteId } = useParams();
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [approving, setApproving] = useState(false);

  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [equipment, setEquipment] = useState(EMPTY_EQUIPMENT);
  const [rental, setRental] = useState<RentalForm>({
    mode: 'Diária',
    quantity: '1',
    unitValue: '',
    startDate: today(),
    endDate: '',
    workAddress: '',
  });
  const [pallets, setPallets] = useState(EMPTY_PALLETS);
  const [transport, setTransport] = useState(EMPTY_TRANSPORT);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(PAYMENT_METHODS);
  const [paymentDeadline, setPaymentDeadline] = useState('');
  const paymentTerms = describePayment(paymentMethods, paymentDeadline);
  const [invoice, setInvoice] = useState<InvoiceData>(EMPTY_INVOICE);
  const [notes, setNotes] = useState('');

  const field = <T extends Record<string, unknown>>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T) =>
    (value: string) => setter((prev) => ({ ...prev, [key]: value }));

  const applyFormData = (data: ForkliftFormData) => {
    // Orçamento de guincho aberto por um link de empilhadeira: vai para a tela certa.
    if (data.kind !== FORKLIFT_KIND && routeQuoteId) {
      navigate(`${TOW_QUOTES_PATH}/${routeQuoteId}`, { replace: true });
      return;
    }
    if (data.customer) setCustomer((prev) => ({ ...prev, ...data.customer }));
    if (data.equipment) setEquipment((prev) => ({ ...prev, ...data.equipment }));
    if (data.rental) setRental((prev) => ({ ...prev, ...data.rental }));
    if (data.pallets) setPallets((prev) => ({ ...prev, ...data.pallets }));
    if (data.transport) setTransport((prev) => ({ ...prev, ...data.transport }));
    if (data.paymentMethods) setPaymentMethods(PAYMENT_METHODS.filter((m) => data.paymentMethods!.includes(m)));
    if (data.paymentDeadline !== undefined) setPaymentDeadline(data.paymentDeadline);
    if (data.invoice) setInvoice((prev) => ({ ...prev, ...data.invoice }));
    if (data.notes !== undefined) setNotes(data.notes);
  };

  const { savedQuote, loadingQuote, loadError, isApproved, rejecting, saveQuote, storePdf, downloadSavedPdf, rejectQuote, markApproved } =
    useSavedQuote<ForkliftFormData>(routeQuoteId, FORKLIFT_QUOTES_PATH, applyFormData);

  const isPeriod = rental.mode === 'Período';
  const modeInfo = rentalModeInfo(rental.mode);
  const unitValue = toNumber(rental.unitValue);
  const palletCount = toNumber(pallets.count);
  const pricePerPallet = toNumber(pallets.pricePerPallet);
  const price = calculateForkliftPrice({
    mode: rental.mode,
    quantity: toNumber(rental.quantity),
    unitValue,
    palletCount,
    pricePerPallet,
    transportValue: transport.included ? toNumber(transport.value) : null,
  });

  const periodText = [rental.startDate && formatIsoDate(rental.startDate), rental.endDate && formatIsoDate(rental.endDate)]
    .filter(Boolean)
    .join(' a ');
  // "Diária · 3 diárias · 14/10/2026 a 16/10/2026" — resumo para a lista e a OS.
  const rentalSummary = [
    modeInfo.label,
    !isPeriod && price.quantity > 0 && describeQuantity(rental.mode, price.quantity),
    periodText,
    palletCount && `${palletCount.toLocaleString('pt-BR')} paletes`,
  ].filter(Boolean).join(' · ');

  const formSnapshot = (): ForkliftFormData => ({
    kind: FORKLIFT_KIND,
    customer,
    equipment,
    rental,
    pallets,
    transport,
    paymentMethods,
    paymentDeadline,
    invoice,
    notes,
  });

  const saveForkliftQuote = () => saveQuote({
    customerName: customer.name.trim(),
    customerPhone: customer.phone,
    vehiclePlate: '',
    vehicleDescription: [FORKLIFT_LABEL, equipment.model.trim()].filter(Boolean).join(' · '),
    routeSummary: [rentalSummary, rental.workAddress.trim()].filter(Boolean).join(' · '),
    totalKm: null,
    total: price.total,
    formData: JSON.stringify(formSnapshot()),
  });

  const handleGeneratePdf = async () => {
    if (!price.complete) {
      alert(isPeriod ? 'Informe o valor do contrato.' : `Informe a quantidade e o valor por ${modeInfo.unit}.`);
      return;
    }

    setGeneratingPdf(true);
    const warnings: string[] = [];
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');

      let quote: TowQuote | null = null;
      try {
        quote = await saveForkliftQuote();
      } catch (error) {
        warnings.push(`O orçamento não foi salvo no histórico: ${errorMessage(error, 'erro desconhecido')}`);
      }
      const number = quote?.number
        ?? `ORC-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;

      const { blob, fileName } = await buildForkliftQuotePdf({
        number,
        date: now,
        validityDays: 7,
        consultant: user?.fullName ?? '',
        customer,
        equipment,
        rental: { ...rental, unitValue },
        pallets: { count: palletCount, pricePerPallet },
        transport: { included: transport.included, description: TRANSPORT_DESCRIPTION },
        price,
        paymentTerms,
        invoice,
        notes,
      });

      await shareOrDownloadPdf(blob, fileName, `Orçamento ${number}`);

      if (quote) {
        const warning = await storePdf(quote, blob, fileName);
        if (warning) warnings.push(warning);
      }
    } catch (error) {
      console.error('Erro ao gerar PDF do orçamento:', error);
      warnings.push('Não foi possível gerar o PDF do orçamento.');
    } finally {
      setGeneratingPdf(false);
      if (warnings.length > 0) alert(warnings.join('\n'));
    }
  };

  // Aprovado: abre uma OS de guincho com a locação descrita no problema relatado
  // e o detalhamento nas observações (que também saem no PDF da OS).
  const handleApprove = async () => {
    if (isApproved && savedQuote?.serviceOrderId) {
      navigate(`/service-orders/${savedQuote.serviceOrderId}`);
      return;
    }
    if (!customer.name.trim()) {
      alert('Informe o nome do cliente para abrir a OS.');
      return;
    }
    if (!window.confirm(`Orçamento aprovado? Será aberta uma OS de guincho de ${formatCurrency(price.total)}.`)) return;

    setApproving(true);
    let quote: TowQuote | null = null;
    try {
      quote = await saveForkliftQuote();
    } catch (error) {
      const proceed = window.confirm(
        `Não foi possível salvar o orçamento no histórico (${errorMessage(error, 'erro desconhecido')}). Abrir a OS mesmo assim?`
      );
      if (!proceed) {
        setApproving(false);
        return;
      }
    }

    const invoiceData = invoiceLines(invoice);
    const agreement = [
      `Orçamento ${quote ? `${quote.number} ` : ''}de locação de empilhadeira aprovado: ${formatCurrency(price.total)}`,
      `Equipamento: ${[equipment.model.trim() || FORKLIFT_LABEL, equipment.capacity.trim(), equipment.operator].filter(Boolean).join(' · ')}`,
      isPeriod
        ? `Contrato por período${periodText ? ` (${periodText})` : ''}: ${formatCurrency(price.rentalValue)}`
        : `Locação: ${describeQuantity(rental.mode, price.quantity)} x ${formatCurrency(unitValue ?? 0)} = ${formatCurrency(price.rentalValue)}` +
          (periodText ? ` · ${periodText}` : ''),
      palletCount && `Paletes: ${palletCount.toLocaleString('pt-BR')}` +
        (price.palletsValue > 0 ? ` x ${formatCurrency(pricePerPallet ?? 0)} = ${formatCurrency(price.palletsValue)}` : ''),
      transport.included && `${TRANSPORT_DESCRIPTION}: ${price.transportValue > 0 ? formatCurrency(price.transportValue) : 'a consultar'}`,
      paymentTerms && `Pagamento: ${paymentTerms}`,
      invoiceData.length > 0 && `Dados para nota fiscal:\n${invoiceData.join('\n')}`,
      notes.trim() && `Observações: ${notes.trim()}`,
    ].filter(Boolean).join('\n');

    try {
      const order = await api.post<CreatedServiceOrder>('/service-orders/with-customer-vehicle', {
        serviceType: 'Guincho',
        problemReported: `Locação de empilhadeira: ${rentalSummary}${rental.workAddress.trim() ? ` · Local: ${rental.workAddress.trim()}` : ''}`,
        responsibleUser: user?.fullName || '',
        notes: agreement,
        towDetails: {
          insuranceCompany: '',
          assistanceCompany: '',
          claimNumber: '',
          pickupLocation: '',
          deliveryDestination: rental.workAddress,
          towUnit: '',
          deliveredByName: '',
          deliveredByDocument: '',
          receivedByName: '',
          receivedByDocument: '',
          freightTotal: price.total,
        },
        customer: {
          name: customer.name.trim(),
          document: customer.document,
          phone: customer.phone,
          address: customer.address,
        },
        // Sem placa: o backend cria um "veículo" só desta OS, que identifica a empilhadeira.
        vehicle: {
          plate: '',
          brand: FORKLIFT_LABEL,
          model: equipment.model.trim(),
          year: 0,
          color: '',
          mileage: 0,
        },
      });

      if (quote) await markApproved(quote, order.id, order.number);
      navigate(`/service-orders/${order.id}`);
    } catch (error) {
      alert(errorMessage(error, 'Erro ao abrir a OS.'));
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="checkin-page tq-editor tq-wide">
      <div className="page-header">
        <h2>{savedQuote ? `Orçamento ${savedQuote.number}` : 'Orçamento Empilhadeira'}</h2>
        <Link to={TOW_QUOTES_PATH} className="btn-link">← Orçamentos salvos</Link>
      </div>

      {loadingQuote && <p className="hint">Carregando orçamento...</p>}
      {loadError && <p className="error-text">{loadError}</p>}
      {savedQuote && <QuoteStatusBanner quote={savedQuote} />}

      {/* No computador as etapas ficam lado a lado: o orçamento inteiro numa tela. */}
      <div className="tq-columns">
      <section className="tq-col">
      <p className="tq-step"><span>1</span> Cliente e equipamento</p>
      <h3>Cliente</h3>
      <div className="compact-fields">
        <div className="form-row">
          <TextField label="Nome" value={customer.name} onChange={field(setCustomer, 'name')} placeholder="Cliente / empresa" />
          <TextField label="CPF/CNPJ" value={customer.document} onChange={(value) => field(setCustomer, 'document')(formatCpfCnpj(value))} placeholder="00.000.000/0000-00" />
        </div>
        <div className="form-row">
          <TextField label="Telefone" value={customer.phone} onChange={field(setCustomer, 'phone')} placeholder="(18) 99999-9999" type="tel" />
          <TextField label="Endereço" value={customer.address} onChange={field(setCustomer, 'address')} placeholder="Rua, nº - Cidade" />
        </div>
      </div>

      <h3>Empilhadeira</h3>
      <div className="compact-fields">
        <div className="form-row">
          <TextField label="Equipamento" value={equipment.model} onChange={field(setEquipment, 'model')} placeholder="Ex: Empilhadeira a gás" />
          <TextField label="Capacidade" value={equipment.capacity} onChange={field(setEquipment, 'capacity')} placeholder="Ex: 2,5 t" />
        </div>
        <div className="form-group">
          <label>Operador</label>
          <select value={equipment.operator} onChange={(e) => field(setEquipment, 'operator')(e.target.value)}>
            {OPERATOR_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>

      </section>

      <section className="tq-col">
      <p className="tq-step"><span>2</span> Locação</p>
      <div className="freight-quote-box">
        <h3>Locação</h3>
        <div className="filter-chips" role="group" aria-label="Modalidade de contratação">
          {FORKLIFT_RENTAL_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              className={rental.mode === mode.value ? 'filter-chip active' : 'filter-chip'}
              aria-pressed={rental.mode === mode.value}
              onClick={() => setRental((prev) => ({ ...prev, mode: mode.value }))}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="form-row">
          {!isPeriod && (
            <TextField
              label={`Quantidade (${modeInfo.unitPlural})`}
              type="number"
              inputMode="decimal"
              value={rental.quantity}
              onChange={field(setRental, 'quantity')}
            />
          )}
          <TextField
            label={isPeriod ? 'Valor do contrato (R$)' : `Valor por ${modeInfo.unit} (R$)`}
            type="number"
            inputMode="decimal"
            value={rental.unitValue}
            onChange={field(setRental, 'unitValue')}
            placeholder="Digite o valor"
          />
        </div>
        <div className="form-row">
          <TextField label="Início" type="date" value={rental.startDate} onChange={field(setRental, 'startDate')} />
          <TextField label={isPeriod ? 'Término' : 'Término (opcional)'} type="date" value={rental.endDate} onChange={field(setRental, 'endDate')} />
        </div>
        <TextField label="Local de uso" value={rental.workAddress} onChange={field(setRental, 'workAddress')} placeholder="Endereço onde a empilhadeira vai trabalhar" />

        <h3>Paletes</h3>
        <div className="form-row">
          <TextField label="Quantidade de paletes" type="number" inputMode="numeric" value={pallets.count} onChange={field(setPallets, 'count')} placeholder="Ex: 40" />
          <TextField label="Valor por palete (opcional)" type="number" inputMode="decimal" value={pallets.pricePerPallet} onChange={field(setPallets, 'pricePerPallet')} placeholder="R$" />
        </div>
        <p className="hint">Sem valor por palete, a quantidade sai no orçamento só como informação.</p>

        <h3>Transporte</h3>
        <label className="checkbox-row">
          <input type="checkbox" checked={transport.included} onChange={(e) => setTransport((prev) => ({ ...prev, included: e.target.checked }))} />
          Guincho leva e busca a empilhadeira
        </label>
        {transport.included && (
          <TextField
            label="Valor do transporte, ida e volta (R$)"
            type="number"
            inputMode="decimal"
            value={transport.value}
            onChange={field(setTransport, 'value')}
            placeholder="Digite o valor"
          />
        )}
      </div>

      </section>

      <section className="tq-col tq-col-sticky">
      <p className="tq-step"><span>3</span> Valores e fechamento</p>
      <div className="freight-quote-box">
        <h3>Valores</h3>
        <div className="quote-price-lines">
          <div>
            <span>
              {isPeriod
                ? `Contrato por período${periodText ? ` (${periodText})` : ''}`
                : price.complete
                  ? `Locação: ${describeQuantity(rental.mode, price.quantity)} × ${formatCurrency(unitValue ?? 0)}`
                  : `Locação (${modeInfo.label.toLowerCase()})`}
            </span>
            <span>{price.complete ? formatCurrency(price.rentalValue) : '—'}</span>
          </div>
          {price.palletsValue > 0 && (
            <div>
              <span>Paletes: {palletCount?.toLocaleString('pt-BR')} × {formatCurrency(pricePerPallet ?? 0)}</span>
              <span>{formatCurrency(price.palletsValue)}</span>
            </div>
          )}
          {transport.included && (
            <div>
              <span>Transporte (ida e volta)</span>
              <span>{price.transportValue > 0 ? formatCurrency(price.transportValue) : 'a consultar'}</span>
            </div>
          )}
          {!price.complete && (
            <div className="hint">
              <span>{isPeriod ? 'Informe o valor do contrato.' : `Informe a quantidade e o valor por ${modeInfo.unit}.`}</span>
            </div>
          )}
        </div>
        <div className="cost-summary-total quote-total">
          <small>Total do orçamento</small>
          <strong>{formatCurrency(price.total)}</strong>
        </div>

        <PaymentFields
          methods={paymentMethods}
          deadline={paymentDeadline}
          onMethodsChange={setPaymentMethods}
          onDeadlineChange={setPaymentDeadline}
        />
      </div>

      <InvoiceFields invoice={invoice} onChange={setInvoice} />

      <div className="form-group" style={{ marginTop: 14 }}>
        <label>Observações</label>
        <textarea
          rows={3}
          placeholder="Ex: horário de trabalho, combustível por conta do cliente, tipo de carga."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button type="button" className="btn-primary btn-generate-pdf" onClick={handleGeneratePdf} disabled={generatingPdf}>
        {generatingPdf ? 'Gerando PDF...' : '📄 Gerar orçamento em PDF'}
      </button>
      {savedQuote?.hasPdf && (
        <button type="button" className="btn-secondary btn-generate-pdf" onClick={downloadSavedPdf}>
          📥 Baixar PDF salvo
        </button>
      )}
      <button type="button" id="aprovar" className="btn-approve" onClick={handleApprove} disabled={approving || loadingQuote}>
        {approving
          ? 'Abrindo OS...'
          : isApproved && savedQuote?.serviceOrderId
            ? `Ver OS ${savedQuote.serviceOrderNumber ?? ''}`.trim()
            : '✅ Aprovado — abrir OS de guincho'}
      </button>
      {savedQuote?.status === 'Pendente' && (
        <button type="button" className="btn-secondary btn-reject-quote" onClick={rejectQuote} disabled={rejecting}>
          {rejecting ? 'Salvando...' : '✖ Cliente recusou'}
        </button>
      )}
      <p className="hint" style={{ textAlign: 'center' }}>
        Quando o cliente aprovar, abra a OS: os dados deste orçamento já vão preenchidos.
      </p>
      </section>
      </div>
    </div>
  );
};

export default ForkliftQuoteEditor;
