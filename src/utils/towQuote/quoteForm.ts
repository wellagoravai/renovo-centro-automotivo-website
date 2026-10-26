// Constantes e funções comuns aos formulários de orçamento (guincho e empilhadeira).

// Estados brasileiros — lista fixa; as cidades vêm do IBGE sob demanda
// (mesmo comportamento da cotação de frete do site).
export const UF_LIST: { sigla: string; nome: string }[] = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' },
];

export const today = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// "2026-10-14" -> "14/10/2026"
export const formatIsoDate = (iso: string) => iso.split('-').reverse().join('/');

export const toNumber = (value: string) => (value.trim() === '' ? null : Number(value.replace(',', '.')));

export const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

// Formas de pagamento aceitas; o prazo (quando houver) é digitado à parte.
export const PAYMENT_METHODS = ['PIX', 'Cartões', 'Depósito bancário'];

// "PIX, Cartões ou Depósito bancário" + " · Prazo: ..." quando informado.
export const describePayment = (methods: string[], deadline: string) => {
  const list = methods.length > 1 ? `${methods.slice(0, -1).join(', ')} ou ${methods[methods.length - 1]}` : methods.join('');
  return [list, deadline.trim() && `Prazo: ${deadline.trim()}`].filter(Boolean).join(' · ');
};

// Tomador da nota fiscal (associação/seguradora/empresa que paga o serviço).
export interface InvoiceData {
  name: string;
  document: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  stateRegistration: string;
  cityRegistration: string;
  email: string;
  phone: string;
}

export const EMPTY_INVOICE: InvoiceData = {
  name: '',
  document: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  stateRegistration: '',
  cityRegistration: '',
  email: '',
  phone: '',
};

// Linhas "Rótulo: valor" dos campos preenchidos, para as observações da OS.
export const invoiceLines = (invoice: InvoiceData) => [
  invoice.name && `Nome/Razão social: ${invoice.name}`,
  invoice.document && `CNPJ/CPF: ${invoice.document}`,
  invoice.address && `Endereço: ${invoice.address}`,
  (invoice.city || invoice.state) && `Município/UF: ${[invoice.city, invoice.state].filter(Boolean).join(' - ')}`,
  invoice.zipCode && `CEP: ${invoice.zipCode}`,
  invoice.stateRegistration && `Insc. estadual: ${invoice.stateRegistration}`,
  invoice.cityRegistration && `Insc. municipal: ${invoice.cityRegistration}`,
  invoice.email && `E-mail: ${invoice.email}`,
  invoice.phone && `Telefone: ${invoice.phone}`,
].filter(Boolean) as string[];
