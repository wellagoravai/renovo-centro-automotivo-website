import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AutocompleteField from '../components/towQuote/AutocompleteField';
import PlaceSearchField, { placeLabel, type FoundPlace } from '../components/towQuote/PlaceSearchField';
import { InvoiceFields, PaymentFields, QuoteStatusBanner, TextField } from '../components/towQuote/QuoteFields';
import {
  EMPTY_INVOICE,
  PAYMENT_METHODS,
  UF_LIST,
  describePayment,
  invoiceLines,
  errorMessage,
  toNumber,
  today,
  type InvoiceData,
} from '../utils/towQuote/quoteForm';
import { api } from '../utils/towQuote/towApi';
import { fetchFipeBrands, fetchFipeModels, type FipeOption } from '../utils/towQuote/fipe';
import { useAuth } from '../hooks/useAuth';
import { useSavedQuote } from '../hooks/useSavedQuote';
import type { CreatedServiceOrder, TowQuote } from '../utils/towQuote/types';
import { formatPlate } from '../utils/towQuote/plate';
import { formatCpfCnpj } from '../utils/helpers';
import { FORKLIFT_KIND, FORKLIFT_QUOTES_PATH, TOW_QUOTES_PATH } from '../utils/towQuote/quoteKind';
import { buildQuotePdf, formatCurrency, shareOrDownloadPdf, type QuoteRouteStep } from '../utils/towQuote/quotePdf';
import { formatLatLng, parseLatLng } from '../utils/towQuote/geo';
import { calculateTowPrice, TOLL_MARGIN } from '../utils/towQuote/towPricing';
import '../styles/TowQuoteEditor.css';

const DEFAULT_TRUCK_DEPARTURE = '180';
const DEFAULT_PRICE_PER_KM = '3.50';
const DEPARTURE_RADIUS_KM = 40;

// Base da Renovo: toda viagem sai daqui (e por padrão volta pra cá).
const DEFAULT_ORIGIN = { state: 'SP', city: 'Andradina' };

// Lista (não objeto) para manter "Padrão" no topo: chaves numéricas de objeto
// seriam reordenadas antes de ''.
const AXLE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Padrão (2 eixos)' },
  ...[2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ value: String(n), label: `${n} eixos` })),
];
const AXLE_LABELS: Record<string, string> = Object.fromEntries(AXLE_OPTIONS.map((o) => [o.value, o.label]));

type StopKind = 'Coleta' | 'Entrega' | 'Parada';

interface RouteStop {
  id: number;
  kind: StopKind;
  state: string;
  city: string;
  // Local como digitado: rua e número, nome do estabelecimento, coordenadas GPS
  // ou link do Google Maps com as coordenadas.
  address: string;
  // Posição usada na rota no lugar da cidade: as coordenadas coladas no campo ou
  // as do lugar escolhido nas sugestões. Vazio enquanto não houver posição.
  coords: string;
}

let nextStopId = 1;
const newStop = (kind: StopKind): RouteStop => ({ id: nextStopId++, kind, state: DEFAULT_ORIGIN.state, city: '', address: '', coords: '' });

const place = (city: string, state: string) => [city.trim(), state].filter(Boolean).join('/');

// Local da parada para tela/PDF: o endereço/estabelecimento quando houver,
// "Cidade/UF" e, se o que foi colado eram coordenadas, a posição GPS.
const stopPlace = (stop: RouteStop) => {
  const cityPlace = stop.city.trim() ? place(stop.city, stop.state) : '';
  const typedGps = parseLatLng(stop.address);
  if (typedGps) return [cityPlace, `GPS ${formatLatLng(typedGps)}`].filter(Boolean).join(' · ');
  const address = stop.address.trim();
  if (!address) return cityPlace;
  // Endereço vindo das sugestões já traz a cidade: não repete.
  return cityPlace && !address.toLowerCase().includes(stop.city.trim().toLowerCase()) ? `${address} · ${cityPlace}` : address;
};

// Link colado que não traz as coordenadas no texto (ex.: maps.app.goo.gl).
const isUnreadableMapsLink = (text: string) => /^https?:\/\//i.test(text.trim()) && !parseLatLng(text);

// Ano de fabricação/modelo no padrão AAAA/AAAA enquanto o usuário digita.
const formatYearModel = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return digits.length <= 4 ? digits : `${digits.slice(0, 4)}/${digits.slice(4)}`;
};

interface CityStateFieldProps {
  id: string;
  state: string;
  city: string;
  cities: string[];
  loading: boolean;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
}

// Par UF + cidade com busca na lista do IBGE.
const CityStateField: React.FC<CityStateFieldProps> = ({ id, state, city, cities, loading, onStateChange, onCityChange }) => (
  <div className="form-row">
    <div className="form-group form-group-uf">
      <label>Estado</label>
      <select value={state} onChange={(e) => onStateChange(e.target.value)}>
        <option value="">Selecione...</option>
        {UF_LIST.map((uf) => <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>)}
      </select>
    </div>
    <div className="form-group">
      <label>Cidade</label>
      <input
        list={`${id}-cities`}
        value={city}
        onChange={(e) => onCityChange(e.target.value)}
        placeholder={loading ? 'Carregando cidades...' : 'Digite para buscar'}
        disabled={!state}
      />
      <datalist id={`${id}-cities`}>
        {cities.map((cidade) => <option key={cidade} value={cidade} />)}
      </datalist>
    </div>
  </div>
);

