import React from 'react';
import { Spinner } from './Spinner';

export const Table = ({
  headers = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  renderRow,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-x-auto border border-brandBorder rounded-xl bg-brandSurface shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/75 border-b border-brandBorder">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-6 py-3.5 text-xs font-semibold tracking-wider text-brandHeading uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brandBorder text-sm text-brandBody relative">
          {loading && (
            <tr>
              <td colSpan={headers.length} className="py-12">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Spinner size="md" />
                  <span className="text-xs text-brandBody">Syncing data...</span>
                </div>
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="py-16 text-center text-brandBody">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <span className="text-sm font-medium">{emptyMessage}</span>
                </div>
              </td>
            </tr>
          )}

          {!loading && data.length > 0 && data.map((item, idx) => renderRow(item, idx))}
        </tbody>
      </table>
    </div>
  );
};
