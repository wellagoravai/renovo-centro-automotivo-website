/**
 * Helper utilities for the application
 */

export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '').replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Só letras e números, em maiúsculas: o CNPJ alfanumérico da Receita (a partir
// de 07/2026) tem letras nas 12 primeiras posições. CPF e CNPJ numéricos
// continuam saindo só com os dígitos. Mesma regra do DocumentValidator do backend.
export const normalizeDocument = (value: string): string => {
  return (value || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
};

// Insere os separadores nas posições dadas: [[3, '.'], [6, '.'], [9, '-']].
const applyMask = (text: string, separators: [number, string][]) =>
  separators.reduceRight((acc, [pos, sep]) => (acc.length > pos ? `${acc.slice(0, pos)}${sep}${acc.slice(pos)}` : acc), text);

// Máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) enquanto o
// usuário digita. Até 11 dígitos é CPF; com letra ou acima de 11 caracteres
// vira CNPJ, que aceita letras nas 12 primeiras posições (CNPJ alfanumérico) e
// só números nos 2 dígitos verificadores.
export const formatCpfCnpj = (value: string): string => {
  const clean = normalizeDocument(value);
  if (clean.length <= 11 && /^\d*$/.test(clean)) {
    return applyMask(clean, [[3, '.'], [6, '.'], [9, '-']]);
  }
  const base = clean.slice(0, 12);
  const checkDigits = clean.slice(12).replace(/\D/g, '').slice(0, 2);
  return applyMask(base + checkDigits, [[2, '.'], [5, '.'], [8, '/'], [12, '-']]);
};

// Placa em maiúsculas no padrão XXX-XXXX (antiga ABC-1234 ou Mercosul ABC-1D23),
// o mesmo que o app da equipe grava.
export const formatPlate = (raw: string): string => {
  const clean = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
};

const isValidCpf = (digits: string): boolean => {
  if (digits.length !== 11 || /^\d{11}$/.test(digits) === false) return false;

  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits.charAt(i)) * (10 - i);
  }

  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== Number(digits.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(digits.charAt(i)) * (11 - i);
  }

  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === Number(digits.charAt(10));
};

// CNPJ numérico ou alfanumérico: 12 posições 0-9/A-Z + 2 dígitos verificadores
// numéricos. No cálculo cada caractere vale o código ASCII - 48 (dígitos valem
// o próprio número, 'A' = 17, 'B' = 18...).
const cnpjCharValue = (ch: string) => ch.charCodeAt(0) - 48;

const isValidCnpj = (digits: string): boolean => {
  if (digits.length !== 14 || /^[0-9A-Z]{12}\d{2}$/.test(digits) === false) return false;

  if (/^(.)\1+$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += cnpjCharValue(digits.charAt(i)) * weights1[i];
  }

  let checkDigit = sum % 11;
  checkDigit = checkDigit < 2 ? 0 : 11 - checkDigit;
  if (checkDigit !== Number(digits.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i += 1) {
    sum += cnpjCharValue(digits.charAt(i)) * weights2[i];
  }

  checkDigit = sum % 11;
  checkDigit = checkDigit < 2 ? 0 : 11 - checkDigit;
  return checkDigit === Number(digits.charAt(13));
};

export const validateCpfOrCnpj = (value: string): boolean => {
  const digits = normalizeDocument(value);
  if (!digits) return false;

  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);

  return false;
};

export const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