// Formulário salvo no histórico (TowQuote.formData). O backend guarda como JSON
// opaco — só o app lê e escreve este formato.
interface QuoteFormData {
  // Ausente nos orçamentos de guincho; FORKLIFT_KIND nos de empilhadeira.
  kind?: string;
  assistance?: Record<string, string>;
  customer?: Record<string, string>;
  vehicle?: Record<string, string>;
  service?: Record<string, string>;
  origin?: { state: string; city: string };
  stops?: { kind: StopKind; state: string; city: string; address?: string; coords?: string }[];
  returnToOrigin?: boolean;
  // true: KM e pedágio digitados pelo usuário; false: preenchidos pelo cálculo de rota.
  manualRoute?: boolean;
  totalKm?: string;
  tolls?: string;
  pricePerKm?: string;
  axleCount?: string;
  truckDeparture?: string;
  paymentMethods?: string[];
  paymentDeadline?: string;
  // Formato antigo: texto livre (ex.: "10 dias após o serviço"), lido como prazo.
  paymentTerms?: string;
  invoice?: Partial<InvoiceData>;
  notes?: string;
}

// Resposta de POST /fretes/cotacao (um trecho origem → destino, via Google Routes).
interface FreightLegResult {
  distanciaKm: number;
  valorPedagioEstimado: number;
  pedagioIndisponivel: boolean;
}

