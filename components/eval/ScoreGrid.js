'use client'

import { MONTHS, SCALE_OPTIONS, computeSection, fmt } from '@/lib/evalConfig'
import { cn } from '@/lib/utils'

const CELL_COLORS = {
  E: 'bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-500',
  B: 'bg-blue-600 text-white hover:bg-blue-500 border-blue-500',
  R: 'bg-amber-500 text-black hover:bg-amber-400 border-amber-400',
  D: 'bg-red-600 text-white hover:bg-red-500 border-red-500',
  '': 'bg-secondary text-muted-foreground hover:bg-accent border-border',
}

const FILL_COLORS = {
  E: 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white',
  B: 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white',
  R: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black',
  D: 'bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white',
}

const CYCLE = ['', 'E', 'B', 'R', 'D']
function nextVal(v) {
  const i = CYCLE.indexOf(v || '')
  return CYCLE[(i + 1) % CYCLE.length]
}

export default function ScoreGrid({ section, scores, onChange }) {
  const data = scores || {}

  const setCell = (ci, m, val) => {
    const next = { ...data }
    const arr = [...(next[ci] || Array(12).fill(''))]
    arr[m] = val
    next[ci] = arr
    onChange(next)
  }

  const fillRow = (ci, val) => {
    const next = { ...data }
    next[ci] = Array(12).fill(val)
    onChange(next)
  }

  const clearRow = (ci) => {
    const next = { ...data }
    next[ci] = Array(12).fill('')
    onChange(next)
  }

  const res = computeSection(section, data)

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-secondary/60">
            <th className="sticky left-0 z-10 bg-secondary/95 px-3 py-2 text-left font-semibold text-foreground min-w-[220px]">
              Criterio
            </th>
            <th className="px-1 py-2 text-center font-medium text-muted-foreground border-l border-border min-w-[120px]">
              Llenado rápido
            </th>
            {MONTHS.map((mo) => (
              <th key={mo} className="px-1 py-2 text-center font-medium text-muted-foreground w-[34px]">
                {mo}
              </th>
            ))}
            <th className="px-2 py-2 text-center font-semibold text-foreground border-l border-border">Prom.</th>
          </tr>
        </thead>
        <tbody>
          {section.criteria.map((crit, ci) => {
            const arr = data[ci] || Array(12).fill('')
            const vals = arr.map((l) => ({ E: 10, B: 9, R: 8, D: 7 })[l]).filter(Boolean)
            const prom = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
            return (
              <tr key={ci} className="border-t border-border hover:bg-accent/30">
                <td className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-foreground align-middle min-w-[220px]">
                  {crit}
                </td>
                <td className="px-1 py-1 border-l border-border">
                  <div className="flex items-center justify-center gap-0.5">
                    {SCALE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        title={`Llenar fila con ${opt}`}
                        onClick={() => fillRow(ci, opt)}
                        className={cn('h-6 w-6 rounded text-[11px] font-bold transition-colors', FILL_COLORS[opt])}
                      >
                        {opt}
                      </button>
                    ))}
                    <button
                      type="button"
                      title="Limpiar fila"
                      onClick={() => clearRow(ci)}
                      className="h-6 w-6 rounded text-[11px] font-bold bg-muted text-muted-foreground hover:bg-accent"
                    >
                      ×
                    </button>
                  </div>
                </td>
                {MONTHS.map((mo, m) => (
                  <td key={mo} className="px-0.5 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => setCell(ci, m, nextVal(arr[m]))}
                      className={cn(
                        'h-7 w-7 rounded border text-[12px] font-bold transition-colors',
                        CELL_COLORS[arr[m] || '']
                      )}
                    >
                      {arr[m] || '·'}
                    </button>
                  </td>
                ))}
                <td className="px-2 py-1 text-center font-semibold text-foreground border-l border-border">
                  {prom != null ? fmt(prom) : '—'}
                </td>
              </tr>
            )
          })}
          {/* Calificación row */}
          <tr className="border-t-2 border-primary/40 bg-primary/10 font-semibold">
            <td className="sticky left-0 z-10 bg-primary/10 px-3 py-2 text-left text-primary">CALIFICACIÓN MENSUAL</td>
            <td className="border-l border-border px-2 py-2 text-center text-muted-foreground text-[10px]">Total: {fmt(res.total)}</td>
            {res.monthly.map((v, m) => (
              <td key={m} className="px-0.5 py-2 text-center text-foreground">
                {v != null ? fmt(v) : '—'}
              </td>
            ))}
            <td className="border-l border-border px-2 py-2 text-center text-emerald-400 text-sm">
              {res.promedio != null ? fmt(res.promedio) : '—'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
