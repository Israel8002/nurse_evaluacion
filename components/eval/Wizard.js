'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  SECTIONS,
  MONTHS,
  MONTHS_FULL,
  WIZARD_STEPS,
  ATTENDANCE_KEYS,
  ATTENDANCE_CODES,
  daysInMonth,
  computeGeneral,
  computeProgress,
  fmt,
} from '@/lib/evalConfig'
import ScoreGrid from '@/components/eval/ScoreGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, ChevronRight, Save, FileText, Printer, CloudUpload,
  Loader2, CheckCircle2, ArrowLeft, User,
} from 'lucide-react'
import { toast } from 'sonner'

const ATT_COLORS = {
  A: 'bg-emerald-600 text-white border-emerald-500',
  F: 'bg-red-600 text-white border-red-500',
  I: 'bg-amber-500 text-black border-amber-400',
  V: 'bg-blue-600 text-white border-blue-500',
  'D/O': 'bg-purple-600 text-white border-purple-500',
  'P/A': 'bg-cyan-600 text-white border-cyan-500',
  'B/A': 'bg-pink-600 text-white border-pink-500',
  'C/M': 'bg-fuchsia-600 text-white border-fuchsia-500',
  R: 'bg-teal-600 text-white border-teal-500',
  '': 'bg-secondary text-muted-foreground border-border',
}