const TowQuoteEditor: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: routeQuoteId } = useParams();
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [approving, setApproving] = useState(false);

  const [assistance, setAssistance] = useState({
    protocol: '',
    insuranceCompany: '',
    assistanceCompany: '',
    claimNumber: '',
    requesterName: '',
    requesterPhone: '',
  });
  const [customer, setCustomer] = useState({ name: '', document: '', phone: '', address: '' });
  const [vehicle, setVehicle] = useState({ plate: '', brand: '', model: '', year: '' });
  const [service, setService] = useState({
    towType: 'Leve',
    towUnit: '',
    serviceDate: today(),
    pickupLocation: '',
    deliveryDestination: '',
  });

  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [stops, setStops] = useState<RouteStop[]>(() => [newStop('Coleta'), newStop('Entrega')]);
  const [returnToOrigin, setReturnToOrigin] = useState(true);
  const [manualRoute, setManualRoute] = useState(false);
  const [totalKm, setTotalKm] = useState('');
  const [tolls, setTolls] = useState('');
  const [pricePerKm, setPricePerKm] = useState(DEFAULT_PRICE_PER_KM);
  const [axleCount, setAxleCount] = useState('');
  const [truckDeparture, setTruckDeparture] = useState(DEFAULT_TRUCK_DEPARTURE);

  const [paymentMethods, setPaymentMethods] = useState<string[]>(PAYMENT_METHODS);
  const [paymentDeadline, setPaymentDeadline] = useState('');
  const paymentTerms = describePayment(paymentMethods, paymentDeadline);
  const [invoice, setInvoice] = useState<InvoiceData>(EMPTY_INVOICE);
  const [notes, setNotes] = useState('');

  const [brands, setBrands] = useState<FipeOption[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [models, setModels] = useState<FipeOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const [citiesCache, setCitiesCache] = useState<Record<string, string[]>>({});
  const [loadingCitiesFor, setLoadingCitiesFor] = useState<string | null>(null);
  const [quoteMessage, setQuoteMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  // Itinerário + eixos do último cálculo automático: avisa quando a rota muda depois.
  const [calculatedRouteKey, setCalculatedRouteKey] = useState<string | null>(null);

  // Atualizador genérico por campo para os blocos de formulário acima.
  const field = <T extends Record<string, string>>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T) =>
    (value: string) => setter((prev) => ({ ...prev, [key]: value }));

  const ensureCitiesLoaded = async (uf: string) => {
    if (!uf || citiesCache[uf]) return;
    setLoadingCitiesFor(uf);
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
      const data = await response.json();
      const nomes = Array.isArray(data)
        ? data.map((m: { nome: string }) => m.nome).sort((a: string, b: string) => a.localeCompare(b, 'pt-BR'))
        : [];
      setCitiesCache((prev) => ({ ...prev, [uf]: nomes }));
    } catch (error) {
      console.error('Erro ao carregar cidades do IBGE:', error);
    } finally {
      setLoadingCitiesFor(null);
    }
  };

  // Marcas e modelos da Tabela FIPE, mesmo padrão do check-in.
  useEffect(() => {
    fetchFipeBrands()
      .then(setBrands)
      .catch((error) => console.error('Erro ao carregar marcas:', error))
      .finally(() => setLoadingBrands(false));
  }, []);

  // Busca os modelos quando a marca digitada bate com uma marca da lista.
  useEffect(() => {
    const matchedBrand = brands.find((b) => b.nome.toLowerCase() === vehicle.brand.trim().toLowerCase());
    if (!matchedBrand) {
      setModels([]);
      return;
    }

    setLoadingModels(true);
    fetchFipeModels(matchedBrand.codigo)
      .then(setModels)
      .catch((error) => console.error('Erro ao carregar modelos:', error))
      .finally(() => setLoadingModels(false));
  }, [vehicle.brand, brands]);

  const brandOptions = useMemo(() => brands.map((b) => ({ value: b.codigo, label: b.nome })), [brands]);
  const modelOptions = useMemo(() => models.map((m) => ({ value: m.codigo, label: m.nome })), [models]);

  // Origem e paradas já começam em SP: carrega as cidades de SP de início.
  useEffect(() => {
    ensureCitiesLoaded(DEFAULT_ORIGIN.state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFormData = (data: QuoteFormData) => {
    // Orçamento de empilhadeira aberto por um link de guincho: vai para a tela certa.
    if (data.kind === FORKLIFT_KIND && routeQuoteId) {
      navigate(`${FORKLIFT_QUOTES_PATH}/${routeQuoteId}`, { replace: true });
      return;
    }
    if (data.assistance) setAssistance((prev) => ({ ...prev, ...data.assistance }));
    if (data.customer) setCustomer((prev) => ({ ...prev, ...data.customer }));
    if (data.vehicle) setVehicle((prev) => ({ ...prev, ...data.vehicle }));
    if (data.service) setService((prev) => ({ ...prev, ...data.service }));
    if (data.origin) setOrigin(data.origin);
    // Orçamentos antigos só tinham o campo GPS (coords): ele vira o texto do local.
    if (data.stops?.length) setStops(data.stops.map((stop) => ({
      ...newStop(stop.kind),
      state: stop.state,
      city: stop.city,
      address: stop.address ?? stop.coords ?? '',
      coords: parseLatLng(stop.coords ?? '') ? stop.coords ?? '' : '',
    })));
    if (data.returnToOrigin !== undefined) setReturnToOrigin(data.returnToOrigin);
    if (data.totalKm !== undefined) setTotalKm(data.totalKm);
    if (data.tolls !== undefined) setTolls(data.tolls);
    // Orçamentos salvos antes do modo manual existir tinham o KM sempre digitado.
    setManualRoute(data.manualRoute ?? Boolean(data.totalKm?.trim()));
    if (data.pricePerKm !== undefined) setPricePerKm(data.pricePerKm);
    if (data.axleCount !== undefined) setAxleCount(data.axleCount);
    if (data.truckDeparture !== undefined) setTruckDeparture(data.truckDeparture);
    if (data.paymentMethods) setPaymentMethods(PAYMENT_METHODS.filter((m) => data.paymentMethods!.includes(m)));
    const deadline = data.paymentDeadline ?? data.paymentTerms;
    if (deadline !== undefined) setPaymentDeadline(deadline);
    if (data.invoice) setInvoice((prev) => ({ ...prev, ...data.invoice }));
    if (data.notes !== undefined) setNotes(data.notes);

    const states = new Set([data.origin?.state, ...(data.stops ?? []).map((stop) => stop.state)].filter(Boolean) as string[]);
    states.forEach((uf) => ensureCitiesLoaded(uf));
  };

  // Reabrindo um orçamento salvo (/quotes/:id): preenche o formulário inteiro.
  const { savedQuote, loadingQuote, loadError, isApproved, rejecting, saveQuote: saveRecord, storePdf, downloadSavedPdf, rejectQuote, markApproved } =
    useSavedQuote<QuoteFormData>(routeQuoteId, TOW_QUOTES_PATH, applyFormData);

  const updateStop = (id: number, patch: Partial<RouteStop>) => {
    setStops((prev) => prev.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)));
  };

  // Digitando: coordenadas/link do Maps colados valem como posição na hora; texto
  // comum (rua, estabelecimento) descarta a posição da sugestão escolhida antes.
  const handleStopAddressChange = (id: number, address: string) => {
    updateStop(id, { address, coords: parseLatLng(address) ? address : '' });
  };

  // Sugestão escolhida: guarda a posição exata e preenche estado/cidade.
  const handleStopPlaceSelect = (id: number, found: FoundPlace) => {
    const uf = UF_LIST.some((item) => item.sigla === found.uf) ? found.uf! : null;
    updateStop(id, {
      address: placeLabel(found),
      coords: formatLatLng({ lat: found.latitude, lng: found.longitude }),
      ...(uf ? { state: uf } : {}),
      ...(found.cidade ? { city: found.cidade } : {}),
    });
    if (uf) ensureCitiesLoaded(uf);
  };

  const removeStop = (id: number) => {
    setStops((prev) => prev.filter((stop) => stop.id !== id));
  };

  // Itinerário completo: base → paradas → (volta à base).
  const routeSteps: QuoteRouteStep[] = [
    { label: 'Saída (base)', place: place(origin.city, origin.state) },
    ...stops.map((stop) => ({ label: stop.kind, place: stopPlace(stop) })),
    ...(returnToOrigin ? [{ label: 'Retorno à base', place: place(origin.city, origin.state) }] : []),
  ];
  // Etapas sem cidade, endereço nem GPS ficam fora do PDF e dos resumos (paradas
  // vazias dão '' e a base sem cidade dá só a UF).
  const filledSteps = routeSteps.filter((step) => step.place.length > 2);

  // KM e pedágio têm uma única fonte por vez: ou o cálculo automático, ou o
  // usuário. Voltar ao automático descarta o que foi digitado.
  const handleManualRouteChange = (manual: boolean) => {
    setManualRoute(manual);
    setQuoteMessage(null);
    setCalculatedRouteKey(null);
    if (!manual) {
      setTotalKm('');
      setTolls('');
    }
  };

  // Pontos do itinerário na ordem (base → paradas → base) e a "assinatura" da rota.
  // O backend monta "<cidade>, <UF>, Brasil" e a Google aceita, nesse texto,
  // coordenadas ("lat,lng") ou um endereço: parada com posição vai pelas
  // coordenadas; com endereço digitado sem sugestão escolhida, por "endereço, cidade".
  const routePoints = [
    { state: origin.state, city: origin.city.trim() },
    ...stops.map((stop) => {
      const gps = parseLatLng(stop.coords);
      if (gps) return { state: stop.state, city: formatLatLng(gps) };
      const address = stop.address.trim();
      const city = stop.city.trim();
      return { state: stop.state, city: address ? [address, city].filter(Boolean).join(', ') : city };
    }),
    ...(returnToOrigin ? [{ state: origin.state, city: origin.city.trim() }] : []),
  ];
  const routeKey = JSON.stringify({ routePoints, axleCount });
  const routeChangedSinceCalc = !manualRoute && calculatedRouteKey !== null && calculatedRouteKey !== routeKey;

  // O endpoint cota um trecho por vez: cada trecho é calculado e os KM e
  // pedágios são somados.
  const handleBuscarCotacao = async () => {
    if (manualRoute) return;
    if (stops.some((stop) => isUnreadableMapsLink(stop.address))) {
      setQuoteMessage({ type: 'error', text: 'Há um link do Maps sem coordenadas. Cole as coordenadas, digite o endereço ou apague o campo.' });
      return;
    }
    const incomplete = routePoints.some((point) => !point.city || !point.state);
    if (incomplete) {
      setQuoteMessage({ type: 'error', text: 'Preencha estado e cidade (ou o endereço/GPS) da origem e de todas as paradas.' });
      return;
    }

    const legs = routePoints.slice(1)
      .map((to, i) => ({ from: routePoints[i], to }))
      .filter(({ from, to }) => from.state !== to.state || from.city.toLowerCase() !== to.city.toLowerCase());
    if (legs.length === 0) {
      setQuoteMessage({ type: 'error', text: 'A rota precisa de ao menos um trecho entre cidades diferentes.' });
      return;
    }

    // O backend exige preço/km > 0, mas aqui só KM e pedágio são usados.
    const precoPorKm = toNumber(pricePerKm) || 1;
    setCalculatingRoute(true);
    setQuoteMessage(null);
    try {
      const results = await Promise.all(legs.map(({ from, to }) =>
        api.post<FreightLegResult>('/fretes/cotacao', {
          origemCidade: from.city,
          origemUf: from.state,
          destinoCidade: to.city,
          destinoUf: to.state,
          precoPorKm,
          numeroEixos: axleCount ? Number(axleCount) : null,
        })
      ));
      const km = Math.round(results.reduce((sum, r) => sum + r.distanciaKm, 0) * 10) / 10;
      const tollsSum = Math.round(results.reduce((sum, r) => sum + r.valorPedagioEstimado, 0) * 100) / 100;
      setTotalKm(String(km));
      setTolls(tollsSum.toFixed(2));
      setCalculatedRouteKey(routeKey);
      const legsWithoutToll = legs.filter((_, i) => results[i].pedagioIndisponivel);
      setQuoteMessage({
        type: 'info',
        text: `${legs.length} ${legs.length === 1 ? 'trecho calculado' : 'trechos calculados'}: ` +
          `${km.toLocaleString('pt-BR')} km, pedágio estimado ${formatCurrency(tollsSum)}.` +
          (legsWithoutToll.length > 0
            ? ` Pedágio não informado pelo Google em: ${legsWithoutToll
              .map(({ from, to }) => `${place(from.city, from.state)} → ${place(to.city, to.state)}`)
              .join(', ')} (pode não haver pedágio — confira; se precisar, informe manualmente).`
            : ''),
      });
    } catch (error) {
      setQuoteMessage({ type: 'error', text: errorMessage(error, 'Não foi possível calcular a rota.') });
    } finally {
      setCalculatingRoute(false);
    }
  };

  const truckDepartureValue = Number(truckDeparture) || 0;
  const pricePerKmValue = toNumber(pricePerKm);
  const totalKmValue = toNumber(totalKm);
  const tollsValue = toNumber(tolls);
  const price = calculateTowPrice({
    departureValue: truckDepartureValue,
    radiusKm: DEPARTURE_RADIUS_KM,
    totalKm: totalKmValue,
    pricePerKm: pricePerKmValue,
    tollsValue,
  });

  // Texto exibido na tela e impresso nas observações do PDF.
  const departureDescription =
    `Saída do caminhão: até ${DEPARTURE_RADIUS_KM} km, ${formatCurrency(truckDepartureValue)}. ` +
    (pricePerKmValue && pricePerKmValue > 0
      ? `Excedente: ${formatCurrency(pricePerKmValue)} por km rodado acima de ${DEPARTURE_RADIUS_KM} km.`
      : `Acima de ${DEPARTURE_RADIUS_KM} km, consultar.`);

  const formSnapshot = (): QuoteFormData => ({
    assistance,
    customer,
    vehicle,
    service,
    origin,
    stops: stops.map(({ kind, state, city, address, coords }) => ({ kind, state, city, address, coords })),
    returnToOrigin,
    manualRoute,
    totalKm,
    tolls,
    pricePerKm,
    axleCount,
    truckDeparture,
    paymentMethods,
    paymentDeadline,
    invoice,
    notes,
  });

  const saveQuote = () => saveRecord({
    customerName: customer.name.trim(),
    customerPhone: customer.phone,
    vehiclePlate: vehicle.plate ? formatPlate(vehicle.plate) : '',
    vehicleDescription: [vehicle.brand, vehicle.model, vehicle.year].map((part) => part.trim()).filter(Boolean).join(' '),
    routeSummary: filledSteps.map((step) => step.place).join(' → '),
    totalKm: totalKmValue,
    total: price.total,
    formData: JSON.stringify(formSnapshot()),
  });

  const handleGeneratePdf = async () => {
    if (truckDepartureValue <= 0) {
      alert('Informe o valor da saída do caminhão.');
      return;
    }

    setGeneratingPdf(true);
    const warnings: string[] = [];
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');

      // O número vem do histórico; sem conexão com o servidor o PDF ainda sai,
      // com um número local, e o usuário é avisado de que não ficou salvo.
      let quote: TowQuote | null = null;
      try {
        quote = await saveQuote();
      } catch (error) {
        warnings.push(`O orçamento não foi salvo no histórico: ${errorMessage(error, 'erro desconhecido')}`);
      }
      const number = quote?.number
        ?? `ORC-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;

      const { blob, fileName } = await buildQuotePdf({
        number,
        date: now,
        validityDays: 7,
        consultant: user?.fullName ?? '',
        customer,
        vehicle,
        service,
        assistance,
        route: {
          // Etapas sem cidade preenchida ficam fora do PDF.
          steps: filledSteps,
          axleLabel: AXLE_LABELS[axleCount] ?? axleCount,
          totalKm: totalKmValue,
        },
        pricing: {
          departureValue: truckDepartureValue,
          radiusKm: DEPARTURE_RADIUS_KM,
          pricePerKm: pricePerKmValue,
          result: price,
        },
        paymentTerms,
        invoice,
        description: departureDescription,
        notes,
      });

      await shareOrDownloadPdf(blob, fileName, `Orçamento ${number}`);

      // Guarda o mesmo PDF enviado ao cliente (depois do compartilhamento, pra não
      // atrasar a abertura da tela de compartilhar).
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

  // Orçamento aprovado pelo cliente: vira OS de guincho já preenchida. Os dados sem
  // campo próprio na OS (protocolo, solicitante, pagamento, nota fiscal) vão nas
  // observações, que também saem no PDF da OS.
  const handleApprove = async () => {
    // Já virou OS: não abre outra, só leva até ela.
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
      quote = await saveQuote();
    } catch (error) {
      const proceed = window.confirm(
        `Não foi possível salvar o orçamento no histórico (${errorMessage(error, 'erro desconhecido')}). Abrir a OS mesmo assim?`
      );
      if (!proceed) {
        setApproving(false);
        return;
      }
    }

    const firstOf = (kind: StopKind) => stops.find((stop) => stop.kind === kind && stopPlace(stop) !== '');
    const pickup = firstOf('Coleta');
    const delivery = firstOf('Entrega');
    const yearMatch = vehicle.year.match(/\d{4}/);
    const invoiceData = invoiceLines(invoice);

    const agreement = [
      `Orçamento ${quote ? `${quote.number} ` : ''}aprovado: ${formatCurrency(price.total)}` +
        (price.complete ? ` (saída ${formatCurrency(truckDepartureValue)} + ${price.excessKm} km excedentes x ${formatCurrency(pricePerKmValue ?? 0)}` +
          (price.tollsValue > 0 ? ` + pedágios ${formatCurrency(price.tollsValue)} c/ 5% de reserva` : '') + ')' : '') +
        (manualRoute ? ' · KM e pedágio informados manualmente' : ''),
      `Tipo de guincho: ${service.towType}` + (service.serviceDate ? ` · Data do serviço: ${service.serviceDate.split('-').reverse().join('/')}` : ''),
      assistance.protocol && `Protocolo/OS da assistência: ${assistance.protocol}`,
      (assistance.requesterName || assistance.requesterPhone) &&
        `Solicitante: ${[assistance.requesterName, assistance.requesterPhone].filter(Boolean).join(' - ')}`,
      `Rota: ${filledSteps.map((step) => `${step.label}: ${step.place}`).join(' → ')}`,
      paymentTerms && `Pagamento: ${paymentTerms}`,
      invoiceData.length > 0 && `Dados para nota fiscal:\n${invoiceData.join('\n')}`,
      notes.trim() && `Observações: ${notes.trim()}`,
    ].filter(Boolean).join('\n');

    try {
      const order = await api.post<CreatedServiceOrder>('/service-orders/with-customer-vehicle', {
        serviceType: 'Guincho',
        problemReported: `Remoção: ${service.pickupLocation || (pickup && stopPlace(pickup)) || 'local a confirmar'} → ${service.deliveryDestination || (delivery && stopPlace(delivery)) || 'destino a confirmar'}`,
        responsibleUser: user?.fullName || '',
        notes: agreement,
        towDetails: {
          insuranceCompany: assistance.insuranceCompany,
          assistanceCompany: assistance.assistanceCompany,
          claimNumber: assistance.claimNumber,
          pickupLocation: service.pickupLocation,
          deliveryDestination: service.deliveryDestination,
          towUnit: service.towUnit,
          deliveredByName: '',
          deliveredByDocument: '',
          receivedByName: '',
          receivedByDocument: '',
          originCity: pickup ? pickup.city.trim() || stopPlace(pickup) : origin.city,
          originState: pickup?.state ?? origin.state,
          destinationCity: delivery ? delivery.city.trim() || stopPlace(delivery) : null,
          destinationState: delivery?.state ?? null,
          pricePerKm: pricePerKmValue,
          axleCount: axleCount ? Number(axleCount) : null,
          distanceKm: totalKmValue,
          tollsValue: price.tollsValue || null,
          freightTotal: price.total,
        },
        customer: {
          name: customer.name.trim(),
          document: customer.document,
          phone: customer.phone,
          address: customer.address,
        },
        vehicle: {
          plate: vehicle.plate ? formatPlate(vehicle.plate) : '',
          brand: vehicle.brand,
          model: vehicle.model,
          year: yearMatch ? Number(yearMatch[0]) : 0,
          color: '',
          mileage: 0,
        },
      });

      if (quote) await markApproved(quote, order.id, order.number);
      navigate(`/service-orders/${order.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao abrir a OS.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="checkin-page tq-editor tq-wide">
      <div className="page-header">
        <h2>{savedQuote ? `Orçamento ${savedQuote.number}` : 'Orçamento'}</h2>
        <Link to={TOW_QUOTES_PATH} className="btn-link">← Orçamentos salvos</Link>
      </div>

      {loadingQuote && <p className="hint">Carregando orçamento...</p>}
      {loadError && <p className="error-text">{loadError}</p>}
      {savedQuote && <QuoteStatusBanner quote={savedQuote} />}

      {/* No computador as etapas ficam lado a lado: o orçamento inteiro numa tela. */}
      <div className="tq-columns">
      <section className="tq-col">
      <p className="tq-step"><span>1</span> Dados do atendimento</p>
      <h3>Assistência / Seguradora</h3>
      <div className="compact-fields">
        <div className="form-row">
          <TextField label="Protocolo / OS assistência" value={assistance.protocol} onChange={field(setAssistance, 'protocol')} placeholder="Ex: E2026..." />
          <TextField label="Sinistro" value={assistance.claimNumber} onChange={field(setAssistance, 'claimNumber')} placeholder="Nº do sinistro" />
        </div>
        <div className="form-row">
          <TextField label="Seguradora" value={assistance.insuranceCompany} onChange={field(setAssistance, 'insuranceCompany')} placeholder="Ex: Porto Seguro" />
          <TextField label="Assistência" value={assistance.assistanceCompany} onChange={field(setAssistance, 'assistanceCompany')} placeholder="Ex: ACPP" />
        </div>
        <div className="form-row">
          <TextField label="Solicitante (atendente)" value={assistance.requesterName} onChange={field(setAssistance, 'requesterName')} placeholder="Nome" />
          <TextField label="Tel. do solicitante" value={assistance.requesterPhone} onChange={field(setAssistance, 'requesterPhone')} placeholder="(18) 99999-9999" type="tel" />
        </div>
      </div>

      <h3>Cliente</h3>
      <div className="compact-fields">
        <div className="form-row">
          <TextField label="Nome" value={customer.name} onChange={field(setCustomer, 'name')} placeholder="Cliente/associado" />
          <TextField label="CPF/CNPJ" value={customer.document} onChange={(value) => field(setCustomer, 'document')(formatCpfCnpj(value))} placeholder="000.000.000-00" />
        </div>
        <div className="form-row">
          <TextField label="Telefone" value={customer.phone} onChange={field(setCustomer, 'phone')} placeholder="(18) 99999-9999" type="tel" />
          <TextField label="Endereço" value={customer.address} onChange={field(setCustomer, 'address')} placeholder="Rua, nº - Cidade" />
        </div>
      </div>

      <h3>Veículo</h3>
      <div className="compact-fields">
        <div className="form-row">
          <div className="form-group">
            <label>Placa</label>
            <input
              value={vehicle.plate}
              onChange={(e) => setVehicle((p) => ({ ...p, plate: formatPlate(e.target.value) }))}
              maxLength={8}
              placeholder="XXX-XXXX"
            />
          </div>
          <div className="form-group">
            <label>Ano/Modelo</label>
            <input
              inputMode="numeric"
              value={vehicle.year}
              onChange={(e) => setVehicle((p) => ({ ...p, year: formatYearModel(e.target.value) }))}
              maxLength={9}
              placeholder="2019/2020"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Marca</label>
            <AutocompleteField
              value={vehicle.brand}
              onChange={(brand) => setVehicle((p) => ({ ...p, brand, model: '' }))}
              options={brandOptions}
              loading={loadingBrands}
              placeholder="Digite para buscar a marca"
            />
          </div>
          <div className="form-group">
            <label>Modelo</label>
            <AutocompleteField
              value={vehicle.model}
              onChange={field(setVehicle, 'model')}
              options={modelOptions}
              disabled={!vehicle.brand}
              loading={loadingModels}
              placeholder={vehicle.brand ? 'Digite para buscar o modelo' : 'Selecione a marca primeiro'}
            />
          </div>
        </div>
      </div>

      <h3>Serviço</h3>
      <div className="compact-fields">
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de guincho</label>
            <select value={service.towType} onChange={(e) => field(setService, 'towType')(e.target.value)}>
              <option value="Leve">Leve</option>
              <option value="Médio">Médio</option>
              <option value="Pesado">Pesado</option>
            </select>
          </div>
          <TextField label="Data do serviço" type="date" value={service.serviceDate} onChange={field(setService, 'serviceDate')} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Local de retirada</label>
            <PlaceSearchField
              value={service.pickupLocation}
              onChange={field(setService, 'pickupLocation')}
              onSelect={(found) => field(setService, 'pickupLocation')(placeLabel(found))}
              placeholder="Rua, nº ou estabelecimento"
            />
          </div>
          <div className="form-group">
            <label>Local de entrega</label>
            <PlaceSearchField
              value={service.deliveryDestination}
              onChange={field(setService, 'deliveryDestination')}
              onSelect={(found) => field(setService, 'deliveryDestination')(placeLabel(found))}
              placeholder="Rua, nº ou estabelecimento"
            />
          </div>
        </div>
        <TextField label="Viatura" value={service.towUnit} onChange={field(setService, 'towUnit')} placeholder="Ex: Guincho 01 - Plataforma" />
      </div>

      </section>

      <section className="tq-col">
      <p className="tq-step"><span>2</span> Rota</p>
      <div className="freight-quote-box">
        <h3>Rota</h3>

        <div className="route-step">
          <div className="route-step-header">
            <span className="route-step-badge">1</span>
            <strong>Saída (base)</strong>
          </div>
          <CityStateField
            id="route-origin"
            state={origin.state}
            city={origin.city}
            cities={citiesCache[origin.state] || []}
            loading={loadingCitiesFor === origin.state}
            onStateChange={(state) => {
              setOrigin({ state, city: '' });
              ensureCitiesLoaded(state);
            }}
            onCityChange={(city) => setOrigin((prev) => ({ ...prev, city }))}
          />
        </div>

        {stops.map((stop, index) => (
          <div key={stop.id} className="route-step">
            <div className="route-step-header">
              <span className="route-step-badge">{index + 2}</span>
              <select
                className="route-step-kind"
                value={stop.kind}
                onChange={(e) => updateStop(stop.id, { kind: e.target.value as StopKind })}
                aria-label="Tipo da parada"
              >
                <option value="Coleta">Coleta do veículo</option>
                <option value="Entrega">Entrega do veículo</option>
                <option value="Parada">Parada</option>
              </select>
              {stops.length > 1 && (
                <button type="button" className="route-step-remove" onClick={() => removeStop(stop.id)} aria-label="Remover parada">
                  ✕
                </button>
              )}
            </div>
            <CityStateField
              id={`route-stop-${stop.id}`}
              state={stop.state}
              city={stop.city}
              cities={citiesCache[stop.state] || []}
              loading={loadingCitiesFor === stop.state}
              onStateChange={(state) => {
                updateStop(stop.id, { state, city: '' });
                ensureCitiesLoaded(state);
              }}
              onCityChange={(city) => updateStop(stop.id, { city })}
            />
            <div className="form-group">
              <label>Endereço, estabelecimento ou GPS (opcional)</label>
              <PlaceSearchField
                value={stop.address}
                onChange={(text) => handleStopAddressChange(stop.id, text)}
                onSelect={(found) => handleStopPlaceSelect(stop.id, found)}
                placeholder="Rua e nº, nome do local, coordenadas ou link do Maps"
              />
              {isUnreadableMapsLink(stop.address) ? (
                <p className="error-text">Link sem coordenadas (ex.: maps.app.goo.gl). Cole as coordenadas (lat, long) ou digite o endereço.</p>
              ) : stop.coords ? (
                <p className="hint">✓ A rota usa esta posição exata.</p>
              ) : stop.address.trim() ? (
                <p className="hint">Escolha uma sugestão para a posição exata, ou a rota usa o endereço digitado com a cidade.</p>
              ) : null}
            </div>
          </div>
        ))}

        <button type="button" className="btn-secondary btn-add-stop" onClick={() => setStops((prev) => [...prev, newStop('Parada')])}>
          + Adicionar parada
        </button>

        <label className="checkbox-row route-return">
          <input type="checkbox" checked={returnToOrigin} onChange={(e) => setReturnToOrigin(e.target.checked)} />
          Retornar à origem ({place(origin.city, origin.state) || 'base'})
        </label>

        <p className="route-summary">
          {routeSteps.map((step, i) => (
            <span key={i}>
              {i > 0 && ' → '}
              <strong>{step.label}:</strong> {step.place || '—'}
            </span>
          ))}
        </p>

        <label className="checkbox-row">
          <input type="checkbox" checked={manualRoute} onChange={(e) => handleManualRouteChange(e.target.checked)} />
          Informar KM e pedágio manualmente
        </label>

        <div className="form-row">
          <div className="form-group">
            <label>KM total rodado</label>
            <input
              type="number"
              inputMode="decimal"
              value={totalKm}
              onChange={(e) => setTotalKm(e.target.value)}
              placeholder={manualRoute ? 'Ex: 284' : 'Calculado pela rota'}
              readOnly={!manualRoute}
            />
          </div>
          <div className="form-group">
            <label>Pedágios (R$)</label>
            <input
              type="number"
              inputMode="decimal"
              value={tolls}
              onChange={(e) => setTolls(e.target.value)}
              placeholder={manualRoute ? 'Ex: 42,60' : 'Calculado pela rota'}
              readOnly={!manualRoute}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Nº de eixos</label>
            <select value={axleCount} onChange={(e) => setAxleCount(e.target.value)}>
              {AXLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <button type="button" className="btn-secondary btn-add-stop" onClick={handleBuscarCotacao} disabled={manualRoute || calculatingRoute}>
          {calculatingRoute ? 'Calculando rota...' : '🗺️ Calcular rota e pedágio automaticamente'}
        </button>
        {routeChangedSinceCalc && (
          <p className="error-text">A rota ou o nº de eixos mudou depois do cálculo. Calcule de novo.</p>
        )}
        {manualRoute && (
          <p className="hint">Cálculo automático indisponível: o orçamento usa o KM e o pedágio informados manualmente.</p>
        )}
        {quoteMessage && (
          <p className={quoteMessage.type === 'error' ? 'error-text' : 'hint'} role="status">{quoteMessage.text}</p>
        )}
      </div>

      </section>

      <section className="tq-col tq-col-sticky">
      <p className="tq-step"><span>3</span> Valores e fechamento</p>
      <div className="freight-quote-box">
        <h3>Valores</h3>
        <div className="form-row">
          <TextField label="Saída do caminhão (R$)" type="number" inputMode="decimal" value={truckDeparture} onChange={setTruckDeparture} />
          <TextField label="R$ por km excedente" type="number" inputMode="decimal" value={pricePerKm} onChange={setPricePerKm} />
        </div>
        <p className="quote-note">{departureDescription}</p>

        <div className="quote-price-lines">
          <div>
            <span>Saída (até {DEPARTURE_RADIUS_KM} km)</span>
            <span>{formatCurrency(truckDepartureValue)}</span>
          </div>
          {price.complete ? (
            <div>
              <span>
                Excedente: {price.excessKm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km × {formatCurrency(pricePerKmValue ?? 0)}
              </span>
              <span>{formatCurrency(price.excessValue)}</span>
            </div>
          ) : (
            <div className="hint">
              <span>Informe o KM total rodado para calcular o excedente.</span>
            </div>
          )}
          {price.tollsValue > 0 && (
            <>
              <div>
                <span>Pedágios</span>
                <span>{formatCurrency(price.tollsBase)}</span>
              </div>
              <div>
                <span>Reserva p/ reajuste de pedágio ({TOLL_MARGIN * 100}%)</span>
                <span>{formatCurrency(price.tollsMargin)}</span>
              </div>
            </>
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
          placeholder="Ex: colocar placa, km e origem/destino na observação da nota; enviar fotos de origem e destino."
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

export default TowQuoteEditor;
