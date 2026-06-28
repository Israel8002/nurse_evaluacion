import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { generateEvaluationPDF } from '@/lib/pdfGenerator'
import { computeGeneral, SECTIONS } from '@/lib/evalConfig'

// MongoDB connection
let client
let db
let clientPromise

async function connectToMongo() {
  if (db) return db
  if (!clientPromise) {
    const c = new MongoClient(process.env.MONGO_URL)
    clientPromise = c.connect().then(() => {
      client = c
      db = c.db(process.env.DB_NAME)
      return db
    })
  }
  return clientPromise
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

function json(data, status = 200) {
  return handleCORS(NextResponse.json(data, { status }))
}

const CONFIG_ID = 'singleton'

const DEFAULT_CONFIG = {
  id: CONFIG_ID,
  unidadMedica: 'HOSPITAL GENERAL DE ENFERMERÍA',
  claveUnidad: '46100',
  supervisor: '',
  jefatura: '',
  logo: '',
  anio: new Date().getFullYear(),
  prefijoFolio: 'HGE',
  driveFolderId: '',
  driveConfigured: false,
}

async function getConfig(db) {
  let cfg = await db.collection('config').findOne({ id: CONFIG_ID })
  if (!cfg) {
    cfg = { ...DEFAULT_CONFIG }
    await db.collection('config').insertOne(cfg)
  }
  const { _id, ...rest } = cfg
  return rest
}

// Generate sequential unique folio: PREFIX-YEAR-000001
async function nextFolio(db, prefix, year) {
  const key = `${prefix}-${year}`
  const res = await db.collection('counters').findOneAndUpdate(
    { id: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  )
  const seq = (res?.seq ?? res?.value?.seq ?? 1)
  const num = String(seq).padStart(6, '0')
  return `${prefix}-${year}-${num}`
}

function clean(obj) {
  if (!obj) return obj
  const { _id, ...rest } = obj
  return rest
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    if ((route === '/' || route === '/root') && method === 'GET') {
      return json({ message: 'Sistema de Evaluación de Enfermería API' })
    }

    // ---------------- CONFIG ----------------
    if (route === '/config' && method === 'GET') {
      return json(await getConfig(db))
    }
    if (route === '/config' && (method === 'PUT' || method === 'POST')) {
      const body = await request.json()
      const { _id, id, ...updates } = body
      await db.collection('config').updateOne(
        { id: CONFIG_ID },
        { $set: { ...updates, id: CONFIG_ID } },
        { upsert: true }
      )
      return json(await getConfig(db))
    }

    // ---------------- EMPLOYEES ----------------
    if (route === '/employees' && method === 'GET') {
      const list = await db.collection('employees').find({}).sort({ nombre: 1 }).toArray()
      return json(list.map(clean))
    }
    if (route === '/employees' && method === 'POST') {
      const body = await request.json()
      if (!body.nombre || !body.numeroEmpleado) {
        return json({ error: 'Nombre y Número de Empleado son obligatorios' }, 400)
      }
      const emp = {
        id: uuidv4(),
        nombre: body.nombre,
        numeroEmpleado: body.numeroEmpleado,
        categoria: body.categoria || '',
        horario: body.horario || '',
        createdAt: new Date(),
      }
      await db.collection('employees').insertOne(emp)
      return json(clean(emp))
    }
    if (route.startsWith('/employees/') && method === 'PUT') {
      const id = path[1]
      const body = await request.json()
      const { _id, id: _ignore, ...updates } = body
      await db.collection('employees').updateOne({ id }, { $set: updates })
      const emp = await db.collection('employees').findOne({ id })
      return json(clean(emp))
    }
    if (route.startsWith('/employees/') && method === 'DELETE') {
      const id = path[1]
      await db.collection('employees').deleteOne({ id })
      return json({ success: true })
    }

    // ---------------- EVALUATIONS ----------------
    if (route === '/evaluations' && method === 'GET') {
      const list = await db.collection('evaluations').find({}).sort({ createdAt: -1 }).toArray()
      const cleaned = list.map((e) => {
        const c = clean(e)
        const { general } = computeGeneral(c.scores || {})
        return {
          id: c.id,
          folio: c.folio,
          empleadoNombre: c.empleadoNombre,
          numeroEmpleado: c.numeroEmpleado,
          categoria: c.categoria,
          horario: c.horario,
          anio: c.anio,
          status: c.status,
          currentStep: c.currentStep,
          general: general != null ? Number(general.toFixed(1)) : null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }
      })
      return json(cleaned)
    }
    if (route === '/evaluations' && method === 'POST') {
      const body = await request.json()
      if (!body.empleadoId) return json({ error: 'Debe seleccionar un empleado' }, 400)
      const emp = await db.collection('employees').findOne({ id: body.empleadoId })
      if (!emp) return json({ error: 'Empleado no encontrado' }, 404)
      const cfg = await getConfig(db)
      const anio = body.anio || cfg.anio
      const folio = await nextFolio(db, cfg.prefijoFolio || 'EVAL', anio)
      const ev = {
        id: uuidv4(),
        folio,
        empleadoId: emp.id,
        empleadoNombre: emp.nombre,
        numeroEmpleado: emp.numeroEmpleado,
        categoria: emp.categoria,
        horario: emp.horario,
        anio,
        scores: {},
        attendance: {},
        anecdotario: {},
        status: 'borrador',
        currentStep: 1,
        driveFileId: '',
        driveUrl: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await db.collection('evaluations').insertOne(ev)
      return json(clean(ev))
    }
    if (route.startsWith('/evaluations/') && path.length === 2 && method === 'GET') {
      const id = path[1]
      const ev = await db.collection('evaluations').findOne({ id })
      if (!ev) return json({ error: 'Evaluación no encontrada' }, 404)
      return json(clean(ev))
    }
    if (route.startsWith('/evaluations/') && path.length === 2 && (method === 'PUT' || method === 'PATCH')) {
      const id = path[1]
      const body = await request.json()
      const { _id, id: _ignore, createdAt, ...updates } = body
      updates.updatedAt = new Date()
      await db.collection('evaluations').updateOne({ id }, { $set: updates })
      const ev = await db.collection('evaluations').findOne({ id })
      return json(clean(ev))
    }
    if (route.startsWith('/evaluations/') && path.length === 2 && method === 'DELETE') {
      const id = path[1]
      await db.collection('evaluations').deleteOne({ id })
      return json({ success: true })
    }

    // ---------------- PDF ----------------
    if (route.startsWith('/evaluations/') && path[2] === 'pdf' && method === 'GET') {
      const id = path[1]
      const ev = await db.collection('evaluations').findOne({ id })
      if (!ev) return json({ error: 'Evaluación no encontrada' }, 404)
      const cfg = await getConfig(db)
      const bytes = await generateEvaluationPDF(clean(ev), cfg)
      const safeName = String(ev.empleadoNombre || 'EMPLEADO')
        .toUpperCase()
        .replace(/[^A-Z0-9ÁÉÍÓÚÑ ]/g, '')
        .trim()
        .replace(/\s+/g, '_')
      const filename = `${ev.folio}_${safeName}.pdf`
      const res = new NextResponse(Buffer.from(bytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      })
      return handleCORS(res)
    }

    // ---------------- DASHBOARD ----------------
    if (route === '/dashboard' && method === 'GET') {
      const employees = await db.collection('employees').countDocuments()
      const evals = await db.collection('evaluations').find({}).toArray()
      let completed = 0
      let draft = 0
      let sumGeneral = 0
      let countGeneral = 0
      evals.forEach((e) => {
        if (e.status === 'finalizada') completed += 1
        else draft += 1
        const { general } = computeGeneral(e.scores || {})
        if (general != null) {
          sumGeneral += general
          countGeneral += 1
        }
      })
      const recent = evals
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6)
        .map((e) => {
          const { general } = computeGeneral(e.scores || {})
          return {
            id: e.id,
            folio: e.folio,
            empleadoNombre: e.empleadoNombre,
            anio: e.anio,
            status: e.status,
            general: general != null ? Number(general.toFixed(1)) : null,
          }
        })
      return json({
        employees,
        evaluations: evals.length,
        completed,
        draft,
        avgGeneral: countGeneral ? Number((sumGeneral / countGeneral).toFixed(1)) : null,
        recent,
      })
    }

    return json({ error: `Route ${route} not found` }, 404)
  } catch (error) {
    console.error('API Error:', error)
    return json({ error: 'Internal server error', detail: String(error?.message || error) }, 500)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
