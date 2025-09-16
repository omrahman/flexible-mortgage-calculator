import { useState, useCallback, useRef, useEffect } from 'react';

interface UseRobustNumberFieldOptions {
  initialValue: number;
  defaultValue: number;
  onValueChange: (value: number) => void;
  validate?: (value: number) => boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const useRobustNumberField = ({
  initialValue,
  defaultValue,
  onValueChange,
  validate,
  min,
  max,
  step = 1
}: UseRobustNumberFieldOptions) => {
  const [localValue, setLocalValue] = useState(initialValue.toString());
  const [isFocused, setIsFocused] = useState(false);
  const [previousValidValue, setPreviousValidValue] = useState(initialValue);
  const hasUserInteractedRef = useRef(false);

  // Default validation for numbers
  const defaultValidate = useCallback((value: number): boolean => {
    if (isNaN(value)) return false;
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;
    return true;
  }, [min, max]);

  const validationFn = validate || defaultValidate;

  // Update local value when initial value changes (e.g., from external state)
  useEffect(() => {
    if (!isFocused && !hasUserInteractedRef.current) {
      setLocalValue(initialValue.toString());
      setPreviousValidValue(initialValue);
    }
  }, [initialValue, isFocused]);

  // Immediate update for calculations - always sends valid data
  const immediateUpdate = useCallback((value: number) => {
    if (validationFn(value)) {
      onValueChange(value);
      setPreviousValidValue(value);
    }
  }, [onValueChange, validationFn]);

  const handleChange = useCallback((value: string) => {
    hasUserInteractedRef.current = true;
    setLocalValue(value);
    
    // Parse the numeric value
    const numValue = value === '' ? 0 : parseFloat(value);
    
    // Always update immediately for data consistency
    immediateUpdate(numValue);
  }, [immediateUpdate]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    hasUserInteractedRef.current = false;
    
    // Parse the numeric value
    const numValue = localValue === '' ? 0 : parseFloat(localValue);
    
    // Validate and potentially restore previous valid value on blur
    if (localValue === '' || !validationFn(numValue)) {
      const finalValue = localValue === '' 
        ? (previousValidValue || defaultValue)
        : (previousValidValue || defaultValue);
      setLocalValue(finalValue.toString());
      onValueChange(finalValue);
    } else {
      setPreviousValidValue(numValue);
      onValueChange(numValue);
    }
  }, [localValue, validationFn, previousValidValue, defaultValue, onValueChange]);

  return {
    value: localValue,
    isFocused,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    min,
    max,
    step
  };
};
