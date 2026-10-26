import type { InvoiceData } from './quoteForm';
import { TOW_COMPANY } from './company';
import { createPdf, formatCurrency, formatDate, loadImage, type PdfWriter } from './pdfKit';
import type { TowPrice } from './towPricing';

export { formatCurrency, shareOrDownloadPdf } from './pdfKit';

export interface QuoteRouteStep {
  label: string;
  place: string;
}

export interface QuotePdfData {
  number: string;
  date: Date;
  validityDays: number;
  consultant: string;
  customer: { name: string; document: string; phone: string; address: string };
  vehicle: { plate: string; brand: string; model: string; year: string };
  service: {
    towType: string;
    towUnit: string;
    serviceDate: string;
    pickupLocation: string;
    deliveryDestination: string;
  };
  assistance: {
    protocol: string;
    insuranceCompany: string;
    assistanceCompany: string;
    claimNumber: string;
    requesterName: string;
    requesterPhone: string;
  };
  route: {
    steps: QuoteRouteStep[];
    axleLabel: string;
    totalKm: number | null;
  };
  pricing: {
    departureValue: number;
    radiusKm: number;
    pricePerKm: number | null;
    result: TowPrice;
  };
  paymentTerms: string;
  invoice: InvoiceData;
  description: string;
  notes: string;
}

// Tomador da nota fiscal (associação/seguradora/empresa que paga o serviço).
export function invoiceSection(pdf: PdfWriter, invoice: InvoiceData) {
  pdf.section('Dados para emissão da nota fiscal', [
    ['Nome / Razão social', invoice.name],
    ['CNPJ / CPF', invoice.document],
    ['Endereço', invoice.address],
    ['Município / UF', [invoice.city.trim(), invoice.state].filter(Boolean).join(' - ')],
    ['CEP', invoice.zipCode],
    ['Inscrição estadual', invoice.stateRegistration],
    ['Inscrição municipal', invoice.cityRegistration],
    ['E-mail', invoice.email],
    ['Telefone', invoice.phone],
  ], 3);
}

const km = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;

export async function buildQuotePdf(data: QuotePdfData): Promise<{ blob: Blob; fileName: string }> {
  // Orçamento de guincho é emitido pela empresa do guincho, não pela oficina.
  const pdf = await createPdf(TOW_COMPANY);
  const logo = await loadImage(pdf.company.logoUrl, 500, 'png');
  const { pricing, route } = data;

  pdf.header('ORÇAMENTO', [
    ['Nº', data.number],
    ['Data', formatDate(data.date)],
    ['Validade', `${data.validityDays} dias`],
    ['Consultor', data.consultant || '-'],
    ...(data.assistance.protocol ? [['Protocolo', data.assistance.protocol] as [string, string]] : []),
  ], logo);

  pdf.section('Cliente', [
    ['Nome', data.customer.name],
    ['CPF/CNPJ', data.customer.document],
    ['Telefone', data.customer.phone],
    ['Endereço', data.customer.address],
  ], 3);

  pdf.section('Veículo', [
    ['Placa', data.vehicle.plate],
    ['Marca', data.vehicle.brand],
    ['Modelo', data.vehicle.model],
    ['Ano', data.vehicle.year],
  ], 4);

  pdf.section('Serviço de guincho', [
    ['Tipo de guincho', data.service.towType],
    ['Viatura', data.service.towUnit],
    ['Data do serviço', data.service.serviceDate ? formatDate(`${data.service.serviceDate}T12:00:00`) : ''],
    ['Local de retirada', data.service.pickupLocation],
    ['Local de entrega', data.service.deliveryDestination],
  ], 3);

  pdf.section('Assistência / seguradora', [
    ['Seguradora', data.assistance.insuranceCompany],
    ['Assistência', data.assistance.assistanceCompany],
    ['Sinistro', data.assistance.claimNumber],
    ['Protocolo / OS da assistência', data.assistance.protocol],
    ['Solicitante', data.assistance.requesterName],
    ['Telefone do solicitante', data.assistance.requesterPhone],
  ], 3);

  if (route.steps.length > 0) {
    pdf.sectionTitle(`Rota · ${route.axleLabel}${route.totalKm !== null ? ` · KM total: ${km(route.totalKm)}` : ''}`);
    pdf.table(
      ['#', 'Etapa', 'Local'],
      route.steps.map((step, i) => [String(i + 1), step.label, step.place]),
      [12, 50],
      ['center', 'left', 'left'],
    );
  }

  pdf.sectionTitle('Valores');
  const rows = [[`Saída do caminhão (até ${pricing.radiusKm} km)`, formatCurrency(pricing.departureValue)]];
  if (pricing.result.complete && pricing.pricePerKm) {
    rows.push([
      `Km excedente: ${km(pricing.result.excessKm)} x ${formatCurrency(pricing.pricePerKm)}`,
      formatCurrency(pricing.result.excessValue),
    ]);
  } else if (pricing.pricePerKm) {
    rows.push([`Km excedente (acima de ${pricing.radiusKm} km)`, `${formatCurrency(pricing.pricePerKm)}/km - a consultar`]);
  }
  if (pricing.result.tollsValue > 0) {
    rows.push(['Pedágios (inclui 5% de reserva para reajustes)', formatCurrency(pricing.result.tollsValue)]);
  }
  pdf.table(['Descrição', 'Valor'], rows, [120], ['left', 'right'], ['Total do orçamento', formatCurrency(pricing.result.total)]);

  pdf.section('Pagamento', [['Condição de pagamento', data.paymentTerms]], 1);

  const observations = [data.description, data.notes].map((text) => text.trim()).filter(Boolean).join('\n\n');
  if (observations) {
    pdf.sectionTitle('Observações');
    pdf.textCard(observations);
  }

  invoiceSection(pdf, data.invoice);

  pdf.signatures();
  pdf.footer();
  pdf.pageNumbers(data.number);

  return { blob: pdf.doc.output('blob'), fileName: `Orcamento-${data.number}.pdf` };
}
