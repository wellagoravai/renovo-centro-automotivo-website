import type { InvoiceData } from './quoteForm';
import { TOW_COMPANY } from './company';
import { describeQuantity, rentalModeInfo, type ForkliftPrice, type ForkliftRentalMode } from './forkliftPricing';
import { createPdf, formatCurrency, formatDate, loadImage } from './pdfKit';
import { invoiceSection } from './quotePdf';

export interface ForkliftQuotePdfData {
  number: string;
  date: Date;
  validityDays: number;
  consultant: string;
  customer: { name: string; document: string; phone: string; address: string };
  equipment: { model: string; capacity: string; operator: string };
  rental: {
    mode: ForkliftRentalMode;
    unitValue: number | null;
    startDate: string;
    endDate: string;
    workAddress: string;
  };
  pallets: { count: number | null; pricePerPallet: number | null };
  transport: { included: boolean; description: string };
  price: ForkliftPrice;
  paymentTerms: string;
  invoice: InvoiceData;
  notes: string;
}

const isoDate = (value: string) => (value ? formatDate(`${value}T12:00:00`) : '');

// Orçamento de locação de empilhadeira, emitido pela empresa do guincho (é o
// guincho que leva a empilhadeira até o cliente).
export async function buildForkliftQuotePdf(data: ForkliftQuotePdfData): Promise<{ blob: Blob; fileName: string }> {
  const pdf = await createPdf(TOW_COMPANY);
  const logo = await loadImage(pdf.company.logoUrl, 500, 'png');
  const { rental, price } = data;
  const isPeriod = rental.mode === 'Período';

  pdf.header('ORÇAMENTO', [
    ['Nº', data.number],
    ['Data', formatDate(data.date)],
    ['Validade', `${data.validityDays} dias`],
    ['Consultor', data.consultant || '-'],
  ], logo);

  pdf.section('Cliente', [
    ['Nome', data.customer.name],
    ['CPF/CNPJ', data.customer.document],
    ['Telefone', data.customer.phone],
    ['Endereço', data.customer.address],
  ], 3);

  pdf.section('Equipamento', [
    ['Equipamento', data.equipment.model || 'Empilhadeira'],
    ['Capacidade', data.equipment.capacity],
    ['Operador', data.equipment.operator],
  ], 3);

  pdf.section('Locação', [
    ['Modalidade', rentalModeInfo(rental.mode).label],
    ['Quantidade', !isPeriod && price.quantity > 0 ? describeQuantity(rental.mode, price.quantity) : ''],
    ['Início', isoDate(rental.startDate)],
    ['Término', isoDate(rental.endDate)],
    ['Quantidade de paletes', data.pallets.count ? data.pallets.count.toLocaleString('pt-BR') : ''],
    ['Local de uso', rental.workAddress],
  ], 3);

  pdf.sectionTitle('Valores');
  const rows: string[][] = [];
  if (isPeriod) {
    const period = [isoDate(rental.startDate), isoDate(rental.endDate)].filter(Boolean).join(' a ');
    rows.push([`Contrato por período${period ? ` (${period})` : ''}`, price.complete ? formatCurrency(price.rentalValue) : 'a consultar']);
  } else if (price.complete && rental.unitValue) {
    rows.push([`Locação: ${describeQuantity(rental.mode, price.quantity)} x ${formatCurrency(rental.unitValue)}`, formatCurrency(price.rentalValue)]);
  } else {
    rows.push([`Locação (${rentalModeInfo(rental.mode).label.toLowerCase()})`, 'a consultar']);
  }
  if (price.palletsValue > 0 && data.pallets.count && data.pallets.pricePerPallet) {
    rows.push([
      `Movimentação de paletes: ${data.pallets.count.toLocaleString('pt-BR')} x ${formatCurrency(data.pallets.pricePerPallet)}`,
      formatCurrency(price.palletsValue),
    ]);
  }
  if (data.transport.included) {
    rows.push([data.transport.description, price.transportValue > 0 ? formatCurrency(price.transportValue) : 'a consultar']);
  }
  pdf.table(['Descrição', 'Valor'], rows, [120], ['left', 'right'], ['Total do orçamento', formatCurrency(price.total)]);

  pdf.section('Pagamento', [['Condição de pagamento', data.paymentTerms]], 1);

  if (data.notes.trim()) {
    pdf.sectionTitle('Observações');
    pdf.textCard(data.notes.trim());
  }

  invoiceSection(pdf, data.invoice);

  pdf.signatures();
  pdf.footer();
  pdf.pageNumbers(data.number);

  return { blob: pdf.doc.output('blob'), fileName: `Orcamento-${data.number}.pdf` };
}