export default function Wizard({ evaluationId, config, onExit }) {
  const [ev, setEv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved
  const [attMonth, setAttMonth] = useState(0)
  const saveTimer = useRef(null)
  const evRef = useRef(null)

  // Load evaluation
  useEffect(() => {
    let active = true
    setLoading(true)
    fetch(`/api/evaluations/${evaluationId}`)
      .then((r) => r.json())
      .then((data) => {
        if (active) {
          setEv(data)
          evRef.current = data
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
    return () => { active = false }
  }, [evaluationId])

  const doSave = useCallback(async (payload) => {
    setSaveState('saving')
    try {
      await fetch(`/api/evaluations/${evaluationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1500)
    } catch (e) {
      setSaveState('idle')
      toast.error('Error al guardar')
    }
  }, [evaluationId])

  // Autosave on changes (debounced)
  const update = useCallback((patch) => {
    setEv((prev) => {
      const next = { ...prev, ...patch }
      evRef.current = next
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => doSave(next), 700)
      return next
    })
  }, [doSave])

  const goStep = (n) => {
    const step = Math.max(1, Math.min(10, n))
    const next = { ...evRef.current, currentStep: step }
    evRef.current = next
    setEv(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    doSave(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading || !ev) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando evaluación...
      </div>
    )
  }

  const step = ev.currentStep || 1
  const { sectionResults, general } = computeGeneral(ev.scores || {})
  const progress = computeProgress(ev)

  const setSectionScores = (key, scores) => {
    update({ scores: { ...(ev.scores || {}), [key]: scores } })
  }

  const setAttendance = (m, day, code) => {
    const att = { ...(ev.attendance || {}) }
    const month = { ...(att[m] || {}) }
    if (month[day] === code) delete month[day]
    else month[day] = code
    att[m] = month
    update({ attendance: att })
  }

  const setAnec = (m, text) => {
    update({ anecdotario: { ...(ev.anecdotario || {}), [m]: text } })
  }

  const finalize = async () => {
    const next = { ...evRef.current, status: 'finalizada' }
    evRef.current = next
    setEv(next)
    await doSave(next)
    toast.success('Evaluación finalizada y guardada')
  }

  const openPDF = () => {
    window.open(`/api/evaluations/${evaluationId}/pdf`, '_blank')
  }

  const currentSection = SECTIONS.find((s) => s.step === step)

  return (
    <div className="mx-auto max-w-6xl pb-24">
      {/* Header bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onExit}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Evaluaciones
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{ev.empleadoNombre}</h2>
              <Badge variant="outline" className="font-mono">{ev.folio}</Badge>
              {ev.status === 'finalizada' && (
                <Badge className="bg-emerald-600 hover:bg-emerald-600">Finalizada</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">No. {ev.numeroEmpleado} · {ev.categoria} · {ev.horario} · Año {ev.anio}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {saveState === 'saving' && <span className="flex items-center text-amber-400"><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />Guardando…</span>}
          {saveState === 'saved' && <span className="flex items-center text-emerald-400"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Guardado</span>}
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Calificación</div>
            <div className="text-lg font-bold text-emerald-400">{general != null ? fmt(general) : '—'}</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Paso {step} de 10 · {WIZARD_STEPS[step - 1].label}</span>
        <span>{progress}% completado</span>
      </div>
      <Progress value={progress} className="mb-4 h-2" />

      {/* Step pills */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {WIZARD_STEPS.map((s) => (
          <button
            key={s.n}
            onClick={() => goStep(s.n)}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
              s.n === step
                ? 'bg-primary text-primary-foreground'
                : s.n < step
                ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                : 'bg-secondary text-muted-foreground hover:bg-accent'
            )}
          >
            {s.n}
          </button>
        ))}
      </div>

      {/* STEP CONTENT */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">{step}</span>
            {WIZARD_STEPS[step - 1].label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1 - Datos generales */}
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Nombre', ev.empleadoNombre],
                ['Número de Empleado', ev.numeroEmpleado],
                ['Categoría', ev.categoria || '—'],
                ['Horario', ev.horario || '—'],
                ['Unidad Médica', config?.unidadMedica || '—'],
                ['Clave de Unidad', config?.claveUnidad || '—'],
                ['Año de Evaluación', ev.anio],
                ['Calificación (Promedio General)', general != null ? fmt(general) : 'Pendiente'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-1 font-medium">{value}</div>
                </div>
              ))}
              <p className="sm:col-span-2 text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Estos datos se cargan automáticamente del empleado y la configuración. La calificación se calcula al finalizar la evaluación.
              </p>
            </div>
          )}

          {/* Steps 2-7 - Score sections */}
          {currentSection && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Haz clic en cada celda para cambiar la calificación (E→B→R→D). Usa los botones de <b>llenado rápido</b> para asignar el mismo valor a los 12 meses de una fila.
              </p>
              <ScoreGrid
                section={currentSection}
                scores={ev.scores?.[currentSection.key] || {}}
                onChange={(s) => setSectionScores(currentSection.key, s)}
              />
              <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                <div><span className="text-muted-foreground">Total anual: </span><b>{fmt(sectionResults[currentSection.key].total)}</b></div>
                <div><span className="text-muted-foreground">Promedio anual de la sección: </span><b className="text-emerald-400">{sectionResults[currentSection.key].promedio != null ? fmt(sectionResults[currentSection.key].promedio) : '—'}</b></div>
              </div>
            </div>
          )}

          {/* Step 8 - Attendance */}
          {step === 8 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecciona un mes y registra la clave de asistencia de cada día. Los días se calculan automáticamente según el año <b>{ev.anio}</b> (considerando años bisiestos).
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MONTHS.map((mo, m) => (
                  <button
                    key={mo}
                    onClick={() => setAttMonth(m)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      m === attMonth ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {mo}
                  </button>
                ))}
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="mb-3 text-sm font-medium">{MONTHS_FULL[attMonth]} {ev.anio} · {daysInMonth(ev.anio, attMonth)} días</div>
                <div className="grid grid-cols-7 gap-2 sm:grid-cols-10 md:grid-cols-12">
                  {Array.from({ length: daysInMonth(ev.anio, attMonth) }, (_, i) => i + 1).map((day) => {
                    const code = ev.attendance?.[attMonth]?.[day] || ''
                    return (
                      <Popover key={day}>
                        <PopoverTrigger asChild>
                          <button className={cn('flex flex-col items-center rounded-md border p-1 transition-colors', ATT_COLORS[code])}>
                            <span className="text-[10px] opacity-70">{day}</span>
                            <span className="text-xs font-bold leading-none h-3">{code || '·'}</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="grid grid-cols-3 gap-1">
                            {ATTENDANCE_KEYS.map((k) => (
                              <button
                                key={k.code}
                                title={k.label}
                                onClick={() => setAttendance(attMonth, day, k.code)}
                                className={cn('rounded px-2 py-1 text-xs font-bold border', ATT_COLORS[k.code], code === k.code && 'ring-2 ring-primary')}
                              >
                                {k.code}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setAttendance(attMonth, day, '')}
                            className="mt-1 w-full rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                          >
                            Limpiar
                          </button>
                        </PopoverContent>
                      </Popover>
                    )
                  })}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {ATTENDANCE_KEYS.map((k) => (
                  <span key={k.code} className="flex items-center gap-1">
                    <span className={cn('inline-block h-3 w-3 rounded-sm', ATT_COLORS[k.code])} />
                    {k.code} = {k.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Step 9 - Anecdotario */}
          {step === 9 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Registra anécdotas, compromisos y observaciones de cada mes. El texto se conserva exactamente como lo capturas.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {MONTHS_FULL.map((mo, m) => (
                  <div key={mo} className="rounded-lg border border-border bg-secondary/30 p-3">
                    <label className="mb-1.5 block text-xs font-semibold text-primary">{mo}</label>
                    <Textarea
                      rows={3}
                      placeholder="Anecdotario, compromisos y observaciones…"
                      value={ev.anecdotario?.[m] || ''}
                      onChange={(e) => setAnec(m, e.target.value)}
                      className="resize-none bg-background text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 10 - Resumen final */}
          {step === 10 && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SECTIONS.map((s) => (
                  <div key={s.key} className="rounded-lg border border-border bg-secondary/30 p-3">
                    <div className="text-xs text-muted-foreground">{s.title}</div>
                    <div className="mt-1 text-xl font-bold text-emerald-400">
                      {sectionResults[s.key].promedio != null ? fmt(sectionResults[s.key].promedio) : '—'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-primary/40 bg-primary/10 p-5 text-center">
                <div className="text-sm text-muted-foreground">PROMEDIO GENERAL / CALIFICACIÓN FINAL</div>
                <div className="mt-1 text-4xl font-bold text-emerald-400">{general != null ? fmt(general) : '—'}</div>
              </div>

              {/* Attendance summary */}
              <div>
                <h4 className="mb-2 text-sm font-semibold">Resumen de Control de Asistencias</h4>
                <div className="flex flex-wrap gap-2">
                  {ATTENDANCE_CODES.map((code) => {
                    let count = 0
                    for (let m = 0; m < 12; m++) {
                      const md = ev.attendance?.[m] || {}
                      count += Object.values(md).filter((v) => v === code).length
                    }
                    return (
                      <Badge key={code} variant="outline" className="gap-1">
                        <span className={cn('inline-block h-2.5 w-2.5 rounded-sm', ATT_COLORS[code])} />
                        {code}: {count}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              {/* Observations summary */}
              <div>
                <h4 className="mb-2 text-sm font-semibold">Resumen de Observaciones</h4>
                <div className="space-y-1.5 text-sm">
                  {MONTHS_FULL.map((mo, m) =>
                    ev.anecdotario?.[m]?.trim() ? (
                      <div key={mo} className="rounded border border-border bg-secondary/30 p-2">
                        <span className="font-medium text-primary">{mo}: </span>
                        <span className="text-muted-foreground">{ev.anecdotario[m]}</span>
                      </div>
                    ) : null
                  )}
                  {MONTHS_FULL.every((_mo, m) => !ev.anecdotario?.[m]?.trim()) && (
                    <p className="text-muted-foreground">Sin observaciones registradas.</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Final actions */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={finalize} className="bg-emerald-600 hover:bg-emerald-500">
                  <Save className="mr-2 h-4 w-4" /> Guardar / Finalizar
                </Button>
                <Button onClick={openPDF} variant="default">
                  <FileText className="mr-2 h-4 w-4" /> Generar PDF
                </Button>
                <Button onClick={openPDF} variant="secondary">
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
                <Button variant="outline" disabled title="Disponible al configurar Google Drive">
                  <CloudUpload className="mr-2 h-4 w-4" /> Guardar en Google Drive (próximamente)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Puedes regresar a cualquier paso para editar antes de finalizar. El PDF generado conserva el formato institucional oficial.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nav buttons */}
      <div className="mt-5 flex items-center justify-between">
        <Button variant="outline" onClick={() => goStep(step - 1)} disabled={step === 1}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
        </Button>
        {step < 10 ? (
          <Button onClick={() => goStep(step + 1)}>
            Siguiente <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={openPDF} className="bg-emerald-600 hover:bg-emerald-500">
            <FileText className="mr-1 h-4 w-4" /> Ver PDF
          </Button>
        )}
      </div>
    </div>
  )
}
