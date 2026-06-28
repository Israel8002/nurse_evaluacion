// Shared configuration & calculation logic (pure JS, usable on client & server)

export const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
export const MONTHS_FULL = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

// Evaluation scale
export const SCALE = { E: 10, B: 9, R: 8, D: 7 }
export const SCALE_OPTIONS = ['E', 'B', 'R', 'D']
export const SCALE_LEGEND = 'E = EXCELENTE (10)    B = BIEN (9)    R = REGULAR (8)    D = DEFICIENTE (7)'

export const HORARIOS = ['TM', 'TV', 'TNA', 'TNB', 'JAD', 'JAN']

// Sections in WIZARD order (each has the step number it appears on)
export const SECTIONS = [
  {
    key: 'competencias', step: 2, title: 'COMPETENCIAS PERSONALES',
    criteria: [
      'Asistencia',
      'Puntualidad',
      'Presentación',
      'Planifica sus actividades',
      'Responsabilidad',
      'Disciplina',
      'Discreción',
      'Espíritu de superación',
    ],
  },
  {
    key: 'trabajoEquipo', step: 3, title: 'TRABAJO EN EQUIPO',
    criteria: [
      'Muestra aptitud para integrarse al equipo',
      'Se identifica fácilmente con los objetivos del equipo',
    ],
  },
  {
    key: 'orientacion', step: 4, title: 'ORIENTACIÓN DE RESULTADO EN SUS PROCESOS',
    criteria: [
      'Termina su trabajo oportunamente',
      'Ejecuta el PAE acorde a sus pacientes',
      'Cumple con las tareas que se le encomienda',
    ],
  },
  {
    key: 'relaciones', step: 5, title: 'RELACIONES INTERPERSONALES',
    criteria: [
      'Se muestra cortés con el personal y con sus compañeros',
      'Brinda una adecuada orientación a sus compañeros, pacientes y familiares',
      'Evita los conflictos dentro del trabajo',
      'Relación con jefes',
    ],
  },
  {
    key: 'desempeno', step: 6, title: 'DESEMPEÑO',
    criteria: [
      'Es EFICAZ en el resultado de su trabajo',
      'Es COMPETENTE en su trabajo y no requiere de supervisión',
      'Hace uso EFICIENTE de los recursos materiales',
      'Es PRODUCTIVO en el desempeño de su trabajo',
      'Su ACTITUD profesional le ayuda a superar las crisis laborales',
    ],
  },
  {
    key: 'experiencia', step: 7, title: 'EXPERIENCIA EN SU CARGO',
    criteria: [
      'Propone nuevas ideas para mejorar los procesos',
      'Se muestra asequible al cambio',
      'Se anticipa a las dificultades',
      'Tiene gran capacidad para resolver problemas',
    ],
  },
]

// PDF layout: left & right column blocks (matching institutional format)
export const PDF_LEFT_BLOCK = ['competencias', 'orientacion', 'relaciones']
export const PDF_RIGHT_BLOCK = ['trabajoEquipo', 'desempeno', 'experiencia']

export const ATTENDANCE_KEYS = [
  { code: 'A', label: 'Asistencia' },
  { code: 'F', label: 'Falta' },
  { code: 'I', label: 'Incapacidad' },
  { code: 'V', label: 'Vacaciones' },
  { code: 'D/O', label: 'Día Otorgado' },
  { code: 'P/A', label: 'Permiso Académico' },
  { code: 'B/A', label: 'Beca Académica' },
  { code: 'C/M', label: 'Cuidados Maternos' },
  { code: 'R', label: 'Regreso' },
]
export const ATTENDANCE_CODES = ATTENDANCE_KEYS.map((k) => k.code)

export const WIZARD_STEPS = [
  { n: 1, label: 'Datos Generales' },
  { n: 2, label: 'Competencias Personales' },
  { n: 3, label: 'Trabajo en Equipo' },
  { n: 4, label: 'Orientación de Resultado' },
  { n: 5, label: 'Relaciones Interpersonales' },
  { n: 6, label: 'Desempeño' },
  { n: 7, label: 'Experiencia en su Cargo' },
  { n: 8, label: 'Control de Asistencias' },
  { n: 9, label: 'Anecdotario y Observaciones' },
  { n: 10, label: 'Resumen Final' },
]

// ---------- Calendar helpers ----------
export function isLeap(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}
export function daysInMonth(year, monthIndex) {
  return [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][monthIndex]
}

// ---------- Calculation helpers ----------
// scores shape: { [sectionKey]: { [criterionIndex]: ['E','',...12] } }

export function computeSection(section, sectionScores) {
  const monthly = [] // 12 values or null (average of criteria filled that month)
  for (let m = 0; m < 12; m++) {
    let sum = 0
    let count = 0
    section.criteria.forEach((_c, ci) => {
      const letter = sectionScores?.[ci]?.[m]
      if (letter && SCALE[letter]) {
        sum += SCALE[letter]
        count += 1
      }
    })
    monthly.push(count > 0 ? sum / count : null)
  }
  const filled = monthly.filter((v) => v !== null)
  const total = filled.reduce((a, b) => a + b, 0)
  const promedio = filled.length > 0 ? total / filled.length : null
  return { monthly, total, promedio }
}

export function computeCriterion(letters) {
  const vals = (letters || []).map((l) => SCALE[l]).filter((v) => v)
  const total = vals.reduce((a, b) => a + b, 0)
  const promedio = vals.length ? total / vals.length : null
  return { total, promedio }
}

export function computeGeneral(scores) {
  const sectionResults = {}
  SECTIONS.forEach((s) => {
    sectionResults[s.key] = computeSection(s, (scores && scores[s.key]) || {})
  })
  const proms = Object.values(sectionResults).map((r) => r.promedio).filter((v) => v !== null)
  const general = proms.length ? proms.reduce((a, b) => a + b, 0) / proms.length : null
  return { sectionResults, general }
}

// Completion percentage across all 10 steps (used for progress bar)
export function computeProgress(evaluation) {
  if (!evaluation) return 0
  let totalCriteria = 0
  let filledCriteria = 0
  SECTIONS.forEach((s) => {
    s.criteria.forEach((_c, ci) => {
      totalCriteria += 1
      const arr = evaluation?.scores?.[s.key]?.[ci] || []
      // a criterion counts as filled if at least one month has a value
      if (arr.some((v) => v)) filledCriteria += 1
    })
  })
  // weight: steps 2-7 scores = 70%, attendance = 15%, anecdotario = 15%
  const scorePct = totalCriteria ? (filledCriteria / totalCriteria) * 70 : 0
  const att = evaluation?.attendance || {}
  let attFilled = 0
  for (let m = 0; m < 12; m++) {
    if (att[m] && Object.values(att[m]).some((v) => v)) attFilled += 1
  }
  const attPct = (attFilled / 12) * 15
  const anec = evaluation?.anecdotario || {}
  let anecFilled = 0
  for (let m = 0; m < 12; m++) {
    if (anec[m] && String(anec[m]).trim()) anecFilled += 1
  }
  const anecPct = (anecFilled / 12) * 15
  return Math.round(scorePct + attPct + anecPct)
}

export function fmt(v, dec = 1) {
  if (v === null || v === undefined || v === '') return ''
  return Number(v).toFixed(dec)
}
