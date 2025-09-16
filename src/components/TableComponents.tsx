import React from 'react';
import type { TableCellProps } from '../types';

export const Th: React.FC<TableCellProps> = ({ children, className = "" }) => {
  return (
    <th className={`text-left px-3 py-2 text-xs font-semibold text-gray-600 ${className}`}>
      {children}
    </th>
  );
};

export const Td: React.FC<TableCellProps> = ({ children, className = "" }) => {
  return (
    <td className={`px-3 py-2 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
};
