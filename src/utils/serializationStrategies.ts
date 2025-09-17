import {
  LoanConfigurationSchema,
  CachedInputs,
  RecurringFrequency,
  DownPaymentType,
  ExtraItem,
} from '../types';
import {
  SCHEMA_VERSION,
  APPLICATION_NAME,
  APPLICATION_VERSION,
  DEFAULT_HOME_PRICE,
  DEFAULT_DOWN_PAYMENT,
  DEFAULT_INTEREST_RATE,
  DEFAULT_TERM_YEARS,
  DEFAULT_PROPERTY_TAX_ANNUAL,
  DEFAULT_INSURANCE_ANNUAL,
  DEFAULT_AUTORECAST,
} from '../constants';

export interface SerializationStrategy {
  serialize(inputs: CachedInputs): unknown;
  deserialize(data: unknown): LoanConfigurationSchema;
  getVersion(): string | null;
}

// Lean format v2 (current)
const LF2_VERSION = '2';
const LF2_VERSION_KEY = 'v';
const LF2_HOME_PRICE = 'h';
const LF2_DOWN_PAYMENT_TYPE = 't';
const LF2_DOWN_PAYMENT_VALUE = 'd';
const LF2_INTEREST_RATE = 'i';
const LF2_TERM_YEARS = 'y';
const LF2_START_DATE = 's';
const LF2_PROPERTY_TAX = 'p';
const LF2_INSURANCE = 'n';
const LF2_AUTORECAST = 'a';
const LF2_RECAST_MONTHS = 'r';
const LF2_EXTRAS = 'e';

const EI_MONTH = 0;
const EI_AMOUNT = 1;
const EI_IS_RECURRING = 2;
const EI_RECURRING_QTY = 3;
const EI_RECURRING_FREQ = 4;
const EI_IS_FORGIVENESS = 5;

export class LeanV2Strategy implements SerializationStrategy {
  getVersion() {
    return LF2_VERSION;
  }

  serialize(inputs: CachedInputs): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    obj[LF2_VERSION_KEY] = this.getVersion();

    if (inputs.homePrice !== DEFAULT_HOME_PRICE) obj[LF2_HOME_PRICE] = parseFloat(inputs.homePrice);
    if (inputs.downPayment.type !== (DEFAULT_DOWN_PAYMENT.type as string)) obj[LF2_DOWN_PAYMENT_TYPE] = inputs.downPayment.type === 'percentage' ? 'p' : 'a';
    if (inputs.downPayment.value !== DEFAULT_DOWN_PAYMENT.value) obj[LF2_DOWN_PAYMENT_VALUE] = parseFloat(inputs.downPayment.value);
    if (inputs.rate !== DEFAULT_INTEREST_RATE) obj[LF2_INTEREST_RATE] = parseFloat(inputs.rate);
    if (inputs.termYears !== DEFAULT_TERM_YEARS) obj[LF2_TERM_YEARS] = parseInt(inputs.termYears, 10);
    
    const [year, month] = inputs.startYM.split('-').map(Number);
    obj[LF2_START_DATE] = (year - 2000) * 12 + (month - 1);

    if (inputs.propertyTaxAnnual !== DEFAULT_PROPERTY_TAX_ANNUAL) obj[LF2_PROPERTY_TAX] = parseFloat(inputs.propertyTaxAnnual);
    if (inputs.insuranceAnnual !== DEFAULT_INSURANCE_ANNUAL) obj[LF2_INSURANCE] = parseFloat(inputs.insuranceAnnual);
    if (inputs.autoRecast !== DEFAULT_AUTORECAST) obj[LF2_AUTORECAST] = inputs.autoRecast ? 1 : 0;
    
    const recastMonths = this.parseRecastMonths(inputs.recastMonthsText || '');
    if (recastMonths.length > 0) {
      obj[LF2_RECAST_MONTHS] = recastMonths.join(',');
    }

    if (inputs.extras.length > 0) {
      obj[LF2_EXTRAS] = inputs.extras.map(e => {
        const extraArr: unknown[] = [];
        extraArr[EI_MONTH] = e.month;
        extraArr[EI_AMOUNT] = e.amount;
        if (e.isRecurring) {
          extraArr[EI_IS_RECURRING] = 1;
          extraArr[EI_RECURRING_QTY] = e.recurringQuantity;
          extraArr[EI_RECURRING_FREQ] = e.recurringFrequency === 'monthly' ? 'm' : 'a';
        }
        if (e.isForgiveness) {
          extraArr[EI_IS_FORGIVENESS] = 1;
        }
        return extraArr;
      });
    }
    
