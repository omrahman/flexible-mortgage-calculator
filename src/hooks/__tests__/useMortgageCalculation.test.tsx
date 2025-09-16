import { renderHook, act } from '@testing-library/react';
import { useMortgageCalculation } from '../useMortgageCalculation';
import type { CachedInputs, DownPaymentInput } from '../../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the useLocalStorage hook
jest.mock('../useLocalStorage', () => ({
  useLocalStorage: jest.fn(),
}));

import { useLocalStorage } from '../useLocalStorage';

const mockUseLocalStorage = useLocalStorage as jest.MockedFunction<typeof useLocalStorage>;

describe('useMortgageCalculation', () => {
  const defaultInputs: CachedInputs = {
    homePrice: '1000000',
    downPayment: { type: 'percentage', value: '20' },
    rate: '4.85',
    termYears: '30',
    startYM: '2024-01',
    propertyTaxAnnual: '12000',
    insuranceAnnual: '2400',
    extras: [],
    autoRecast: true,
    showAll: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalStorage.mockReturnValue([defaultInputs, jest.fn(), jest.fn()]);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMortgageCalculation());

    expect(result.current.homePrice).toBe('1000000');
    expect(result.current.downPayment).toEqual({ type: 'percentage', value: '20' });
    expect(result.current.rate).toBe('4.85');
    expect(result.current.termYears).toBe('30');
    expect(result.current.principal).toBe(800000); // 80% of $1M
  });

  it('should calculate principal correctly for percentage down payment', () => {
    const { result } = renderHook(() => useMortgageCalculation());

    expect(result.current.principal).toBe(800000); // 80% of $1M

    // Mock the setter to actually update the cached inputs
    const mockSetCachedInputs = jest.fn();
    mockUseLocalStorage.mockReturnValue([defaultInputs, mockSetCachedInputs, jest.fn()]);

    act(() => {
      result.current.setHomePrice('500000');
    });

    // The principal calculation should be triggered by the state change
    // We need to re-render to get the updated value
    const { result: updatedResult } = renderHook(() => useMortgageCalculation());
    expect(updatedResult.current.principal).toBe(400000); // 80% of $500K
  });

  it('should calculate principal correctly for dollar down payment', () => {
    const inputsWithDollarDown: CachedInputs = {
      ...defaultInputs,
      downPayment: { type: 'dollar', value: '100000' },
    };

    mockUseLocalStorage.mockReturnValue([inputsWithDollarDown, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useMortgageCalculation());

    expect(result.current.principal).toBe(900000); // $1M - $100K
  });

  it('should calculate monthly PITI correctly', () => {
    const { result } = renderHook(() => useMortgageCalculation());

    expect(result.current.monthlyPITI.propertyTax).toBe(1000); // $12K / 12
    expect(result.current.monthlyPITI.insurance).toBe(200); // $2.4K / 12
    expect(result.current.monthlyPITI.total).toBe(1200); // $1K + $200
  });

  it('should handle extra payments correctly', () => {
    const inputsWithExtras: CachedInputs = {
      ...defaultInputs,
      extras: [
        { id: '1', month: 6, amount: 10000 },
        { id: '2', month: 12, amount: 5000 },
      ],
    };

    mockUseLocalStorage.mockReturnValue([inputsWithExtras, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useMortgageCalculation());

    expect(result.current.extras).toHaveLength(2);
    expect(result.current.extras[0].month).toBe(6);
    expect(result.current.extras[0].amount).toBe(10000);
  });

  it('should handle recurring extra payments', () => {
    const inputsWithRecurring: CachedInputs = {
      ...defaultInputs,
      extras: [
        {
          id: '1',
          month: 6,
          amount: 1000,
          isRecurring: true,
          recurringQuantity: 12,
          recurringFrequency: 'monthly',
        },
      ],
    };

    mockUseLocalStorage.mockReturnValue([inputsWithRecurring, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useMortgageCalculation());

    expect(result.current.extras[0].isRecurring).toBe(true);
    expect(result.current.extras[0].recurringQuantity).toBe(12);
    expect(result.current.extras[0].recurringFrequency).toBe('monthly');
  });

  it('should update home price correctly', () => {
    const mockSetCachedInputs = jest.fn();
    mockUseLocalStorage.mockReturnValue([defaultInputs, mockSetCachedInputs, jest.fn()]);

    const { result } = renderHook(() => useMortgageCalculation());

    act(() => {
      result.current.setHomePrice('750000');
    });

    expect(mockSetCachedInputs).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('should update down payment correctly', () => {
    const mockSetCachedInputs = jest.fn();
    mockUseLocalStorage.mockReturnValue([defaultInputs, mockSetCachedInputs, jest.fn()]);

    const { result } = renderHook(() => useMortgageCalculation());

    const newDownPayment: DownPaymentInput = { type: 'dollar', value: '150000' };

    act(() => {
      result.current.setDownPayment(newDownPayment);
    });

    expect(mockSetCachedInputs).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('should handle extra payment operations', () => {
    const mockSetCachedInputs = jest.fn();
    mockUseLocalStorage.mockReturnValue([defaultInputs, mockSetCachedInputs, jest.fn()]);

    const { result } = renderHook(() => useMortgageCalculation());

    // Add extra payment
    act(() => {
      result.current.handleAddExtra();
    });

    expect(mockSetCachedInputs).toHaveBeenCalledWith(
      expect.any(Function)
    );

    // Remove extra payment
    act(() => {
      result.current.handleRemoveExtra('test-id');
    });

    expect(mockSetCachedInputs).toHaveBeenCalledWith(
      expect.any(Function)
    );

    // Update extra payment
    act(() => {
      result.current.handleUpdateExtra('test-id', 'amount', 5000);
    });

    expect(mockSetCachedInputs).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('should calculate interest saved and months saved', () => {
    const { result } = renderHook(() => useMortgageCalculation());

    expect(typeof result.current.interestSaved).toBe('number');
    expect(typeof result.current.monthsSaved).toBe('number');
    expect(result.current.interestSaved).toBeGreaterThanOrEqual(0);
    expect(result.current.monthsSaved).toBeGreaterThanOrEqual(0);
  });

  it('should handle recast months text parsing', () => {
    const inputsWithRecast: CachedInputs = {
      ...defaultInputs,
      recastMonthsText: '12, 24, 36',
    };

    mockUseLocalStorage.mockReturnValue([inputsWithRecast, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useMortgageCalculation());

    expect(result.current.recastMonthsText).toBe('12, 24, 36');
  });

  it('should handle configuration loading', () => {
    const mockSetCachedInputs = jest.fn();
    const mockSetLoadedConfigId = jest.fn();
    const mockSetOriginalInputs = jest.fn();

    mockUseLocalStorage
      .mockReturnValueOnce([defaultInputs, mockSetCachedInputs, jest.fn()])
      .mockReturnValueOnce([null, mockSetLoadedConfigId, jest.fn()])
      .mockReturnValueOnce([null, mockSetOriginalInputs, jest.fn()]);

    const { result } = renderHook(() => useMortgageCalculation());

    const configInputs: CachedInputs = {
      ...defaultInputs,
      homePrice: '750000',
    };

    act(() => {
      result.current.loadConfiguration(configInputs, 'config-1');
    });

    expect(mockSetCachedInputs).toHaveBeenCalledWith(configInputs);
    expect(mockSetLoadedConfigId).toHaveBeenCalledWith('config-1');
    expect(mockSetOriginalInputs).toHaveBeenCalledWith(configInputs);
  });

  it('should detect unsaved changes', () => {
    const originalInputs: CachedInputs = {
      ...defaultInputs,
      homePrice: '750000',
    };

    const currentInputs: CachedInputs = {
      ...defaultInputs,
      homePrice: '800000',
    };

    mockUseLocalStorage
      .mockReturnValueOnce([currentInputs, jest.fn(), jest.fn()])
      .mockReturnValueOnce(['config-1', jest.fn(), jest.fn()])
      .mockReturnValueOnce([originalInputs, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useMortgageCalculation());

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should clear all inputs', () => {
    const mockClearCachedInputs = jest.fn();
    mockUseLocalStorage.mockReturnValue([defaultInputs, jest.fn(), mockClearCachedInputs]);

    const { result } = renderHook(() => useMortgageCalculation());

    act(() => {
      result.current.clearAllInputs();
    });

    expect(mockClearCachedInputs).toHaveBeenCalled();
  });

  it('should handle migration from old data structure', () => {
    const oldInputs = {
      principal: '800000',
      rate: '4.85',
      termYears: '30',
      startYM: '2024-01',
      extras: [],
      autoRecast: true,
    };

    mockUseLocalStorage.mockReturnValue([oldInputs, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useMortgageCalculation());

    // Should migrate old structure to new structure
    expect(result.current.homePrice).toBe('800000');
    expect(result.current.downPayment).toEqual({ type: 'percentage', value: '20' });
    expect(result.current.rate).toBe('4.85');
  });

  it('should calculate term months correctly', () => {
    const { result } = renderHook(() => useMortgageCalculation());

    expect(result.current.termMonths).toBe(360); // 30 years * 12 months
  });

  it('should handle edge cases in principal calculation', () => {
    const inputsWithZeroHomePrice: CachedInputs = {
      ...defaultInputs,
      homePrice: '0',
    };

    mockUseLocalStorage.mockReturnValue([inputsWithZeroHomePrice, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useMortgageCalculation());

    expect(result.current.principal).toBe(0);
  });

  it('should handle invalid numeric inputs gracefully', () => {
    const inputsWithInvalidNumbers: CachedInputs = {
      ...defaultInputs,
      homePrice: 'invalid',
      rate: 'not-a-number',
      termYears: 'abc',
    };

    mockUseLocalStorage.mockReturnValue([inputsWithInvalidNumbers, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useMortgageCalculation());

    expect(result.current.principal).toBe(0);
    expect(result.current.termMonths).toBe(1); // Math.max(1, Math.round(0 * 12))
  });
});
