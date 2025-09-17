import { createContext } from 'react';
import { SavedConfiguration, CachedInputs, LoanSummary } from '../types';

export interface ConfigurationsContextType {
  configurations: SavedConfiguration[];
  saveConfiguration: (name: string, description: string, inputs: CachedInputs, summary?: LoanSummary) => SavedConfiguration;
  updateConfiguration: (id: string, name: string, description: string, inputs: CachedInputs, summary?: LoanSummary) => void;
  deleteConfiguration: (id: string) => void;
  getConfiguration: (id: string) => SavedConfiguration | undefined;
}

export const ConfigurationsContext = createContext<ConfigurationsContextType | undefined>(undefined);
