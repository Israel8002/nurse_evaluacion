'use client'

import { useState, useEffect, useCallback } from 'react'
import { HORARIOS } from '@/lib/evalConfig'
import Wizard from '@/components/eval/Wizard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ClipboardList, Users, Settings, Plus, FileText, Trash2,
  Pencil, Activity, Award, CheckCircle2, FileClock, Stethoscope, ShieldCheck,
} from 'lucide-react'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardList },
  { key: 'empleados', label: 'Empleados', icon: Users },
  { key: 'configuracion', label: 'Configuración', icon: Settings, jefaturaOnly: true },
]

export default function App() {
  const [view, setView] = useState('dashboard')
  const [role, setRole] = useState('jefatura')
  const [config, setConfig] = useState(null)
  const [employees, setEmployees] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [activeEval, setActiveEval] = useState(null)

  useEffect(() => {
    const r = typeof window !== 'undefined' ? localStorage.getItem('role') : null
    if (r) setRole(r)
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('role', role)
  }, [role])

  const loadConfig = useCallback(() => fetch('/api/config').then((r) => r.json()).then(setConfig), [])
  const loadEmployees = useCallback(() => fetch('/api/employees').then((r) => r.json()).then(setEmployees), [])
  const loadEvaluations = useCallback(() => fetch('/api/evaluations').then((r) => r.json()).then(setEvaluations), [])
  const loadDashboard = useCallback(() => fetch('/api/dashboard').then((r) => r.json()).then(setDashboard), [])

  useEffect(() => {
    loadConfig(); loadEmployees(); loadEvaluations(); loadDashboard()
  }, [loadConfig, loadEmployees, loadEvaluations, loadDashboard])

  const refreshAll = () => { loadEvaluations(); loadDashboard(); loadEmployees() }

  // ---- Wizard view ----
  if (activeEval) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster position="top-right" richColors />
        <div className="p-4 md:p-8">
          <Wizard
            evaluationId={activeEval}
            config={config}
            onExit={() => { setActiveEval(null); refreshAll() }}
          />
        </div>
      </div>
    )
  }

  const isJefatura = role === 'jefatura'

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Toaster position="top-right" richColors />
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Evaluación</div>
            <div className="text-xs text-muted-foreground leading-tight">Enfermería · Anual</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.filter((n) => !n.jefaturaOnly || isJefatura).map((n) => {
            const Icon = n.icon
            return (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  view === n.key
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </button>
            )
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Label className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Rol actual
          </Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-9 bg-secondary text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="jefatura">Jefatura de Enfermería</SelectItem>
              <SelectItem value="supervisor">Supervisor de Enfermería</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        {/* Mobile top nav */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-card p-2 md:hidden">
          {NAV.filter((n) => !n.jefaturaOnly || isJefatura).map((n) => (
            <button key={n.key} onClick={() => setView(n.key)}
              className={cn('whitespace-nowrap rounded-md px-3 py-1.5 text-xs', view === n.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>
              {n.label}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-8">
          {view === 'dashboard' && <Dashboard data={dashboard} onOpen={(id) => setActiveEval(id)} />}
          {view === 'evaluaciones' && (
            <Evaluaciones
              evaluations={evaluations} employees={employees} config={config} isJefatura={isJefatura}
              onOpen={(id) => setActiveEval(id)} refresh={refreshAll}
            />
          )}
          {view === 'empleados' && (
            <Empleados employees={employees} refresh={loadEmployees} isJefatura={isJefatura} />
          )}
          {view === 'configuracion' && isJefatura && (
            <Configuracion config={config} refresh={loadConfig} />
          )}
        </div>
      </main>
    </div>
  )
}

/* ---------------- DASHBOARD ---------------- */
function Dashboard({ data, onOpen }) {
  const stats = [
    { label: 'Empleados', value: data?.employees ?? '—', icon: Users, color: 'text-blue-400' },
    { label: 'Evaluaciones', value: data?.evaluations ?? '—', icon: ClipboardList, color: 'text-cyan-400' },
    { label: 'Finalizadas', value: data?.completed ?? '—', icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'En borrador', value: data?.draft ?? '—', icon: FileClock, color: 'text-amber-400' },
    { label: 'Promedio Gral.', value: data?.avgGeneral ?? '—', icon: Award, color: 'text-purple-400' },
  ]
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen del sistema de evaluación anual de enfermería</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Icon className={cn('h-5 w-5', s.color)} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <Card className="bg-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" />Evaluaciones recientes</CardTitle></CardHeader>
        <CardContent>
          {data?.recent?.length ? (
            <div className="divide-y divide-border">
              {data.recent.map((e) => (
                <button key={e.id} onClick={() => onOpen(e.id)} className="flex w-full items-center justify-between py-3 text-left hover:bg-accent/30 -mx-2 px-2 rounded">
                  <div>
                    <div className="font-medium">{e.empleadoNombre}</div>
                    <div className="text-xs text-muted-foreground font-mono">{e.folio} · {e.anio}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {e.general != null && <span className="text-emerald-400 font-bold">{e.general}</span>}
                    <Badge variant={e.status === 'finalizada' ? 'default' : 'secondary'} className={e.status === 'finalizada' ? 'bg-emerald-600 hover:bg-emerald-600' : ''}>
                      {e.status === 'finalizada' ? 'Finalizada' : 'Borrador'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay evaluaciones.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- EVALUACIONES ---------------- */
function Evaluaciones({ evaluations, employees, config, isJefatura, onOpen, refresh }) {
  const [open, setOpen] = useState(false)
  const [empId, setEmpId] = useState('')
  const [anio, setAnio] = useState(config?.anio || new Date().getFullYear())
  const [creating, setCreating] = useState(false)

  useEffect(() => { if (config?.anio) setAnio(config.anio) }, [config])

  const create = async () => {
    if (!empId) { toast.error('Selecciona un empleado'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empleadoId: empId, anio: Number(anio) }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setOpen(false); setEmpId('')
      toast.success(`Evaluación creada · ${data.folio}`)
      onOpen(data.id)
    } finally { setCreating(false) }
  }

  const del = async (id) => {
    await fetch(`/api/evaluations/${id}`, { method: 'DELETE' })
    toast.success('Evaluación eliminada'); refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evaluaciones</h1>
          <p className="text-sm text-muted-foreground">Crea y gestiona las evaluaciones anuales</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!employees.length}><Plus className="mr-1 h-4 w-4" />Nueva Evaluación</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Evaluación Anual</DialogTitle>
              <DialogDescription>Selecciona un empleado. Sus datos se cargarán automáticamente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="mb-1.5 block">Empleado</Label>
                <Select value={empId} onValueChange={setEmpId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un empleado" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nombre} · {e.numeroEmpleado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Año</Label>
                <Input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={creating}>{creating ? 'Creando…' : 'Crear y Capturar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!employees.length && (
        <Card className="bg-card"><CardContent className="p-6 text-center text-sm text-muted-foreground">
          Primero registra empleados en el módulo <b>Empleados</b> para poder crear evaluaciones.
        </CardContent></Card>
      )}

      <Card className="bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Calif.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.length ? evaluations.map((e) => (
                <TableRow key={e.id} className="cursor-pointer" onClick={() => onOpen(e.id)}>
                  <TableCell className="font-mono text-xs">{e.folio}</TableCell>
                  <TableCell className="font-medium">{e.empleadoNombre}</TableCell>
                  <TableCell>{e.anio}</TableCell>
                  <TableCell className="font-bold text-emerald-400">{e.general ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === 'finalizada' ? 'default' : 'secondary'} className={e.status === 'finalizada' ? 'bg-emerald-600 hover:bg-emerald-600' : ''}>
                      {e.status === 'finalizada' ? 'Finalizada' : 'Borrador'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="PDF" onClick={() => window.open(`/api/evaluations/${e.id}/pdf`, '_blank')}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Capturar" onClick={() => onOpen(e.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isJefatura && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-red-400" title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar evaluación?</AlertDialogTitle>
                              <AlertDialogDescription>Se eliminará {e.folio} de forma permanente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => del(e.id)} className="bg-red-600 hover:bg-red-500">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No hay evaluaciones todavía.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- EMPLEADOS ---------------- */
function Empleados({ employees, refresh, isJefatura }) {
  const empty = { nombre: '', numeroEmpleado: '', categoria: '', horario: '' }
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)

  const openNew = () => { setForm(empty); setEditId(null); setOpen(true) }
  const openEdit = (e) => { setForm({ nombre: e.nombre, numeroEmpleado: e.numeroEmpleado, categoria: e.categoria, horario: e.horario }); setEditId(e.id); setOpen(true) }

  const save = async () => {
    if (!form.nombre || !form.numeroEmpleado) { toast.error('Nombre y número son obligatorios'); return }
    if (editId) {
      await fetch(`/api/employees/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      toast.success('Empleado actualizado')
    } else {
      await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      toast.success('Empleado agregado')
    }
    setOpen(false); refresh()
  }
  const del = async (id) => { await fetch(`/api/employees/${id}`, { method: 'DELETE' }); toast.success('Empleado eliminado'); refresh() }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empleados</h1>
          <p className="text-sm text-muted-foreground">Personal de enfermería registrado</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />Nuevo Empleado</Button>
      </div>

      <Card className="bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>No. Empleado</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length ? employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nombre}</TableCell>
                  <TableCell>{e.numeroEmpleado}</TableCell>
                  <TableCell>{e.categoria || '—'}</TableCell>
                  <TableCell>{e.horario ? <Badge variant="outline">{e.horario}</Badge> : '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                      {isJefatura && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-red-400"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
                              <AlertDialogDescription>Se eliminará a {e.nombre}.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => del(e.id)} className="bg-red-600 hover:bg-red-500">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No hay empleados registrados.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Nuevo'} Empleado</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="mb-1.5 block">Nombre</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div><Label className="mb-1.5 block">Número de Empleado</Label><Input value={form.numeroEmpleado} onChange={(e) => setForm({ ...form, numeroEmpleado: e.target.value })} /></div>
            <div><Label className="mb-1.5 block">Categoría</Label><Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ej. Enfermera General" /></div>
            <div>
              <Label className="mb-1.5 block">Horario</Label>
              <Select value={form.horario} onValueChange={(v) => setForm({ ...form, horario: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona horario" /></SelectTrigger>
                <SelectContent>
                  {HORARIOS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------------- CONFIGURACIÓN ---------------- */
function Configuracion({ config, refresh }) {
  const [form, setForm] = useState(config || {})
  const [saving, setSaving] = useState(false)
  useEffect(() => { setForm(config || {}) }, [config])

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      toast.success('Configuración guardada'); refresh()
    } finally { setSaving(false) }
  }
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Datos institucionales que aparecerán en todos los PDF</p>
      </div>

      <Card className="bg-card">
        <CardHeader><CardTitle className="text-base">Datos de la Unidad Médica</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div><Label className="mb-1.5 block">Nombre de la Unidad Médica</Label><Input value={form.unidadMedica || ''} onChange={(e) => set('unidadMedica', e.target.value)} /></div>
          <div><Label className="mb-1.5 block">Clave de la Unidad</Label><Input value={form.claveUnidad || ''} onChange={(e) => set('claveUnidad', e.target.value)} /></div>
          <div><Label className="mb-1.5 block">Supervisor(a) de Enfermería</Label><Input value={form.supervisor || ''} onChange={(e) => set('supervisor', e.target.value)} /></div>
          <div><Label className="mb-1.5 block">Jefatura de Enfermería</Label><Input value={form.jefatura || ''} onChange={(e) => set('jefatura', e.target.value)} /></div>
          <div><Label className="mb-1.5 block">Año Vigente</Label><Input type="number" value={form.anio || ''} onChange={(e) => set('anio', Number(e.target.value))} /></div>
          <div><Label className="mb-1.5 block">Prefijo del Folio</Label><Input value={form.prefijoFolio || ''} onChange={(e) => set('prefijoFolio', e.target.value.toUpperCase())} placeholder="HGE" /></div>
          <div className="sm:col-span-2"><Label className="mb-1.5 block">URL del Logotipo (opcional)</Label><Input value={form.logo || ''} onChange={(e) => set('logo', e.target.value)} placeholder="https://..." /></div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Google Drive</CardTitle>
          <CardDescription>Almacenamiento automático de los PDF generados (se habilitará al conectar las credenciales).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label className="mb-1.5 block">ID de Carpeta de Google Drive</Label><Input value={form.driveFolderId || ''} onChange={(e) => set('driveFolderId', e.target.value)} placeholder="1A2b3C..." /></div>
          <Badge variant="outline" className="text-amber-400 border-amber-500/50">Integración pendiente de credenciales</Badge>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar Configuración'}</Button>
    </div>
  )
}
