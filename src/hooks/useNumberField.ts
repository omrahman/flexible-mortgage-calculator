import { useField } from './useField';

interface UseNumberFieldOptions {
  initialValue: number;
  defaultValue: number;
  onValueChange: (value: number) => void;
  validate?: (value: number) => boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const useNumberField = ({
  initialValue,
  defaultValue,
  onValueChange,
  validate,
  min,
  max,
  step = 1
}: UseNumberFieldOptions) => {
  return useField({
    initialValue,
    defaultValue,
    onValueChange,
    validate,
    parse: (input) => input === '' ? 0 : parseFloat(input),
    stringify: (value) => value.toString(),
    min,
    max,
    step
  });
};
