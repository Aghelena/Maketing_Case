import React from 'react'

export default function DataTable({ columns, rows, role, loading }) {
  if (loading) return <div className="skeleton" style={{height: 180}} />

  const visibleColumns = columns.filter(c => !(role !== 'admin' && c === 'cost_micros'))

  if (!rows?.length) return <div className="muted">Sem dados no filtro atual.</div>

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {visibleColumns.map(c => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {visibleColumns.map(c => <td key={c}>{r[c] ?? ''}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
