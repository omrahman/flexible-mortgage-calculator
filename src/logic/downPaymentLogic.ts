import type { DownPaymentInput } from '../types';

export const convertDownPayment = (
  downPayment: DownPaymentInput,
  newType: 'percentage' | 'amount',
  homePrice: string,
  isFocused: boolean
): DownPaymentInput => {
  if (newType === downPayment.type) {
    return downPayment;
  }

  const homePriceNum = parseFloat(homePrice) || 0;
  const currentValue = parseFloat(downPayment.value) || 0;
  let newValue: string;

  if (newType === 'percentage') {
    // Converting from dollar amount to percentage
    if (homePriceNum > 0 && currentValue > 0) {
      const percentage = (currentValue / homePriceNum) * 100;
      newValue = percentage > 0 ? percentage.toFixed(1) : '0';
    } else {
      newValue = isFocused ? '0' : '20';
    }
  } else {
    // Converting from percentage to dollar amount
    if (homePriceNum > 0 && currentValue > 0) {
      const dollarAmount = homePriceNum * (currentValue / 100);
      newValue = Math.round(dollarAmount).toString();
    } else {
      newValue = isFocused ? '0' : '200000';
    }
  }

  return {
    ...downPayment,
    type: newType,
    value: newValue,
  };
};
