import { useState, useCallback, useRef, useEffect } from 'react';

interface UseFieldOptions<T> {
  initialValue: T;
  defaultValue: T;
  onValueChange: (value: T) => void;
  validate?: (value: T) => boolean;
  parse?: (input: string) => T;
  stringify?: (value: T) => string;
  allowEmpty?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const useField = <T>({
  initialValue,
  defaultValue,
  onValueChange,
  validate,
  parse,
  stringify = (v) => String(v),
  allowEmpty = true,
  min,
  max,
  step = 1
}: UseFieldOptions<T>) => {
  const [localValue, setLocalValue] = useState(stringify(initialValue));
  const [isFocused, setIsFocused] = useState(false);
  const [previousValidValue, setPreviousValidValue] = useState(initialValue);
  const hasUserInteractedRef = useRef(false);

  // Default validation
  const defaultValidate = useCallback((value: T): boolean => {
    if (typeof value === 'string' && !allowEmpty && value.trim() === '') return false;
    if (typeof value === 'number' && isNaN(value as any)) return false;
    if (typeof value === 'number' && min !== undefined && value < min) return false;
    if (typeof value === 'number' && max !== undefined && value > max) return false;
    return true;
  }, [allowEmpty, min, max]);

  const validationFn = validate || defaultValidate;

  // Update local value when initial value changes (e.g., from external state)
  useEffect(() => {
    if (!isFocused && !hasUserInteractedRef.current) {
      setLocalValue(stringify(initialValue));
      setPreviousValidValue(initialValue);
    }
  }, [initialValue, isFocused, stringify]);

  // Immediate update for calculations - always sends valid data
  const immediateUpdate = useCallback((value: T) => {
    if (validationFn(value)) {
      onValueChange(value);
      setPreviousValidValue(value);
    }
  }, [onValueChange, validationFn]);

  const handleChange = useCallback((inputValue: string) => {
    hasUserInteractedRef.current = true;
    setLocalValue(inputValue);
    
    // Parse the input value
    const parsedValue = parse ? parse(inputValue) : (inputValue as unknown as T);
    
    // Always update immediately for data consistency
    immediateUpdate(parsedValue);
  }, [immediateUpdate, parse]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    hasUserInteractedRef.current = false;
    
    // Parse the current value
    const parsedValue = parse ? parse(localValue) : (localValue as unknown as T);
    
    // Validate and potentially restore previous valid value on blur
    if (localValue === '' || !validationFn(parsedValue)) {
      const finalValue = localValue === '' 
        ? (previousValidValue || defaultValue)
        : (previousValidValue || defaultValue);
      setLocalValue(stringify(finalValue));
      onValueChange(finalValue);
    } else {
      setPreviousValidValue(parsedValue);
      onValueChange(parsedValue);
    }
  }, [localValue, validationFn, previousValidValue, defaultValue, onValueChange, parse, stringify]);

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
