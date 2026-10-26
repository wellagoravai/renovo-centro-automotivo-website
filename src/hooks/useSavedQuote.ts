import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/towQuote/towApi';
import type { TowQuote } from '../utils/towQuote/types';
import { shareOrDownloadPdf } from '../utils/towQuote/pdfKit';
import { errorMessage } from '../utils/towQuote/quoteForm';

// Corpo de POST/PUT /tow-quotes (formData = formulário inteiro serializado pelo app).
export interface SaveQuoteBody {
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleDescription: string;
  routeSummary: string;
  totalKm: number | null;
  total: number;
  formData: string;
}

// Ciclo de vida de um orçamento salvo no histórico (/tow-quotes), comum ao
// orçamento de guincho e ao de empilhadeira: reabrir (/<basePath>/:id), salvar,
// guardar o PDF, recusar e marcar como aprovado ao abrir a OS.
export function useSavedQuote<T>(routeQuoteId: string | undefined, basePath: string, applyFormData: (data: T) => void) {
  const navigate = useNavigate();
  const [savedQuote, setSavedQuote] = useState<TowQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(Boolean(routeQuoteId));
  const [loadError, setLoadError] = useState('');
  const [rejecting, setRejecting] = useState(false);
  // Id que já está no formulário: evita recarregar do servidor quando a própria
  // tela troca /new por /:id depois de salvar.
  const loadedQuoteId = useRef<string | null>(null);
  const applyRef = useRef(applyFormData);
  applyRef.current = applyFormData;

  useEffect(() => {
    if (!routeQuoteId || loadedQuoteId.current === routeQuoteId) return;
    loadedQuoteId.current = routeQuoteId;
    setLoadingQuote(true);
    api.get<TowQuote>(`/tow-quotes/${routeQuoteId}`)
      .then((quote) => {
        setSavedQuote(quote);
        try {
          applyRef.current(JSON.parse(quote.formData || '{}') as T);
        } catch {
          setLoadError('Não foi possível ler os dados salvos deste orçamento.');
        }
      })
      .catch((error) => setLoadError(errorMessage(error, 'Erro ao carregar o orçamento.')))
      .finally(() => setLoadingQuote(false));
  }, [routeQuoteId]);

  const isApproved = savedQuote?.status === 'Aprovado';

  // Cria (1ª vez) ou atualiza o orçamento no histórico. Orçamento aprovado não é
  // mais alterado — o que vale a partir daí é a OS.
  const saveQuote = async (body: SaveQuoteBody): Promise<TowQuote> => {
    if (savedQuote && isApproved) return savedQuote;

    const saved = savedQuote
      ? await api.put<TowQuote>(`/tow-quotes/${savedQuote.id}`, body)
      : await api.post<TowQuote>('/tow-quotes', body);
    setSavedQuote(saved);
    if (!savedQuote) {
      loadedQuoteId.current = saved.id;
      navigate(`${basePath}/${saved.id}`, { replace: true });
    }
    return saved;
  };

  // Guarda o mesmo PDF enviado ao cliente. Devolve o aviso de erro, se houver.
  const storePdf = async (quote: TowQuote, blob: Blob, fileName: string): Promise<string | null> => {
    if (isApproved) return null;
    try {
      const form = new FormData();
      form.append('file', blob, fileName);
      await api.put(`/tow-quotes/${quote.id}/pdf`, form);
      setSavedQuote((prev) => (prev ? { ...prev, hasPdf: true } : prev));
      return null;
    } catch (error) {
      return `O PDF não foi guardado no histórico: ${errorMessage(error, 'erro desconhecido')}`;
    }
  };

  const downloadSavedPdf = async () => {
    if (!savedQuote) return;
    try {
      const blob = await api.getBlob(`/tow-quotes/${savedQuote.id}/pdf`);
      await shareOrDownloadPdf(blob, `Orcamento-${savedQuote.number}.pdf`, `Orçamento ${savedQuote.number}`);
    } catch (error) {
      alert(errorMessage(error, 'Não foi possível baixar o PDF salvo.'));
    }
  };

  const rejectQuote = async () => {
    if (!savedQuote || !window.confirm(`Marcar o orçamento ${savedQuote.number} como recusado pelo cliente?`)) return;
    setRejecting(true);
    try {
      setSavedQuote(await api.post<TowQuote>(`/tow-quotes/${savedQuote.id}/reject`));
    } catch (error) {
      alert(errorMessage(error, 'Não foi possível recusar o orçamento.'));
    } finally {
      setRejecting(false);
    }
  };

  const markApproved = async (quote: TowQuote, serviceOrderId: string, serviceOrderNumber: string) => {
    try {
      setSavedQuote(await api.post<TowQuote>(`/tow-quotes/${quote.id}/approve`, { serviceOrderId }));
    } catch (error) {
      alert(`OS ${serviceOrderNumber} aberta, mas o orçamento não foi marcado como aprovado: ${errorMessage(error, 'erro desconhecido')}`);
    }
  };

  // "Criar OS" da lista abre o orçamento com #aprovar: rola até o botão de
  // aprovar (que abre a OS preenchida) depois que o formulário carrega.
  useEffect(() => {
    if (!loadingQuote && window.location.hash === '#aprovar') {
      document.getElementById('aprovar')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loadingQuote]);

  return {
    savedQuote,
    loadingQuote,
    loadError,
    isApproved,
    rejecting,
    saveQuote,
    storePdf,
    downloadSavedPdf,
    rejectQuote,
    markApproved,
  };
}
