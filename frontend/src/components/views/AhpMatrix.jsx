import React, { useState, useEffect } from 'react';

const SCALE_OPTIONS = [
  { value: 9, label: '9 - Extrêmement plus important' },
  { value: 7, label: '7 - Très fortement plus important' },
  { value: 5, label: '5 - Fortement plus important' },
  { value: 3, label: '3 - Modérément plus important' },
  { value: 1, label: '1 - Égale importance' },
  { value: 1/3, label: '1/3 - Modérément moins important' },
  { value: 1/5, label: '1/5 - Fortement moins important' },
  { value: 1/7, label: '1/7 - Très fortement moins important' },
  { value: 1/9, label: '1/9 - Extrêmement moins important' }
];

export default function AhpMatrix({ criteria, matrix, onChange }) {
  if (!criteria || criteria.length < 2) {
    return <div className="text-sm text-gray-500 p-4">Sélectionnez au moins 2 critères pour utiliser AHP.</div>;
  }

  const handleChange = (i, j, val) => {
    const newMatrix = [...matrix.map(row => [...row])];
    newMatrix[i][j] = parseFloat(val);
    newMatrix[j][i] = 1 / parseFloat(val);
    onChange(newMatrix);
  };

  return (
    <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
      <table className="w-full text-sm text-center">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-2 border-r border-gray-200">Critères</th>
            {criteria.map(c => (
              <th key={c.id} className="p-2 font-medium text-gray-700">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((cRow, i) => (
            <tr key={cRow.id} className="border-b border-gray-100">
              <td className="p-2 font-medium text-gray-800 text-left border-r border-gray-200 bg-gray-50">{cRow.label}</td>
              {criteria.map((cCol, j) => {
                if (i === j) {
                  return <td key={j} className="p-2 text-gray-400 bg-gray-50 font-mono">1</td>;
                }
                if (j < i) {
                   return <td key={j} className="p-2 text-gray-500 font-mono bg-gray-50/30">{matrix[i]?.[j]?.toFixed(2)}</td>;
                }
                // Upper triangle : select
                return (
                  <td key={j} className="p-2">
                    <select
                      className="border border-gray-200 rounded p-1 text-xs outline-none focus:border-[#1b7a45]"
                      value={matrix[i]?.[j] || 1}
                      onChange={(e) => handleChange(i, j, e.target.value)}
                    >
                      {SCALE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
