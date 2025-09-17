import { RadioGroup } from '@headlessui/react';
import clsx from 'clsx';

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className = '',
}) => {
  return (
    <RadioGroup value={value} onChange={onChange} className={clsx('flex flex-col sm:flex-row flex-wrap min-w-0 rounded-xl bg-gray-200 p-1', className)}>
      <div className="flex w-full justify-between space-x-1">
        {options.map((option) => (
          <RadioGroup.Option
            key={option.value}
            value={option.value}
            className={({ checked }) =>
              clsx(
                'flex-1 min-w-0 px-3 py-2 sm:py-1 text-sm font-medium rounded-lg transition-all duration-200 min-h-[44px] sm:min-h-0 text-center whitespace-normal cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75',
                checked
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/[0.6]'
              )
            }
          >
            <RadioGroup.Label as="span" className="w-full h-full flex items-center justify-center">
              {option.label}
            </RadioGroup.Label>
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
};
