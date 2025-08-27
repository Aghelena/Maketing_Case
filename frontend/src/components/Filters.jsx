import React, { useEffect, useState } from 'react'

export default function Filters({ columns, onSubmit, loading }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [sort, setSort] = useState('')
  const [order, setOrder] = useState('asc')

  useEffect(() => {
    if (columns?.length && !sort) setSort(columns[0])
  }, [columns])

  function handle(e) {
    e.preventDefault()
    onSubmit({ start, end, sort, order })
  }

  return (
    <form className="grid" onSubmit={handle}>
      <label>Início
        <input type="date" value={start} onChange={e=>setStart(e.target.value)} />
      </label>
      <label>Fim
        <input type="date" value={end} onChange={e=>setEnd(e.target.value)} />
      </label>
      <label>Ordenar por
        <select value={sort} onChange={e=>setSort(e.target.value)}>
          {columns.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label>Ordem
        <select value={order} onChange={e=>setOrder(e.target.value)}>
          <option value="asc">Ascendente</option>
          <option value="desc">Descendente</option>
        </select>
      </label>
      <button className="btn" type="submit" disabled={loading}>{loading ? 'Carregando...' : 'Carregar dados'}</button>
    </form>
  )
}
