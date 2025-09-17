import { Fragment } from 'react';
import { Tab } from '@headlessui/react';
import clsx from 'clsx';

interface TabItem {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
}

export function Tabs({ tabs }: TabsProps) {
  return (
    <Tab.Group as="div" className="w-full">
      <Tab.List className="flex space-x-1 rounded-xl bg-gray-200 p-1">
        {tabs.map((tab) => (
          <Tab as={Fragment} key={tab.label}>
            {({ selected }) => (
              <button
                className={clsx(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-100 ring-white ring-opacity-60',
                  selected
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:bg-white/[0.6] hover:text-gray-800'
                )}
              >
                {tab.label}
              </button>
            )}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-2">
        {tabs.map((tab) => (
          <Tab.Panel
            key={tab.label}
            className="rounded-xl bg-white p-3"
          >
            {tab.content}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}
