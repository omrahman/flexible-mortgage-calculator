import { useState, useCallback, useRef, useEffect } from 'react';

interface UseRobustInputFieldOptions {
  initialValue: string;
  defaultValue: string;
  onValueChange: (value: string) => void;
  validate?: (value: string) => boolean;
  allowEmpty?: boolean;
}

export const useRobustInputField = ({
  initialValue,
  defaultValue,
  onValueChange,
  validate,
  allowEmpty = true
}: UseRobustInputFieldOptions) => {
  const [localValue, setLocalValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [previousValidValue, setPreviousValidValue] = useState(initialValue);
  const hasUserInteractedRef = useRef(false);

  // Default validation for strings
  const defaultValidate = useCallback((value: string): boolean => {
    if (!allowEmpty && value.trim() === '') return false;
    return true;
  }, [allowEmpty]);

  const validationFn = validate || defaultValidate;

  // Update local value when initial value changes (e.g., from external state)
  useEffect(() => {
    if (!isFocused && !hasUserInteractedRef.current) {
      setLocalValue(initialValue);
      setPreviousValidValue(initialValue);
    }
  }, [initialValue, isFocused]);

  // Immediate update for calculations - always sends valid data
  const immediateUpdate = useCallback((value: string) => {
    if (validationFn(value) || (allowEmpty && value === '')) {
      onValueChange(value);
      if (validationFn(value)) {
        setPreviousValidValue(value);
      }
    }
  }, [onValueChange, validationFn, allowEmpty]);

  const handleChange = useCallback((value: string) => {
    hasUserInteractedRef.current = true;
    setLocalValue(value);
    
    // Always update immediately for data consistency
    immediateUpdate(value);
  }, [immediateUpdate]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    hasUserInteractedRef.current = false;
    
    // Validate and potentially restore previous valid value on blur
    if ((!allowEmpty && localValue === '') || !validationFn(localValue)) {
      const finalValue = localValue === '' 
        ? (previousValidValue || defaultValue)
        : (previousValidValue || defaultValue);
      setLocalValue(finalValue);
      onValueChange(finalValue);
    } else {
      setPreviousValidValue(localValue);
      onValueChange(localValue);
    }
  }, [localValue, validationFn, previousValidValue, defaultValue, onValueChange, allowEmpty]);

  return {
    value: localValue,
    isFocused,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
};
