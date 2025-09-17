import { convertDownPayment } from '../downPaymentLogic';
import type { DownPaymentInput } from '../../types';

describe('convertDownPayment', () => {
  const homePrice = '500000';

  it('should not convert if the new type is the same as the old type', () => {
    const dp: DownPaymentInput = { type: 'percentage', value: '20' };
    const result = convertDownPayment(dp, 'percentage', homePrice, false);
    expect(result).toEqual(dp);
  });

  it('should convert from percentage to amount', () => {
    const dp: DownPaymentInput = { type: 'percentage', value: '20' };
    const result = convertDownPayment(dp, 'amount', homePrice, false);
    expect(result.type).toBe('amount');
    expect(result.value).toBe('100000');
  });

  it('should convert from amount to percentage', () => {
    const dp: DownPaymentInput = { type: 'amount', value: '100000' };
    const result = convertDownPayment(dp, 'percentage', homePrice, false);
    expect(result.type).toBe('percentage');
    expect(result.value).toBe('20.0');
  });

  it('should handle zero home price when converting to percentage', () => {
    const dp: DownPaymentInput = { type: 'amount', value: '100000' };
    const result = convertDownPayment(dp, 'percentage', '0', false);
    expect(result.type).toBe('percentage');
    expect(result.value).toBe('20');
  });

  it('should handle zero home price when converting to amount', () => {
    const dp: DownPaymentInput = { type: 'percentage', value: '20' };
    const result = convertDownPayment(dp, 'amount', '0', false);
    expect(result.type).toBe('amount');
    expect(result.value).toBe('200000');
  });

  it('should use focused default value when converting with zero home price and input is focused', () => {
    const dp: DownPaymentInput = { type: 'percentage', value: '20' };
    const result = convertDownPayment(dp, 'amount', '0', true);
    expect(result.type).toBe('amount');
    expect(result.value).toBe('0');
  });
});
