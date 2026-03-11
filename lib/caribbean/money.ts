/**
 * Money value object — GYD-first, multi-currency.
 *
 * Mirrored from the backend. All monetary arithmetic uses integer cents
 * internally to avoid floating-point rounding errors.
 */

import { DEFAULT_CURRENCY, type CaribbeanCurrency, SUPPORTED_CURRENCIES } from "./constants";

// ─── Currency metadata ───────────────────────────────────────────────────────

interface CurrencyInfo {
  symbol: string;
  decimals: number;
  locale: string;
}

const CURRENCY_INFO: Record<CaribbeanCurrency, CurrencyInfo> = {
  GYD: { symbol: "GY$", decimals: 2, locale: "en-GY" },
  USD: { symbol: "$",   decimals: 2, locale: "en-US" },
  TTD: { symbol: "TT$", decimals: 2, locale: "en-TT" },
  BBD: { symbol: "BD$", decimals: 2, locale: "en-BB" },
  JMD: { symbol: "J$",  decimals: 2, locale: "en-JM" },
  XCD: { symbol: "EC$", decimals: 2, locale: "en-AG" },
};

// ─── Money class ─────────────────────────────────────────────────────────────

export class Money {
  private readonly cents: number;
  readonly currency: CaribbeanCurrency;

  private constructor(cents: number, currency: CaribbeanCurrency) {
    if (!Number.isFinite(cents)) {
      throw new Error(`Money: amount must be finite, got ${cents}`);
    }
    if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(currency)) {
      throw new Error(`Money: unsupported currency "${currency}"`);
    }
    this.cents = Math.round(cents);
    this.currency = currency;
  }

  static of(amount: number, currency: CaribbeanCurrency = DEFAULT_CURRENCY): Money {
    const info = CURRENCY_INFO[currency];
    return new Money(Math.round(amount * 10 ** info.decimals), currency);
  }

  static zero(currency: CaribbeanCurrency = DEFAULT_CURRENCY): Money {
    return new Money(0, currency);
  }

  static fromCents(cents: number, currency: CaribbeanCurrency = DEFAULT_CURRENCY): Money {
    return new Money(cents, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents - other.cents, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.cents * factor), this.currency);
  }

  divide(divisor: number): Money {
    if (divisor === 0) throw new Error("Money: cannot divide by zero");
    return new Money(Math.round(this.cents / divisor), this.currency);
  }

  negate(): Money { return new Money(-this.cents, this.currency); }
  abs(): Money { return new Money(Math.abs(this.cents), this.currency); }

  isZero(): boolean { return this.cents === 0; }
  isPositive(): boolean { return this.cents > 0; }
  isNegative(): boolean { return this.cents < 0; }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.cents === other.cents;
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents > other.cents;
  }

  lessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents < other.cents;
  }

  get amount(): number {
    const info = CURRENCY_INFO[this.currency];
    return this.cents / 10 ** info.decimals;
  }

  toCents(): number { return this.cents; }

  format(): string {
    const info = CURRENCY_INFO[this.currency];
    const formatted = this.amount.toLocaleString("en-US", {
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    });
    return `${info.symbol} ${formatted}`;
  }

  toJSON(): { amount: number; currency: CaribbeanCurrency } {
    return { amount: this.amount, currency: this.currency };
  }

  toString(): string { return this.format(); }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Money: cannot combine ${this.currency} with ${other.currency}. Convert first.`);
    }
  }
}

export { CURRENCY_INFO };
