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

export const normalizeDocument = (value: string): string => {
  return (value || '').replace(/\D/g, '');
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

const isValidCnpj = (digits: string): boolean => {
  if (digits.length !== 14 || /^\d{14}$/.test(digits) === false) return false;

  if (/^(\d)\1+$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += Number(digits.charAt(i)) * weights1[i];
  }

  let checkDigit = sum % 11;
  checkDigit = checkDigit < 2 ? 0 : 11 - checkDigit;
  if (checkDigit !== Number(digits.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i += 1) {
    sum += Number(digits.charAt(i)) * weights2[i];
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
