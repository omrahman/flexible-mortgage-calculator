import { useField } from './useField';

interface UseInputFieldOptions {
  initialValue: string;
  defaultValue: string;
  onValueChange: (value: string) => void;
  validate?: (value: string) => boolean;
  allowEmpty?: boolean;
}

export const useInputField = ({
  initialValue,
  defaultValue,
  onValueChange,
  validate,
  allowEmpty = true
}: UseInputFieldOptions) => {
  return useField({
    initialValue,
    defaultValue,
    onValueChange,
    validate,
    allowEmpty
  });
};
