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
    <div className={`w-full overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 select-none">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-5 py-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700 relative">
          {loading && (
            <tr>
              <td colSpan={headers.length} className="py-12">
                <div className="flex flex-col items-center justify-center space-y-2.5">
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-600 animate-spin" />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  </div>
                  <span className="text-xs font-medium text-slate-500">Synchronizing records...</span>
                </div>
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="py-14 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-xs font-medium text-slate-600">{emptyMessage}</span>
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

export default Table;
