// Formata a placa em maiúsculas no padrão XXX-XXXX (3 letras + traço + 4 caracteres)
// enquanto o usuário digita.
export { formatPlate } from '../helpers';

// Placa vazia = OS de guincho aberta antes de chegar ao local da remoção.
export const vehicleLabel = (plate?: string, brand?: string, model?: string) =>
  plate?.trim() ? `${plate} — ${[brand, model].filter(Boolean).join(' ')}` : 'Veículo a definir (preenchido no local)';
