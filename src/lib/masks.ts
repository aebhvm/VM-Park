type MaskInput = string | number | null | undefined;

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;
const PHONE_MAX_LENGTH = 11;
const PLATE_LENGTH = 7;

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Removes every character that is not a decimal digit. */
export function digitsOnly(value: MaskInput): string {
  return String(value ?? '').replace(/\D/g, '');
}

/** Returns at most the 14 digits supported by CPF and CNPJ. */
export function normalizeDocument(value: MaskInput): string {
  return digitsOnly(value).slice(0, CNPJ_LENGTH);
}

/** Formats complete or partially typed CPF/CNPJ values. */
export function formatCpfCnpj(value: MaskInput): string {
  const document = normalizeDocument(value);

  if (document.length <= CPF_LENGTH) {
    return document
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }

  return document
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}

export type DocumentLabel = 'CPF' | 'CNPJ' | 'DOCUMENTO';

/** Identifies only complete CPF/CNPJ values, avoiding misleading labels. */
export function getDocumentLabel(value: MaskInput): DocumentLabel {
  const length = normalizeDocument(value).length;

  if (length === CPF_LENGTH) return 'CPF';
  if (length === CNPJ_LENGTH) return 'CNPJ';
  return 'DOCUMENTO';
}

/** Normalizes a Brazilian phone and removes an optional +55 country code. */
export function normalizePhone(value: MaskInput): string {
  let phone = digitsOnly(value);

  if (phone.length > PHONE_MAX_LENGTH && phone.startsWith('55')) {
    phone = phone.slice(2);
  }

  return phone.slice(0, PHONE_MAX_LENGTH);
}

/** Formats Brazilian landline and mobile numbers, including partial input. */
export function formatPhone(value: MaskInput): string {
  const phone = normalizePhone(value);

  if (!phone) return '';
  if (phone.length < 3) return `(${phone}`;

  const areaCode = phone.slice(0, 2);
  const localNumber = phone.slice(2);
  const prefixLength = localNumber.length > 8 ? 5 : 4;
  const prefix = localNumber.slice(0, prefixLength);
  const suffix = localNumber.slice(prefixLength);

  return `(${areaCode}) ${prefix}${suffix ? `-${suffix}` : ''}`;
}

/** Keeps the seven uppercase alphanumeric characters used by Brazilian plates. */
export function normalizePlate(value: MaskInput): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, PLATE_LENGTH);
}

/** Accepts both the legacy AAA0000 pattern and Mercosur AAA0A00 pattern. */
export function isValidPlate(value: MaskInput): boolean {
  const plate = normalizePlate(value);
  return /^[A-Z]{3}\d{4}$/.test(plate) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(plate);
}

/** Formats legacy plates with a dash and keeps Mercosur plates unseparated. */
export function formatPlate(value: MaskInput): string {
  const plate = normalizePlate(value);

  if (plate.length <= 3) return plate;

  const isMercosur = plate.length >= 5 && /[A-Z]/.test(plate.charAt(4));
  return isMercosur ? plate : `${plate.slice(0, 3)}-${plate.slice(3)}`;
}

export function formatPlateList(value: string): string;
export function formatPlateList(value: readonly string[]): string[];
/** Formats comma-, semicolon- or line-separated plates, or an existing array. */
export function formatPlateList(value: string | readonly string[]): string | string[] {
  if (Array.isArray(value)) {
    return value.map(formatPlate);
  }

  const source = value as string;
  if (!source) return '';

  const hasTrailingSeparator = /[,;\n]\s*$/.test(source);
  const plates = source
    .split(/[,;\n]+/)
    .map((plate) => formatPlate(plate.trim()))
    .filter(Boolean);

  const formatted = plates.join(', ');
  return hasTrailingSeparator && formatted ? `${formatted}, ` : formatted;
}

/** Treats typed digits as cents: "1234" becomes "R$ 12,34". */
export function formatCurrencyInput(value: MaskInput): string {
  const digits = digitsOnly(value);
  if (!digits) return '';

  return formatCurrencyValue(Number(digits) / 100);
}

/** Formats a numeric value for a Brazilian currency input or display. */
export function formatCurrencyValue(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  return brlFormatter.format(value);
}

/** Parses BRL-formatted strings as well as ordinary numeric values. */
export function parseCurrency(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const source = String(value ?? '').trim();
  if (!source) return 0;

  const sanitized = source.replace(/[^\d,.-]/g, '');
  let normalized: string;

  if (sanitized.includes(',')) {
    normalized = sanitized.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d+\.\d{1,2}$/.test(sanitized)) {
    normalized = sanitized;
  } else {
    normalized = sanitized.replace(/\./g, '');
  }

  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

/** Formats a finite number in Brazilian reais. */
export function formatBRL(value: number | null | undefined): string {
  return formatCurrencyValue(value) || brlFormatter.format(0);
}

/** Makes names, documents, phones and plates comparable in free-text searches. */
export function normalizeSearchText(value: MaskInput): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]/g, '');
}
