// Dados da empresa impressos nos documentos. A oficina e o guincho são empresas
// separadas (CNPJs diferentes): pedidos e OS de oficina saem com COMPANY;
// orçamentos (guincho e empilhadeira) e OS de guincho saem com TOW_COMPANY.
export interface CompanyInfo {
  name: string;
  // Razão social, impressa abaixo do nome fantasia quando preenchida.
  legalName?: string;
  // Enquanto vazio, não aparece nos documentos.
  cnpj: string;
  address: string;
  phone: string;
  whatsapp: string[];
  email: string;
  website: string;
  logoUrl: string;
}

export const COMPANY: CompanyInfo = {
  name: 'Renovo Centro Automotivo',
  // Preencher com o CNPJ da oficina — enquanto vazio, não aparece nos documentos.
  cnpj: '',
  address: 'Rua Marechal Deodoro, 2305 - Andradina/SP, 16901-455',
  phone: '(18) 3722-2388',
  whatsapp: ['(18) 3722-2388', '(18) 99775-2055', '(18) 99824-2750'],
  email: 'jsbombasinjetoras@gmail.com',
  website: 'www.renovocentroautomotivo.com.br',
  logoUrl: '/assets/logo.png',
};

// Cartão CNPJ de 20/08/2026. Telefone e e-mail do cartão ainda são provisórios,
// por isso os contatos continuam os da Renovo até o guincho ter os próprios.
export const TOW_COMPANY: CompanyInfo = {
  name: 'Renovo Guincho',
  legalName: 'Marcio Fabricio Silva de Araujo Guinchos Ltda',
  cnpj: '68.699.853/0001-05',
  address: 'Rua Marechal Deodoro, 2305 - Centro - Andradina/SP, 16901-011',
  phone: COMPANY.phone,
  whatsapp: COMPANY.whatsapp,
  email: COMPANY.email,
  website: COMPANY.website,
  logoUrl: COMPANY.logoUrl,
};
