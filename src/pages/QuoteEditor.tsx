import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { QuoteSummary, formatCurrency } from './Quotes';
import '../styles/Quotes.css';

interface QuoteItem {
  id: string;
  inventoryItemId?: string | null;
  code: string;
  description: string;
  quantity: number;
  unitValue: number;
}

interface QuotePhoto {
  id: string;
  url: string;
  uploadedAt: string;
  includeInQuote: boolean;
}

interface QuoteDetail extends QuoteSummary {
  problemReported: string;
  diagnosis: string;
  services: string;
  customerDocument: string;
  vehicleYear: number;
  vehicleMileage: number;
  stockDeducted: boolean;
  vehiclePhotoId?: string | null;
  items: QuoteItem[];
  photos: QuotePhoto[];
}

interface InventoryOption {
  id: string;
  code: string;
  description: string;
  quantity: number;
  saleValue: number;
}

// Linha editável: `key` é local (itens novos ainda não têm id no servidor).
interface EditItem {
  key: string;
  id?: string;
  inventoryItemId?: string | null;
  code: string;
  description: string;
  quantity: string;
  unitValue: string;
}

type DiscountMode = 'valor' | 'percentual';

const toNumber = (value: string) => {
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};
const toInput = (value: number) => (value ? String(value).replace('.', ',') : '');
const round2 = (value: number) => Math.round(value * 100) / 100;
let localKey = 0;
const nextKey = () => `new-${++localKey}`;

const QuoteEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('orders.write');

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [diagnosis, setDiagnosis] = useState('');
  const [services, setServices] = useState('');
  const [laborValue, setLaborValue] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountMode, setDiscountMode] = useState<DiscountMode>('valor');
  const [items, setItems] = useState<EditItem[]>([]);
  const [vehiclePhotoId, setVehiclePhotoId] = useState<string | null>(null);
  const [partPhotoIds, setPartPhotoIds] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  const [busy, setBusy] = useState<'' | 'save' | 'pdf' | 'send' | 'upload'>('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyQuote = (data: QuoteDetail) => {
    setQuote(data);
    setDiagnosis(data.diagnosis || '');
    setServices(data.services || '');
    setLaborValue(toInput(data.laborValue));
    setDiscount(toInput(data.discount));
    setDiscountMode('valor');
    setItems(data.items.map(i => ({
      key: i.id,
      id: i.id,
      inventoryItemId: i.inventoryItemId,
      code: i.code,
      description: i.description,
      quantity: String(i.quantity),
      unitValue: toInput(i.unitValue),
    })));
    setVehiclePhotoId(data.vehiclePhotoId ?? null);
    setPartPhotoIds(data.photos.filter(p => p.includeInQuote).map(p => p.id));
    setDirty(false);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/quotes/${id}`);
        if (!response.ok) throw new Error();
        applyQuote(await response.json());
      } catch {
        setError('Não foi possível carregar o orçamento desta OS.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Busca no estoque com um pequeno atraso para não disparar a cada tecla.
  useEffect(() => {
    const term = inventorySearch.trim();
    if (term.length < 2) {
      setInventoryOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await api.get(`/inventory?search=${encodeURIComponent(term)}`);
        if (response.ok) setInventoryOptions((await response.json()).slice(0, 8));
      } catch {
        setInventoryOptions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inventorySearch]);

  const touch = () => {
    setDirty(true);
    setNotice(null);
  };

  const partsTotal = round2(items.reduce((sum, i) => sum + toNumber(i.quantity) * toNumber(i.unitValue), 0));
  const labor = toNumber(laborValue);
  const subtotal = round2(partsTotal + labor);
  const discountValue = round2(discountMode === 'percentual' ? (subtotal * toNumber(discount)) / 100 : toNumber(discount));
  const total = Math.max(0, round2(subtotal - discountValue));
  const itemsLocked = !!quote?.stockDeducted;

  const updateItem = (key: string, changes: Partial<EditItem>) => {
    setItems(prev => prev.map(i => (i.key === key ? { ...i, ...changes } : i)));
    touch();
  };

  const addInventoryItem = (option: InventoryOption) => {
    const existing = items.find(i => i.inventoryItemId === option.id);
    if (existing) {
      updateItem(existing.key, { quantity: String(toNumber(existing.quantity) + 1) });
    } else {
      setItems(prev => [...prev, {
        key: nextKey(),
        inventoryItemId: option.id,
        code: option.code,
        description: option.description,
        quantity: '1',
        unitValue: toInput(option.saleValue),
      }]);
      touch();
    }
    setInventorySearch('');
    setInventoryOptions([]);
  };

  const addLooseItem = () => {
    setItems(prev => [...prev, { key: nextKey(), inventoryItemId: null, code: '', description: '', quantity: '1', unitValue: '' }]);
    touch();
  };

  const removeItem = (key: string) => {
    setItems(prev => prev.filter(i => i.key !== key));
    touch();
  };

  const toggleVehiclePhoto = (photoId: string) => {
    setVehiclePhotoId(prev => (prev === photoId ? null : photoId));
    setPartPhotoIds(prev => prev.filter(p => p !== photoId));
    touch();
  };

  const togglePartPhoto = (photoId: string) => {
    setPartPhotoIds(prev => (prev.includes(photoId) ? prev.filter(p => p !== photoId) : [...prev, photoId]));
    if (vehiclePhotoId === photoId) setVehiclePhotoId(null);
    touch();
  };

  const validate = (): string | null => {
    for (const item of items) {
      if (!item.inventoryItemId && !item.description.trim()) return 'Informe a descrição de todas as peças avulsas.';
      if (toNumber(item.quantity) <= 0 || !Number.isInteger(toNumber(item.quantity))) return `Quantidade inválida em "${item.description || 'peça'}".`;
      if (toNumber(item.unitValue) < 0) return `Valor inválido em "${item.description || 'peça'}".`;
    }
    if (labor < 0) return 'Mão de obra não pode ser negativa.';
    if (discountValue < 0) return 'Desconto não pode ser negativo.';
    if (discountValue > subtotal) return 'Desconto maior que o valor do orçamento.';
    return null;
  };

  // Salva e devolve true se deu certo — PDF e envio sempre salvam antes, para o
  // cliente nunca receber uma versão diferente da que está na tela.
  const save = async (): Promise<boolean> => {
    if (!quote) return false;
    if (!dirty) return true;
    const validation = validate();
    if (validation) {
      setNotice({ type: 'error', text: validation });
      return false;
    }
    setBusy('save');
    try {
      const response = await api.put(`/quotes/${quote.id}`, {
        diagnosis,
        services,
        laborValue: labor,
        discount: discountValue,
        vehiclePhotoId,
        partPhotoIds,
        items: itemsLocked ? null : items.map(i => ({
          id: i.id ?? null,
          inventoryItemId: i.inventoryItemId ?? null,
          description: i.description,
          quantity: toNumber(i.quantity),
          unitValue: toNumber(i.unitValue),
        })),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message);
      applyQuote(body);
      return true;
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error && err.message ? err.message : 'Não foi possível salvar o orçamento.' });
      return false;
    } finally {
      setBusy('');
    }
  };

  const handleSave = async () => {
    if (await save()) setNotice({ type: 'success', text: 'Orçamento salvo.' });
  };

  const handlePrint = async () => {
    if (!quote) return;
    // Abre a aba já no clique: navegadores bloqueiam window.open feito depois de um await.
    const printWindow = window.open('', '_blank');
    if (!(await save())) {
      printWindow?.close();
      return;
    }
    setBusy('pdf');
    try {
      const response = await api.get(`/quotes/${quote.id}/pdf`);
      if (!response.ok) throw new Error();
      const url = window.URL.createObjectURL(await response.blob());
      if (printWindow) {
        printWindow.location.href = url;
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `Orcamento-${quote.number}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch {
      printWindow?.close();
      setNotice({ type: 'error', text: 'Não foi possível gerar o PDF do orçamento.' });
    } finally {
      setBusy('');
    }
  };

  const handleSend = async () => {
    if (!quote) return;
    if (!quote.customerWhatsApp) {
      setNotice({ type: 'error', text: 'Cliente sem WhatsApp cadastrado. Cadastre o número na tela de Clientes ou use "Imprimir PDF".' });
      return;
    }
    if (total <= 0 && items.length === 0) {
      setNotice({ type: 'error', text: 'Lance as peças ou a mão de obra antes de enviar.' });
      return;
    }
    const again = quote.quoteSentAt ? ' novamente' : '';
    if (!window.confirm(`Enviar${again} o orçamento de ${formatCurrency(total)} para o WhatsApp ${quote.customerWhatsApp} (${quote.customerName})?`)) return;
    if (!(await save())) return;

    setBusy('send');
    try {
      const response = await api.post(`/quotes/${quote.id}/send`, {});
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message);
      setQuote(prev => (prev ? { ...prev, status: body.status, quoteSentAt: body.quoteSentAt } : prev));
      setNotice({ type: 'success', text: `✅ Orçamento enviado para ${body.phone}. O cliente pode responder SIM ou NÃO pelo WhatsApp.` });
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error && err.message ? err.message : 'Não foi possível enviar o orçamento.' });
    } finally {
      setBusy('');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !quote) return;
    setBusy('upload');
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/service-orders/${quote.id}/photos`, formData);
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message);
        setQuote(prev => (prev ? { ...prev, photos: [{ ...body, includeInQuote: false }, ...prev.photos] } : prev));
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error && err.message ? err.message : 'Erro ao enviar foto.' });
    } finally {
      setBusy('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <div className="quotes-page"><div className="loading">Carregando...</div></div>;
  if (error || !quote) return <div className="quotes-page"><div className="qt-error">{error || 'Orçamento não encontrado.'}</div></div>;

  const readOnly = !canWrite;

  return (
    <div className="quotes-page quote-editor">
      <div className="page-header">
        <div>
          <h1>💰 Orçamento — OS {quote.number}</h1>
          <p className="qt-subtitle">
            <span className="qt-status">{quote.status}</span>
            {quote.quoteSentAt && <span className="qt-badge sent">Enviado em {new Date(quote.quoteSentAt).toLocaleString('pt-BR')}</span>}
            {dirty && <span className="qt-badge pending">Alterações não salvas</span>}
          </p>
        </div>
        <div className="qt-header-actions">
          <Link className="btn btn-secondary" to={`/service-orders/${quote.id}`}>Ver OS</Link>
          <button className="btn btn-secondary" onClick={() => navigate('/orcamentos')}>← Voltar</button>
        </div>
      </div>

      {notice && <div className={notice.type === 'error' ? 'qt-error' : 'qt-success'} role="status">{notice.text}</div>}

      <div className="qt-cards">
        <section className="qt-card">
          <h3>Cliente</h3>
          <strong>{quote.customerName}</strong>
          {quote.customerDocument && <span>CPF/CNPJ: {quote.customerDocument}</span>}
          <span>WhatsApp: {quote.customerWhatsApp || <em className="qt-warn">não cadastrado</em>}</span>
        </section>
        <section className="qt-card">
          <h3>Veículo</h3>
          <strong>{quote.vehicleDescription || '—'}</strong>
          <span>Placa: {quote.vehiclePlate}{quote.vehicleYear ? ` · Ano ${quote.vehicleYear}` : ''}</span>
          {quote.vehicleMileage > 0 && <span>KM: {quote.vehicleMileage.toLocaleString('pt-BR')}</span>}
        </section>
        {quote.problemReported && (
          <section className="qt-card">
            <h3>Problema relatado</h3>
            <span>{quote.problemReported}</span>
          </section>
        )}
      </div>

      <section className="qt-section">
        <h2>Diagnóstico e serviços</h2>
        <label className="qt-field">
          Diagnóstico
          <textarea className="form-control" rows={3} value={diagnosis} disabled={readOnly}
            onChange={e => { setDiagnosis(e.target.value); touch(); }} placeholder="O que foi constatado no veículo" />
        </label>
        <label className="qt-field">
          Serviços a executar
          <textarea className="form-control" rows={2} value={services} disabled={readOnly}
            onChange={e => { setServices(e.target.value); touch(); }} placeholder="Ex.: troca de pastilhas e discos dianteiros" />
        </label>
      </section>

      <section className="qt-section">
        <h2>Peças a trocar</h2>
        {itemsLocked && <p className="qt-hint">As peças desta OS já foram baixadas do estoque e não podem ser alteradas.</p>}
        <div className="qt-items">
          {items.length > 0 && (
            <div className="qt-item qt-item-head" aria-hidden="true">
              <span>Peça</span><span>Qtd</span><span>Valor unit. (R$)</span><span className="qt-num">Total</span><span />
            </div>
          )}
          {items.map(item => (
            <div className="qt-item" key={item.key}>
              <div className="qt-item-desc">
                {item.inventoryItemId ? (
                  <>
                    <strong>{item.description}</strong>
                    <small>{item.code ? `Estoque · ${item.code}` : 'Estoque'}</small>
                  </>
                ) : (
                  <>
                    <input className="form-control" value={item.description} disabled={readOnly || itemsLocked} aria-label="Descrição da peça"
                      onChange={e => updateItem(item.key, { description: e.target.value })} placeholder="Descrição da peça" />
                    <small>Peça avulsa (fora do estoque)</small>
                  </>
                )}
              </div>
              <input className="form-control" inputMode="numeric" value={item.quantity} disabled={readOnly || itemsLocked} aria-label="Quantidade"
                onChange={e => updateItem(item.key, { quantity: e.target.value.replace(/\D/g, '') })} />
              <input className="form-control" inputMode="decimal" value={item.unitValue} disabled={readOnly || itemsLocked} aria-label="Valor unitário"
                onChange={e => updateItem(item.key, { unitValue: e.target.value })} placeholder="0,00" />
              <span className="qt-num">{formatCurrency(toNumber(item.quantity) * toNumber(item.unitValue))}</span>
              {!readOnly && !itemsLocked ? (
                <button className="qt-remove" onClick={() => removeItem(item.key)} aria-label={`Remover ${item.description || 'peça'}`}>×</button>
              ) : <span />}
            </div>
          ))}
          {items.length === 0 && <p className="qt-hint">Nenhuma peça lançada.</p>}
        </div>

        {!readOnly && !itemsLocked && (
          <div className="qt-add-item">
            <div className="qt-inventory-search">
              <input className="form-control" value={inventorySearch} onChange={e => setInventorySearch(e.target.value)}
                placeholder="🔍 Buscar peça no estoque (código ou descrição)" />
              {inventoryOptions.length > 0 && (
                <ul className="qt-inventory-options">
                  {inventoryOptions.map(option => (
                    <li key={option.id}>
                      <button type="button" onClick={() => addInventoryItem(option)}>
                        <span><strong>{option.description}</strong> <small>{option.code} · {option.quantity} em estoque</small></span>
                        <span>{formatCurrency(option.saleValue)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button className="btn btn-secondary" onClick={addLooseItem}>+ Peça avulsa</button>
          </div>
        )}
      </section>

      <section className="qt-section">
        <h2>Fotos no orçamento</h2>
        <p className="qt-hint">Escolha 1 foto do veículo (de preferência a que mostra a placa) e as fotos das peças a serem trocadas. Elas vão no PDF enviado ao cliente.</p>
        <div className="qt-photos">
          {quote.photos.map(photo => {
            const isVehicle = vehiclePhotoId === photo.id;
            const isPart = partPhotoIds.includes(photo.id);
            return (
              <figure key={photo.id} className={`qt-photo ${isVehicle ? 'is-vehicle' : ''} ${isPart ? 'is-part' : ''}`}>
                <a href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt="Foto da OS" loading="lazy" /></a>
                <figcaption>
                  <button type="button" className={isVehicle ? 'active' : ''} aria-pressed={isVehicle} disabled={readOnly}
                    onClick={() => toggleVehiclePhoto(photo.id)}>🚗 Veículo</button>
                  <button type="button" className={isPart ? 'active part' : ''} aria-pressed={isPart} disabled={readOnly}
                    onClick={() => togglePartPhoto(photo.id)}>🔧 Peça</button>
                </figcaption>
              </figure>
            );
          })}
          {!readOnly && (
            <label className="qt-photo qt-photo-upload">
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple onChange={handlePhotoUpload} disabled={busy === 'upload'} />
              <span>{busy === 'upload' ? 'Enviando...' : '📷 Tirar / enviar foto'}</span>
            </label>
          )}
        </div>
      </section>

      <section className="qt-section qt-totals-section">
        <h2>Valores</h2>
        <div className="qt-values">
          <label className="qt-field">
            Mão de obra (R$)
            <input className="form-control" inputMode="decimal" value={laborValue} disabled={readOnly}
              onChange={e => { setLaborValue(e.target.value); touch(); }} placeholder="0,00" />
          </label>
          <div className="qt-field">
            <span>Desconto</span>
            <div className="qt-discount-input">
              <input className="form-control" inputMode="decimal" value={discount} disabled={readOnly} aria-label="Desconto"
                onChange={e => { setDiscount(e.target.value); touch(); }} placeholder="0" />
              <div className="qt-segmented" role="group" aria-label="Tipo de desconto">
                <button type="button" className={discountMode === 'valor' ? 'active' : ''} disabled={readOnly}
                  onClick={() => { setDiscountMode('valor'); touch(); }}>R$</button>
                <button type="button" className={discountMode === 'percentual' ? 'active' : ''} disabled={readOnly}
                  onClick={() => { setDiscountMode('percentual'); touch(); }}>%</button>
              </div>
            </div>
          </div>
        </div>
        <dl className="qt-summary">
          <div><dt>Peças</dt><dd>{formatCurrency(partsTotal)}</dd></div>
          <div><dt>Mão de obra</dt><dd>{formatCurrency(labor)}</dd></div>
          {discountValue > 0 && <div className="qt-summary-discount"><dt>Desconto</dt><dd>− {formatCurrency(discountValue)}</dd></div>}
          <div className="qt-summary-total"><dt>Total</dt><dd>{formatCurrency(total)}</dd></div>
        </dl>
      </section>

      <div className="qt-actions">
        {canWrite && (
          <button className="btn btn-secondary" onClick={handleSave} disabled={!!busy || !dirty}>
            {busy === 'save' ? 'Salvando...' : 'Salvar'}
          </button>
        )}
        <button className="btn btn-secondary" onClick={handlePrint} disabled={!!busy}>
          {busy === 'pdf' ? 'Gerando...' : '🖨️ Imprimir PDF'}
        </button>
        {canWrite && (
          <button className="btn btn-success" onClick={handleSend} disabled={!!busy}>
            {busy === 'send' ? 'Enviando...' : '📲 Enviar para o cliente'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuoteEditor;
