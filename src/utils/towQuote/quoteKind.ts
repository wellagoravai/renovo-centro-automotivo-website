import type { TowQuote } from './types';

// Orçamentos de guincho e de empilhadeira dividem o mesmo histórico (/tow-quotes).
// O formulário salvo diz o tipo (formData.kind), mas a listagem não traz o
// formulário: por isso o de empilhadeira também grava a descrição começando por
// FORKLIFT_LABEL, que é o que a listagem usa para separar.
export const FORKLIFT_KIND = 'empilhadeira';
export const FORKLIFT_LABEL = 'Empilhadeira';
export const TOW_QUOTES_PATH = '/orcamentos-guincho';
export const FORKLIFT_QUOTES_PATH = '/orcamentos-empilhadeira';

export const isForkliftQuote = (quote: Pick<TowQuote, 'vehicleDescription'>) =>
  (quote.vehicleDescription || '').startsWith(FORKLIFT_LABEL);

export const quotePath = (quote: Pick<TowQuote, 'id' | 'vehicleDescription'>) =>
  `${isForkliftQuote(quote) ? FORKLIFT_QUOTES_PATH : TOW_QUOTES_PATH}/${quote.id}`;
