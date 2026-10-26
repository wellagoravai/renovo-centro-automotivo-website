// Tipos do histórico de orçamentos (/tow-quotes), iguais aos do app da equipe.
export type TowQuoteStatus = 'Pendente' | 'Aprovado' | 'Recusado';

// Orçamento de guincho salvo. formData só vem no detalhe: é o formulário inteiro
// serializado (mesmo formato do app), para reabrir e editar.
export interface TowQuote {
  id: string;
  number: string;
  status: TowQuoteStatus;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleDescription: string;
  routeSummary: string;
  totalKm: number | null;
  total: number;
  hasPdf: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  decidedAt?: string | null;
  decidedBy?: string | null;
  serviceOrderId?: string | null;
  serviceOrderNumber?: string | null;
  formData?: string;
}

// Só o que o orçamento usa da OS criada ao aprovar.
export interface CreatedServiceOrder {
  id: string;
  number: string;
}

// Custo lançado numa viagem do guincho (/trip-expenses), avulso ou ligado a uma OS.
export interface TripExpense {
  id: string;
  category: string;
  amount: number;
  description: string;
  photoUrl?: string | null;
  createdAt: string;
  createdBy: string;
  serviceOrderId?: string | null;
  serviceOrderNumber?: string | null;
  vehiclePlate?: string | null;
}

// Só o que os custos de viagem usam da OS de guincho (GET /service-orders).
export interface ServiceOrder {
  id: string;
  number: string;
  status: string;
  serviceType: string;
  customerName: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  value: number;
  entryDate: string;
  towDetails?: {
    originCity?: string | null;
    originState?: string | null;
    destinationCity?: string | null;
    destinationState?: string | null;
    distanceKm?: number | null;
    truckStartKm?: number | null;
    truckEndKm?: number | null;
    freightTotal?: number | null;
  } | null;
}