    return obj;
  }

  deserialize(data: unknown): LoanConfigurationSchema {
    const obj = data as Record<string, unknown>;
    const extras: ExtraItem[] = ((obj[LF2_EXTRAS] as unknown[][]) || []).map((e: unknown[], index: number): ExtraItem => ({
      id: `extra-${index}`,
      month: e[EI_MONTH] as number,
      amount: e[EI_AMOUNT] as number,
      isRecurring: e[EI_IS_RECURRING] === 1,
      recurringQuantity: e[EI_RECURRING_QTY] as number,
      recurringFrequency: (e[EI_RECURRING_FREQ] === 'm' ? 'monthly' : 'annually') as RecurringFrequency,
      isForgiveness: e[EI_IS_FORGIVENESS] === 1,
    }));

    const forgivenessPayments = extras.filter(e => e.isForgiveness);
    const extraPayments = extras.filter(e => !e.isForgiveness);

    const startMonth = (obj[LF2_START_DATE] as number) % 12 + 1;
    const startYear = Math.floor((obj[LF2_START_DATE] as number) / 12) + 2000;
    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}`;

    const downPaymentType: DownPaymentType = obj[LF2_DOWN_PAYMENT_TYPE]
      ? (obj[LF2_DOWN_PAYMENT_TYPE] === 'p' ? 'percentage' : 'amount')
      : DEFAULT_DOWN_PAYMENT.type;

    return {
      version: SCHEMA_VERSION,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: `${APPLICATION_NAME} v${APPLICATION_VERSION}`,
      },
      loan: {
        homePrice: (obj[LF2_HOME_PRICE] as number)?.toString() ?? DEFAULT_HOME_PRICE,
        downPayment: {
          type: downPaymentType,
          value: (obj[LF2_DOWN_PAYMENT_VALUE] as number)?.toString() ?? DEFAULT_DOWN_PAYMENT.value,
        },
        interestRate: (obj[LF2_INTEREST_RATE] as number)?.toString() ?? DEFAULT_INTEREST_RATE,
        termYears: (obj[LF2_TERM_YEARS] as number)?.toString() ?? DEFAULT_TERM_YEARS,
        startDate,
        propertyTaxAnnual: (obj[LF2_PROPERTY_TAX] as number)?.toString() ?? DEFAULT_PROPERTY_TAX_ANNUAL,
        insuranceAnnual: (obj[LF2_INSURANCE] as number)?.toString() ?? DEFAULT_INSURANCE_ANNUAL,
      },
      extraPayments,
      forgivenessPayments,
      recastSettings: {
        autoRecast: Object.prototype.hasOwnProperty.call(obj, LF2_AUTORECAST) ? obj[LF2_AUTORECAST] === 1 : DEFAULT_AUTORECAST,
        recastMonths: obj[LF2_RECAST_MONTHS] ? (obj[LF2_RECAST_MONTHS] as string).split(',').map(Number) : [],
      },
      displaySettings: {
        showAll: false,
      },
    };
  }

  private parseRecastMonths(text: string): number[] {
    if (!text.trim()) return [];
    return text.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
  }
}

// Lean format v1 (legacy)
const LF1_VERSION = '1';

export class LeanV1Strategy implements SerializationStrategy {
  getVersion() {
    return LF1_VERSION;
  }

  serialize(inputs: CachedInputs): unknown[] {
    // Note: v1 serialization is preserved for testing/legacy purposes if needed,
    // but new share links will use v2.
    const arr: unknown[] = [];
    arr[0] = this.getVersion();
    arr[1] = inputs.homePrice;
    arr[2] = inputs.downPayment.type === 'percentage' ? 'p' : 'a';
    arr[3] = inputs.downPayment.value;
    arr[4] = inputs.rate;
    arr[5] = inputs.termYears;
    arr[6] = inputs.startYM;
    arr[7] = inputs.propertyTaxAnnual;
    arr[8] = inputs.insuranceAnnual;
    arr[9] = inputs.autoRecast ? 1 : 0;
    const recastMonths = this.parseRecastMonths(inputs.recastMonthsText || '');
    if (recastMonths.length > 0) {
      arr[10] = recastMonths.join(',');
    }
    if (inputs.extras.length > 0) {
      arr[11] = inputs.extras.map(e => {
        const extraArr: unknown[] = [];
        extraArr[EI_MONTH] = e.month;
        extraArr[EI_AMOUNT] = e.amount;
        if (e.isRecurring) {
          extraArr[EI_IS_RECURRING] = 1;
          extraArr[EI_RECURRING_QTY] = e.recurringQuantity;
          extraArr[EI_RECURRING_FREQ] = e.recurringFrequency === 'monthly' ? 'm' : 'a';
        }
        if (e.isForgiveness) {
          extraArr[EI_IS_FORGIVENESS] = 1;
        }
        return extraArr;
      });
    }
    return arr;
  }

  deserialize(data: unknown): LoanConfigurationSchema {
    const arr = data as unknown[];
    const extras: ExtraItem[] = ((arr[11] as unknown[][]) || []).map((e: unknown[], index: number): ExtraItem => ({
      id: `extra-${index}`,
      month: e[0] as number,
      amount: e[1] as number,
      isRecurring: e[2] === 1,
      recurringQuantity: e[3] as number,
      recurringFrequency: (e[4] === 'm' ? 'monthly' : 'annually') as RecurringFrequency,
      isForgiveness: e[5] === 1,
    }));

    const forgivenessPayments = extras.filter(e => e.isForgiveness);
    const extraPayments = extras.filter(e => !e.isForgiveness);

    return {
      version: SCHEMA_VERSION,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: `${APPLICATION_NAME} v${APPLICATION_VERSION}`,
      },
      loan: {
        homePrice: String(arr[1]),
        downPayment: {
          type: (arr[2] === 'p' ? 'percentage' : 'amount') as DownPaymentType,
          value: String(arr[3]),
        },
        interestRate: String(arr[4]),
        termYears: String(arr[5]),
        startDate: String(arr[6]),
        propertyTaxAnnual: String(arr[7] || '0'),
        insuranceAnnual: String(arr[8] || '0'),
      },
      extraPayments,
      forgivenessPayments,
      recastSettings: {
        autoRecast: arr[9] === 1,
        recastMonths: arr[10] ? String(arr[10]).split(',').map(Number) : [],
      },
      displaySettings: {
        showAll: false,
      },
    };
  }

  private parseRecastMonths(text: string): number[] {
    if (!text.trim()) return [];
    return text.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
  }
}

export class FullJsonStrategy implements SerializationStrategy {
  getVersion() {
    return null; // Not versioned
  }

  serialize(inputs: CachedInputs): LoanConfigurationSchema {
    const recastMonths = this.parseRecastMonths(inputs.recastMonthsText || '');
    const extras = (inputs.extras || []).map(e => ({
      ...e,
      isRecurring: !!e.isRecurring,
      isForgiveness: !!e.isForgiveness,
    }));
    const forgivenessPayments = extras.filter(e => e.isForgiveness);
    const extraPayments = extras.filter(e => !e.isForgiveness);

    return {
      version: SCHEMA_VERSION,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: `${APPLICATION_NAME} v${APPLICATION_VERSION}`,
      },
      loan: {
        homePrice: inputs.homePrice,
        downPayment: inputs.downPayment,
        interestRate: inputs.rate,
        termYears: inputs.termYears,
        startDate: inputs.startYM,
        propertyTaxAnnual: inputs.propertyTaxAnnual,
        insuranceAnnual: inputs.insuranceAnnual,
      },
      extraPayments,
      forgivenessPayments,
      recastSettings: {
        autoRecast: inputs.autoRecast,
        recastMonths,
      },
      displaySettings: {
        showAll: inputs.showAll,
      },
    };
  }

  deserialize(schema: LoanConfigurationSchema): LoanConfigurationSchema {
    // The schema is already in the desired format
    return schema;
  }

  private parseRecastMonths(text: string): number[] {
    if (!text.trim()) return [];
    return text.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
  }
}

const BIT_MANIPULATION_VERSION = '3';

// Bit allocation
const VERSION_BITS = 4;
const HOME_PRICE_BITS = 24; // Up to 16.7M
const DP_VALUE_BITS = 20; // Up to 1M
const DP_TYPE_BITS = 1; // 0 for %, 1 for amount
const INTEREST_RATE_BITS = 12; // up to 40.95% in increments of 0.01
const TERM_YEARS_BITS = 6; // up to 63
const START_DATE_BITS = 12; // 4095 months, ~341 years from 2000
const TAX_BITS = 16; // up to 65k
const INSURANCE_BITS = 16; // up to 65k
const AUTORECAST_BITS = 1;
const EXTRAS_COUNT_BITS = 4;

const EXTRA_MONTH_BITS = 10; // 1023 months, ~85 years
const EXTRA_AMOUNT_BITS = 20; // Up to 1M
const EXTRA_IS_RECURRING_BITS = 1;
const EXTRA_RECURRING_QTY_BITS = 10; // 1023
const EXTRA_RECURRING_FREQ_BITS = 1;
const EXTRA_IS_FORGIVENESS_BITS = 1;

class BitWriter {
  private buffer: Uint8Array;
  private byteIndex = 0;
  private bitIndex = 0;

  constructor(size: number) {
    this.buffer = new Uint8Array(size);
  }

  write(value: number, numBits: number) {
    for (let i = numBits - 1; i >= 0; i--) {
      const bit = (value >> i) & 1;
      if (bit === 1) {
        this.buffer[this.byteIndex] |= (1 << (7 - this.bitIndex));
      }
      this.bitIndex++;
      if (this.bitIndex === 8) {
        this.bitIndex = 0;
        this.byteIndex++;
      }
    }
  }

  getBuffer(): Uint8Array {
    return this.buffer;
  }
}

class BitReader {
  private buffer: Uint8Array;
  private byteIndex = 0;
  private bitIndex = 0;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
  }

  read(numBits: number): number {
    let value = 0;
    for (let i = 0; i < numBits; i++) {
      const bit = (this.buffer[this.byteIndex] >> (7 - this.bitIndex)) & 1;
      value = (value << 1) | bit;
      this.bitIndex++;
      if (this.bitIndex === 8) {
        this.bitIndex = 0;
        this.byteIndex++;
      }
    }
    return value;
  }
}

export class BitManipulationStrategy implements SerializationStrategy {
  getVersion() {
    return BIT_MANIPULATION_VERSION;
  }

  serialize(inputs: CachedInputs): number[] {
    const extras = inputs.extras.slice(0, 15); // Max 15 extras
    const numExtras = extras.length;
    const totalBits = VERSION_BITS + HOME_PRICE_BITS + DP_VALUE_BITS + DP_TYPE_BITS + 
      INTEREST_RATE_BITS + TERM_YEARS_BITS + START_DATE_BITS + TAX_BITS + 
      INSURANCE_BITS + AUTORECAST_BITS + EXTRAS_COUNT_BITS + 
      numExtras * (EXTRA_MONTH_BITS + EXTRA_AMOUNT_BITS + EXTRA_IS_RECURRING_BITS + 
      EXTRA_RECURRING_QTY_BITS + EXTRA_RECURRING_FREQ_BITS + EXTRA_IS_FORGIVENESS_BITS);
      
    const bufferSize = Math.ceil(totalBits / 8);
    const writer = new BitWriter(bufferSize);

    writer.write(parseInt(this.getVersion()!, 10), VERSION_BITS);
    writer.write(Math.round(parseFloat(inputs.homePrice)), HOME_PRICE_BITS);
    writer.write(Math.round(parseFloat(inputs.downPayment.value)), DP_VALUE_BITS);
    writer.write(inputs.downPayment.type === 'percentage' ? 0 : 1, DP_TYPE_BITS);
    writer.write(Math.round(parseFloat(inputs.rate) * 100), INTEREST_RATE_BITS);
    writer.write(parseInt(inputs.termYears, 10), TERM_YEARS_BITS);
    
    const [year, month] = inputs.startYM.split('-').map(Number);
    writer.write((year - 2000) * 12 + (month - 1), START_DATE_BITS);

    writer.write(Math.round(parseFloat(inputs.propertyTaxAnnual)), TAX_BITS);
    writer.write(Math.round(parseFloat(inputs.insuranceAnnual)), INSURANCE_BITS);
    writer.write(inputs.autoRecast ? 1 : 0, AUTORECAST_BITS);
    writer.write(numExtras, EXTRAS_COUNT_BITS);

    extras.forEach(extra => {
      writer.write(extra.month, EXTRA_MONTH_BITS);
      writer.write(Math.round(extra.amount), EXTRA_AMOUNT_BITS);
      writer.write(extra.isRecurring ? 1 : 0, EXTRA_IS_RECURRING_BITS);
      writer.write(extra.recurringQuantity || 0, EXTRA_RECURRING_QTY_BITS);
      writer.write(extra.recurringFrequency === 'monthly' ? 0 : 1, EXTRA_RECURRING_FREQ_BITS);
      writer.write(extra.isForgiveness ? 1 : 0, EXTRA_IS_FORGIVENESS_BITS);
    });

    return Array.from(writer.getBuffer());
  }
  
  deserialize(data: unknown): LoanConfigurationSchema {
    const buffer = new Uint8Array(data as number[]);
    const reader = new BitReader(buffer);
    
    reader.read(VERSION_BITS); // Skip version
    
    const homePrice = reader.read(HOME_PRICE_BITS).toString();
    const dpValue = reader.read(DP_VALUE_BITS).toString();
    const dpType: DownPaymentType = reader.read(DP_TYPE_BITS) === 0 ? 'percentage' : 'amount';
    const interestRate = (reader.read(INTEREST_RATE_BITS) / 100).toString();
    const termYears = reader.read(TERM_YEARS_BITS).toString();
    
    const dateVal = reader.read(START_DATE_BITS);
    const startYear = Math.floor(dateVal / 12) + 2000;
    const startMonth = (dateVal % 12) + 1;
    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}`;
    
    const propertyTaxAnnual = reader.read(TAX_BITS).toString();
    const insuranceAnnual = reader.read(INSURANCE_BITS).toString();
    const autoRecast = reader.read(AUTORECAST_BITS) === 1;
    const numExtras = reader.read(EXTRAS_COUNT_BITS);

    const extras: ExtraItem[] = [];
    for (let i = 0; i < numExtras; i++) {
      extras.push({
        id: `extra-${i}`,
        month: reader.read(EXTRA_MONTH_BITS),
        amount: reader.read(EXTRA_AMOUNT_BITS),
        isRecurring: reader.read(EXTRA_IS_RECURRING_BITS) === 1,
        recurringQuantity: reader.read(EXTRA_RECURRING_QTY_BITS),
        recurringFrequency: (reader.read(EXTRA_RECURRING_FREQ_BITS) === 0 ? 'monthly' : 'annually') as RecurringFrequency,
        isForgiveness: reader.read(EXTRA_IS_FORGIVENESS_BITS) === 1,
      });
    }

    const forgivenessPayments = extras.filter(e => e.isForgiveness);
    const extraPayments = extras.filter(e => !e.isForgiveness);
    
    return {
      version: SCHEMA_VERSION,
      metadata: { exportedAt: new Date().toISOString(), exportedBy: `${APPLICATION_NAME} v${APPLICATION_VERSION}` },
      loan: {
        homePrice,
        downPayment: { type: dpType, value: dpValue },
        interestRate,
        termYears,
        startDate,
        propertyTaxAnnual,
        insuranceAnnual,
      },
      extraPayments,
      forgivenessPayments,
      recastSettings: { autoRecast, recastMonths: [] },
      displaySettings: { showAll: false },
    };
  }
}

