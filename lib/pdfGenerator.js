import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import {
  MONTHS,
  MONTHS_FULL,
  SECTIONS,
  PDF_LEFT_BLOCK,
  PDF_RIGHT_BLOCK,
  SCALE_LEGEND,
  ATTENDANCE_KEYS,
  daysInMonth,
  computeGeneral,
  computeCriterion,
  computeSection,
  fmt,
} from './evalConfig'

const BLACK = rgb(0, 0, 0)
const BORDER = rgb(0.45, 0.45, 0.45)
const GRAY_BG = rgb(0.9, 0.9, 0.9)
const DARK_BG = rgb(0.82, 0.85, 0.9)
const TITLE_BG = rgb(0.74, 0.79, 0.88)

function fit(text, font, size, maxW) {
  text = String(text ?? '')
  if (font.widthOfTextAtSize(text, size) <= maxW) return text
  while (text.length > 1 && font.widthOfTextAtSize(text + '…', size) > maxW) {
    text = text.slice(0, -1)
  }
  return text + '…'
}

function wrapText(text, font, size, maxW) {
  const words = String(text ?? '').split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (font.widthOfTextAtSize(test, size) > maxW && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function generateEvaluationPDF(ev, config) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontB = await doc.embedFont(StandardFonts.HelveticaBold)

  let logoImage = null
  if (config?.logo) {
    try {
      if (config.logo.startsWith('data:image/png;base64,')) {
        const base64Data = config.logo.replace(/^data:image\/png;base64,/, '')
        const imageBytes = Buffer.from(base64Data, 'base64')
        if (imageBytes[0] === 0x89 && imageBytes[1] === 0x50 && imageBytes[2] === 0x4E && imageBytes[3] === 0x47) {
          logoImage = await doc.embedPng(imageBytes)
        } else {
          logoImage = await doc.embedJpg(imageBytes)
        }
      } else if (config.logo.startsWith('data:image/jpeg;base64,') || config.logo.startsWith('data:image/jpg;base64,')) {
        const base64Data = config.logo.replace(/^data:image\/j(peg|pg);base64,/, '')
        const imageBytes = Buffer.from(base64Data, 'base64')
        logoImage = await doc.embedJpg(imageBytes)
      }
    } catch (e) {
      console.error('Failed to embed logo image:', e)
    }
  }

  const { sectionResults, general } = computeGeneral(ev.scores || {})

  // generic cell drawer. y = TOP of cell.
  function cell(page, x, y, w, h, text, opts = {}) {
    const { size = 6, align = 'center', bold = false, color = BLACK, bg, valign = 'middle' } = opts
    const rectOpts = { x, y: y - h, width: w, height: h, borderColor: BORDER, borderWidth: 0.5 }
    if (bg) rectOpts.color = bg
    page.drawRectangle(rectOpts)
    if (text !== undefined && text !== null && text !== '') {
      const f = bold ? fontB : font
      const t = fit(text, f, size, w - 3)
      const tw = f.widthOfTextAtSize(t, size)
      let tx = x + 2
      if (align === 'center') tx = x + (w - tw) / 2
      if (align === 'right') tx = x + w - tw - 2
      const ty = y - h + (h - size) / 2 + 1
      page.drawText(t, { x: tx, y: ty, size, font: f, color })
    }
  }

  function text(page, x, y, str, opts = {}) {
    const { size = 7, bold = false, color = BLACK, align = 'left' } = opts
    const f = bold ? fontB : font
    const tw = f.widthOfTextAtSize(String(str), size)
    let tx = x
    if (align === 'center') tx = x - tw / 2
    if (align === 'right') tx = x - tw
    page.drawText(String(str), { x: tx, y, size, font: f, color })
  }

  // ---------------- PAGE 1: Evaluation form (landscape) ----------------
  const W = 792
  const H = 612
  const page = doc.addPage([W, H])
  const M = 18

  // Header
  let top = H - M
  // logo box left
  page.drawRectangle({ x: M, y: top - 46, width: 70, height: 46, borderColor: BORDER, borderWidth: 0.8 })
  if (logoImage) {
    const { width: imgW, height: imgH } = logoImage.scale(1)
    const maxW = 68
    const maxH = 44
    const scale = Math.min(maxW / imgW, maxH / imgH)
    const drawW = imgW * scale
    const drawH = imgH * scale
    const dx = M + (70 - drawW) / 2
    const dy = (top - 46) + (46 - drawH) / 2
    page.drawImage(logoImage, {
      x: dx,
      y: dy,
      width: drawW,
      height: drawH,
    })
  } else {
    text(page, M + 35, top - 20, 'ISSSTECALI', { size: 9, bold: true, align: 'center' })
    text(page, M + 35, top - 32, 'LOGO', { size: 6, align: 'center', color: rgb(0.5, 0.5, 0.5) })
  }

  text(page, W / 2, top - 8, 'SUBDIRECCIÓN GENERAL MÉDICA', { size: 8, bold: true, align: 'center' })
  text(page, W / 2, top - 19, 'COORDINACIÓN ESTATAL DE ENFERMERÍA', { size: 8, bold: true, align: 'center' })
  text(page, W / 2, top - 30, 'DEPARTAMENTO DE ENFERMERÍA', { size: 8, bold: true, align: 'center' })
  text(page, W / 2, top - 44, 'HOJA DE EVALUACIÓN ANUAL DE PERSONAL DE ENFERMERÍA', { size: 10, bold: true, align: 'center' })

  // right: folio + año
  text(page, W - M, top - 8, `FOLIO: ${ev.folio || ''}`, { size: 8, bold: true, align: 'right' })
  text(page, W - M, top - 20, `AÑO: ${ev.anio || config?.anio || ''}`, { size: 8, align: 'right' })

  // Employee info row
  let iy = top - 56
  const infoH = 14
  const empName = (ev.empleadoNombre || '').toUpperCase()
  // Row of labeled cells spanning width
  const fields = [
    { l: 'NOMBRE', v: empName, w: 220 },
    { l: 'CATEGORÍA', v: ev.categoria || '', w: 130 },
    { l: 'HORARIO', v: ev.horario || '', w: 60 },
    { l: 'No. EMP', v: ev.numeroEmpleado || '', w: 80 },
    { l: 'UNIDAD MÉDICA', v: config?.unidadMedica || '', w: 170 },
    { l: 'CLAVE', v: config?.claveUnidad || '', w: 55 },
    { l: 'CALIF.', v: general != null ? fmt(general) : '', w: 41 },
  ]
  let fx = M
  for (const f of fields) {
    const lw = font.widthOfTextAtSize(f.l + ': ', 6.5)
    cell(page, fx, iy, f.w, infoH, '', {})
    text(page, fx + 3, iy - infoH + 4.5, f.l + ':', { size: 6, bold: true })
    text(page, fx + 3 + lw, iy - infoH + 4.5, fit(String(f.v), fontB, 7, f.w - lw - 6), { size: 7, bold: true, color: rgb(0.05, 0.15, 0.45) })
    fx += f.w
  }

  // Table blocks
  const tableTop = iy - infoH - 6
  const labelW = 116
  const monthW = 15.6
  const totalW = 17
  const promW = 19
  const rowH = 10
  const blockW = labelW + monthW * 12 + totalW + promW // ~ 374
  const gap = W - 2 * M - 2 * blockW // remaining gap between blocks

  function renderBlock(x, sectionKeys) {
    let y = tableTop
    // header row
    cell(page, x, y, labelW, rowH, 'CRITERIO', { bold: true, size: 6, bg: DARK_BG, align: 'left' })
    for (let m = 0; m < 12; m++) {
      cell(page, x + labelW + m * monthW, y, monthW, rowH, MONTHS[m], { bold: true, size: 5, bg: DARK_BG })
    }
    cell(page, x + labelW + 12 * monthW, y, totalW, rowH, 'TOT', { bold: true, size: 5, bg: DARK_BG })
    cell(page, x + labelW + 12 * monthW + totalW, y, promW, rowH, 'PROM', { bold: true, size: 5, bg: DARK_BG })
    y -= rowH

    for (const key of sectionKeys) {
      const section = SECTIONS.find((s) => s.key === key)
      const res = sectionResults[key]
      // section title row (spans block)
      cell(page, x, y, blockW, rowH, section.title, { bold: true, size: 6.5, bg: TITLE_BG, align: 'left' })
      y -= rowH
      // criteria rows
      section.criteria.forEach((crit, ci) => {
        cell(page, x, y, labelW, rowH, crit, { size: 5.3, align: 'left' })
        const letters = ev.scores?.[key]?.[ci] || []
        for (let m = 0; m < 12; m++) {
          cell(page, x + labelW + m * monthW, y, monthW, rowH, letters[m] || '', { size: 6, bold: true })
        }
        const cc = computeCriterion(letters)
        cell(page, x + labelW + 12 * monthW, y, totalW, rowH, cc.total ? String(cc.total) : '', { size: 5.5 })
        cell(page, x + labelW + 12 * monthW + totalW, y, promW, rowH, fmt(cc.promedio), { size: 5.5 })
        y -= rowH
      })
      // CALIFICACIÓN row (section monthly averages)
      cell(page, x, y, labelW, rowH, 'CALIFICACIÓN', { bold: true, size: 5.6, bg: GRAY_BG, align: 'left' })
      for (let m = 0; m < 12; m++) {
        cell(page, x + labelW + m * monthW, y, monthW, rowH, fmt(res.monthly[m]), { size: 5, bold: true, bg: GRAY_BG })
      }
      cell(page, x + labelW + 12 * monthW, y, totalW, rowH, fmt(res.total), { size: 5, bold: true, bg: GRAY_BG })
      cell(page, x + labelW + 12 * monthW + totalW, y, promW, rowH, fmt(res.promedio), { size: 5.5, bold: true, bg: GRAY_BG })
      y -= rowH
    }
    return y
  }

  const leftBottom = renderBlock(M, PDF_LEFT_BLOCK)
  const rightBottom = renderBlock(M + blockW + gap, PDF_RIGHT_BLOCK)
  const tableBottom = Math.min(leftBottom, rightBottom)

  // Legend + Promedio general
  let by = tableBottom - 14
  text(page, M, by, SCALE_LEGEND, { size: 7, bold: true })
  // promedio general box
  const pgw = 200
  cell(page, W - M - pgw, by - 4, pgw, 16, '', { bg: TITLE_BG })
  text(page, W - M - pgw + 5, by, 'PROMEDIO GENERAL:', { size: 8, bold: true })
  text(page, W - M - 6, by, general != null ? fmt(general) : '—', { size: 11, bold: true, align: 'right', color: rgb(0.05, 0.25, 0.1) })

  // Signatures
  const sy = 70
  const sigW = 200
  const positions = [M + 40, W / 2 - sigW / 2, W - M - sigW - 40]
  const labels = ['SUPERVISORA DE ENFERMERÍA', 'JEFATURA DE ENFERMERÍA', 'NOMBRE Y FIRMA DEL INTERESADO']
  const names = [config?.supervisor || '', config?.jefatura || '', empName]
  positions.forEach((px, i) => {
    page.drawLine({ start: { x: px, y: sy }, end: { x: px + sigW, y: sy }, thickness: 0.8, color: BLACK })
    text(page, px + sigW / 2, sy + 4, names[i], { size: 7, bold: true, align: 'center' })
    text(page, px + sigW / 2, sy - 11, labels[i], { size: 7, align: 'center' })
  })

  // ---------------- PAGE 2: Attendance control (landscape) ----------------
  const p2 = doc.addPage([W, H])
  let t2 = H - M
  text(p2, W / 2, t2 - 8, 'COORDINACIÓN ESTATAL DE ENFERMERÍA  -  DEPARTAMENTO DE ENFERMERÍA', { size: 8, bold: true, align: 'center' })
  text(p2, W / 2, t2 - 22, 'HOJA DE EVALUACIÓN ANUAL DE PERSONAL DE ENFERMERÍA', { size: 10, bold: true, align: 'center' })
  text(p2, W / 2, t2 - 34, 'CONTROL DE ASISTENCIAS', { size: 9, bold: true, align: 'center' })
  text(p2, M, t2 - 34, `${empName}  |  No. EMP: ${ev.numeroEmpleado || ''}`, { size: 7, bold: true })
  text(p2, W - M, t2 - 34, `AÑO: ${ev.anio || ''}`, { size: 8, bold: true, align: 'right' })

  const aTop = t2 - 44
  const mLabelW = 46
  const dayW = (W - 2 * M - mLabelW) / 31
  const aRowH = 15
  // header (day numbers + weekday letters under them)
  cell(p2, M, aTop, mLabelW, aRowH * 2, 'MES', { bold: true, size: 7, bg: DARK_BG })
  for (let d = 1; d <= 31; d++) {
    cell(p2, M + mLabelW + (d - 1) * dayW, aTop, dayW, aRowH, String(d), { bold: true, size: 6, bg: DARK_BG })
  }
  let ay = aTop - aRowH
  const year = ev.anio || config?.anio || new Date().getFullYear()
  const firstDay = new Date(year, 0, 1).getDay() // 0 = Sun, 1 = Mon, ...
  const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
  for (let d = 1; d <= 31; d++) {
    const dayOfWeek = (firstDay + d - 1) % 7
    const letter = WEEKDAYS[dayOfWeek]
    cell(p2, M + mLabelW + (d - 1) * dayW, ay, dayW, aRowH, letter, { bold: true, size: 5.5, bg: DARK_BG })
  }
  ay -= aRowH

  for (let m = 0; m < 12; m++) {
    cell(p2, M, ay, mLabelW, aRowH, MONTHS[m], { bold: true, size: 7, bg: GRAY_BG, align: 'left' })
    const dim = daysInMonth(year, m)
    const monthData = ev.attendance?.[m] || {}
    for (let d = 1; d <= 31; d++) {
      if (d > dim) {
        cell(p2, M + mLabelW + (d - 1) * dayW, ay, dayW, aRowH, '', { bg: rgb(0.78, 0.78, 0.78) })
      } else {
        cell(p2, M + mLabelW + (d - 1) * dayW, ay, dayW, aRowH, monthData[d] || '', { size: 6, bold: true })
      }
    }
    ay -= aRowH
  }
  // claves legend
  let cy = ay - 16
  text(p2, M, cy, 'CLAVES DE ASISTENCIA:', { size: 8, bold: true })
  cy -= 13
  let clx = M
  ATTENDANCE_KEYS.forEach((k, i) => {
    const str = `${k.code} = ${k.label}`
    text(p2, clx, cy, str, { size: 7 })
    clx += font.widthOfTextAtSize(str, 7) + 18
    if ((i + 1) % 5 === 0) {
      cy -= 12
      clx = M
    }
  })

  // ---------------- PAGES 3+: Anecdotario (portrait) ----------------
  const PW = 612
  const PH = 792
  let p3 = doc.addPage([PW, PH])
  let ty3 = PH - 30
  text(p3, PW / 2, ty3, 'ANECDOTARIO, COMPROMISOS Y OBSERVACIONES', { size: 11, bold: true, align: 'center' })
  ty3 -= 14
  text(p3, PW / 2, ty3, `${empName}  -  AÑO ${ev.anio || ''}`, { size: 8, bold: true, align: 'center' })
  ty3 -= 18
  const mInfoW = PW - 60
  const boxX = 30
  for (let m = 0; m < 12; m++) {
    const content = ev.anecdotario?.[m] || ''
    const lines = wrapText(content, font, 8, mInfoW - 90)
    const contentH = Math.max(34, lines.length * 10 + 12)
    if (ty3 - contentH < 50) {
      p3 = doc.addPage([PW, PH])
      ty3 = PH - 40
    }
    // month label cell
    cell(p3, boxX, ty3, 70, contentH, MONTHS_FULL[m], { bold: true, size: 8, bg: GRAY_BG })
    // content cell
    cell(p3, boxX + 70, ty3, mInfoW - 70, contentH, '', {})
    lines.forEach((ln, li) => {
      text(p3, boxX + 76, ty3 - 12 - li * 10, ln, { size: 8 })
    })
    ty3 -= contentH
  }

  const bytes = await doc.save()
  return bytes
}
