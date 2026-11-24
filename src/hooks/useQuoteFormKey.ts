import { useRef } from 'react';

// As rotas /novo e /:id usam o mesmo componente, e o React reaproveita o formulário ao
// navegar entre elas: "Orçamento novo" no menu abriria com os dados (e o registro) do
// orçamento anterior. A key muda ao sair de um orçamento salvo, mas não quando o novo
// acabou de ser salvo (/novo -> /:id), para não perder o que está em andamento.
export function useQuoteFormKey(quoteId: string | undefined): number {
  const key = useRef(0);
  const previousId = useRef(quoteId);
  if (previousId.current !== quoteId) {
    if (previousId.current) key.current += 1;
    previousId.current = quoteId;
  }
  return key.current;
}