class StrategyManager {
  private strategies: Record<string, SerializationStrategy>;
  private defaultStrategy: SerializationStrategy;

  constructor() {
    const leanV1 = new LeanV1Strategy();
    const leanV2 = new LeanV2Strategy();
    const bitManipulation = new BitManipulationStrategy();
    
    this.strategies = {
      [leanV1.getVersion()!]: leanV1,
      [leanV2.getVersion()!]: leanV2,
      [bitManipulation.getVersion()!]: bitManipulation,
    };
    
    this.defaultStrategy = bitManipulation; // Bit manipulation is the new default
  }

  getStrategyForExport(): SerializationStrategy {
    return this.defaultStrategy;
  }

  getStrategyForImport(data: unknown): SerializationStrategy {
    if (typeof data === 'object' && data !== null) {
      if (Object.prototype.hasOwnProperty.call(data, 'v')) {
        return this.strategies[(data as {v: string}).v] || this.defaultStrategy;
      }
      if (Array.isArray(data) && typeof data[0] === 'number') {
        // V3 (bit manipulation) is stored as an array of numbers.
        // The first 4 bits of the first number are the version.
        const version = data[0] >> 4;
        return this.strategies[version] || this.defaultStrategy;
      }
      if (Array.isArray(data)) {
        return this.strategies[data[0]] || new LeanV1Strategy();
      }
    }
    return new FullJsonStrategy(); // Fallback for old, non-versioned JSON
  }
}

export const strategyManager = new StrategyManager();
