/**
 * Utility functions for input masking and value formatting
 */

/**
 * Formats a string to CNPJ mask: 00.000.000/0000-00
 */
export const maskCnpj = (value: string): string => {
  const raw = value.replace(/\D/g, '').substring(0, 14);
  if (raw.length <= 2) return raw;
  if (raw.length <= 5) return `${raw.substring(0, 2)}.${raw.substring(2)}`;
  if (raw.length <= 8) return `${raw.substring(0, 2)}.${raw.substring(2, 5)}.${raw.substring(5)}`;
  if (raw.length <= 12) return `${raw.substring(0, 2)}.${raw.substring(2, 5)}.${raw.substring(5, 8)}/${raw.substring(8)}`;
  return `${raw.substring(0, 2)}.${raw.substring(2, 5)}.${raw.substring(5, 8)}/${raw.substring(8, 12)}-${raw.substring(12)}`;
};

/**
 * Formats a string to Brazilian Phone/WhatsApp mask: (00) 00000-0000 or (00) 0000-0000
 */
export const maskPhone = (value: string): string => {
  const raw = value.replace(/\D/g, '').substring(0, 11);
  if (raw.length <= 2) return raw;
  if (raw.length <= 6) return `(${raw.substring(0, 2)}) ${raw.substring(2)}`;
  if (raw.length <= 10) return `(${raw.substring(0, 2)}) ${raw.substring(2, 6)}-${raw.substring(6)}`;
  return `(${raw.substring(0, 2)}) ${raw.substring(2, 7)}-${raw.substring(7)}`;
};

/**
 * Formats a numeric input string to BRL Currency: R$ 0,00 -> R$ 1.250,00
 */
export const maskCurrency = (value: string): string => {
  let cleanValue = value.replace(/\D/g, '');
  if (!cleanValue) return 'R$ 0,00';
  
  // Pad with leading zeros if too short
  if (cleanValue.length === 1) cleanValue = '00' + cleanValue;
  else if (cleanValue.length === 2) cleanValue = '0' + cleanValue;

  const integerPart = cleanValue.substring(0, cleanValue.length - 2);
  const centsPart = cleanValue.substring(cleanValue.length - 2);
  
  const formattedInteger = parseInt(integerPart, 10).toLocaleString('pt-BR');
  return `R$ ${formattedInteger},${centsPart}`;
};

/**
 * Converts a masked currency string (R$ 1.250,00) back to a raw float number (1250.50)
 */
export const parseCurrencyToNumber = (value: string): number => {
  if (!value) return 0;
  const clean = value.replace(/[^\d]/g, '');
  if (!clean) return 0;
  return parseFloat(clean) / 100;
};

/**
 * Validates email pattern
 */
export const validateEmail = (email: string): boolean => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
};
