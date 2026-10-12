import {
  buildRiskAssessmentSummary,
  CQI_STEP_META,
  MISSION_ALIGNMENT_FIXED_ITEMS,
  resolveCqiPlans,
  resolveRiskAssessments,
  STRATEGY_MED_UP_FIXED_ITEMS,
  riskLevel,
  riskScore,
  VISION_FACULTY_FOCUS_ITEMS,
  type CqiDevelopmentPlan,
  type UnitProfileWorksheet,
} from '@/app/service-profile/worksheet-types'

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function listHtml(label: string, items: string[], numbered = true) {
  const rows = items
    .map((item, i) => {
      const prefix = numbered ? `${i + 1})` : ''
      return `<tr><td style="width:24px;vertical-align:top">${prefix}</td><td>${esc(item || '—')}</td></tr>`
    })
    .join('')
  return `<p style="font-weight:bold;margin:8px 0 4px">${esc(label)}</p><table style="width:100%;border-collapse:collapse">${rows}</table>`
}

function fieldHtml(label: string, value: string) {
  return `<tr><td style="width:140px;font-weight:bold;padding:4px 8px 4px 0;vertical-align:top">${esc(label)}</td><td style="padding:4px 0">${esc(value || '—')}</td></tr>`
}

function fieldHighlightHtml(label: string, value: string) {
  return `<tr><td style="width:140px;font-weight:bold;padding:4px 8px 4px 0;vertical-align:top">${esc(label)}</td><td style="padding:4px 0"><div style="border:1px solid #a67c52;background:#fff5ee;border-radius:6px;padding:10px;line-height:1.5;white-space:pre-wrap">${esc(value || '—')}</div></td></tr>`
}

function sectionHtml(title: string, body: string, color = '#1e5a9e', id?: string) {
  const idAttr = id ? ` id="${id}"` : ''
  return `
    <div${idAttr} style="margin-bottom:16px;page-break-inside:avoid;break-inside:avoid">
      <div style="background:${color};color:#fff;font-weight:bold;padding:6px 10px;font-size:15px">${esc(title)}</div>
      <div style="border:1px solid #ddd;border-top:none;padding:10px;font-size:14px">${body}</div>
    </div>`
}

function riskMatrixHtml(cells: UnitProfileWorksheet['riskCells']) {
  const selected = new Set(cells.map((c) => `${c.likelihood}-${c.consequence}`))
  let rows = ''
  for (let l = 5; l >= 1; l--) {
    let tds = `<td style="border:1px solid #ccc;padding:4px;font-weight:bold">${l}</td>`
    for (let c = 1; c <= 5; c++) {
      const score = riskScore(l, c)
      const active = selected.has(`${l}-${c}`)
      tds += `<td style="border:1px solid #ccc;padding:4px;text-align:center;${active ? 'background:#dbeafe;font-weight:bold' : ''}">${score}</td>`
    }
    rows += `<tr>${tds}</tr>`
  }
  const header =
    '<tr><td style="border:1px solid #ccc"></td>' +
    [1, 2, 3, 4, 5].map((c) => `<th style="border:1px solid #ccc;padding:4px">${c}</th>`).join('') +
    '</tr>'
  return `<table style="border-collapse:collapse;width:100%;font-size:12px">${header}${rows}</table>`
}

function cqiYearHtml(year: string, rows: { topic: string; result: string }[]) {
  const body = rows
    .map(
      (r, i) =>
        `<tr><td style="border:1px solid #ccc;padding:4px;text-align:center">${i + 1})</td><td style="border:1px solid #ccc;padding:4px">${esc(r.topic || '—')}</td><td style="border:1px solid #ccc;padding:4px">${esc(r.result || '—')}</td></tr>`
    )
    .join('')
  return `<div style="flex:1;min-width:140px"><p style="text-align:center;font-weight:bold;color:#1e5a9e">${year}</p><table style="width:100%;border-collapse:collapse;font-size:12px"><tr style="background:#f3f4f6"><th style="border:1px solid #ccc;padding:4px"></th><th style="border:1px solid #ccc;padding:4px">Topic</th><th style="border:1px solid #ccc;padding:4px">Result</th></tr>${body}</table></div>`
}

export function buildWorksheetHtml(
  data: UnitProfileWorksheet,
  options?: { logoUrl?: string }
): string {
  const displayDate = data.date
    ? new Date(data.date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })
    : '—'

  const logoUrl = options?.logoUrl ?? '/logo2.png'
  const logoCell = `<td style="width:56px;vertical-align:top;padding-right:12px"><img src="${esc(logoUrl)}" alt="โรงพยาบาลมหาวิทยาลัยพะเยา" width="48" height="48" style="display:block;object-fit:contain" /></td>`

  const facultyFocusHtml = `<tr><td colspan="2" style="padding:6px 0 8px"><div style="border:1px solid #a67c52;background:#fff5ee;border-radius:6px;padding:10px"><p style="font-weight:bold;color:#0a4d68;margin:0 0 6px">เข็มมุ่ง (Focus area)</p><ul style="margin:0;padding-left:18px;line-height:1.5">${VISION_FACULTY_FOCUS_ITEMS.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div></td></tr>`

  const unitInfo = `<table style="width:100%">${fieldHtml('Unit :', data.unit)}${fieldHtml('Vision - Faculty :', data.visionFaculty)}${fieldHighlightHtml('Vision - Hospital :', data.visionHospital)}${facultyFocusHtml}${fieldHighlightHtml('Core Value :', data.coreValue)}</table>`

  const mission = `<table style="width:100%"><tr><td style="width:50%;vertical-align:top;padding-right:8px">${listHtml('Mission (in Alignment with Organization)', [...MISSION_ALIGNMENT_FIXED_ITEMS])}</td><td style="width:50%;vertical-align:top">${listHtml('Mission (of Unit)', data.missionOfUnit)}</td></tr></table>`

  const strategy = `<table style="width:100%"><tr><td style="width:50%;vertical-align:top;padding-right:8px">${listHtml('Strategy (MED UP)', [...STRATEGY_MED_UP_FIXED_ITEMS], false)}</td><td style="width:50%;vertical-align:top">${listHtml('Unit Strategy', data.unitStrategy)}</td></tr></table>`
  const riskSection = resolveRiskAssessments(data)
    .map((assessment, index) => {
      const summary = buildRiskAssessmentSummary(assessment.cells)
      const heading = `<div style="margin:${index === 0 ? '0' : '14px'} 0 8px;padding:8px 10px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:6px">
        <p style="margin:0;font-weight:bold;font-size:14px;color:#0f172a">หัวข้อที่ ${index + 1}${assessment.topic.trim() ? ` — ${esc(assessment.topic.trim())}` : ''}</p>
      </div>`
      return `${heading}<table style="width:100%;margin-bottom:4px">${fieldHtml('หัวข้อประเมิน :', assessment.topic)}${fieldHighlightHtml('สรุปค่าประเมิน :', summary)}</table><div style="margin-top:8px">${riskMatrixHtml(assessment.cells)}</div>`
    })
    .join('')

  const cqiStepColors = ['#fce7f3', '#ffedd5', '#fef9c3', '#dcfce7', '#ccfbf1']
  const cqiStepBorders = ['#f9a8d4', '#fdba74', '#fde047', '#86efac', '#5eead4']

  const renderCqiPlanSteps = (plan: CqiDevelopmentPlan) => `<div style="display:table;width:100%;table-layout:fixed;border-collapse:collapse;margin-top:10px">
    <div style="display:table-row">
      ${CQI_STEP_META.map((step, i) => {
        const hints = step.hints
          .map((h) => `<li style="margin:0 0 4px;line-height:1.35">${esc(h)}</li>`)
          .join('')
        return `<div style="display:table-cell;width:20%;vertical-align:top;padding:8px;border:1px solid ${cqiStepBorders[i]};background:${cqiStepColors[i]}">
          <p style="font-weight:bold;font-size:13px;margin:0 0 8px;line-height:1.3">${esc(step.title)}</p>
          <ul style="margin:0 0 10px;padding-left:16px;font-size:12px">${hints}</ul>
          <p style="margin:0;font-size:13px;white-space:pre-wrap;line-height:1.35;min-height:48px">${esc(plan.steps[i]?.content || '—')}</p>
        </div>`
      }).join('')}
    </div>
  </div>`

  const cqiPlans = resolveCqiPlans(data)
  const cqiPlan = cqiPlans
    .map((plan, index) => {
      const heading = `<div style="margin:${index === 0 ? '0' : '16px'} 0 8px;padding:8px 10px;border:1px solid #fecdd3;background:#fff1f2;border-radius:6px">
        <p style="margin:0;font-weight:bold;font-size:14px;color:#9f1239">โครงการที่ ${index + 1}${plan.title.trim() ? ` — ${esc(plan.title.trim())}` : ''}${plan.year.trim() ? ` · Year ${esc(plan.year.trim())}` : ''}</p>
      </div>`
      const fields = `<table style="width:100%;margin-bottom:4px">${fieldHtml('CQI Title (ชื่อเรื่อง CQI) :', plan.title)}${fieldHtml('Owner/Responsible (ผู้รับผิดชอบ) :', plan.owner)}${fieldHtml('Objective (วัตถุประสงค์) :', plan.objective)}${fieldHtml('Timeline (ระยะเวลา) :', plan.timeline)}</table>`
      return `${heading}${fields}${renderCqiPlanSteps(plan)}`
    })
    .join('')

  const kpi = `<table style="width:100%"><tr><td style="width:50%;vertical-align:top;padding-right:8px">${listHtml('KPI / Key Success Indicators', data.kpiIndicators)}</td><td style="width:50%;vertical-align:top">${listHtml('Results/Target', data.kpiResults)}</td></tr></table>`

  const dali = data.daliFramework
  const daliCell = (title: string, value: string, bg: string, border: string) =>
    `<div style="border:1px solid ${border};background:${bg};border-radius:6px;overflow:hidden">
      <div style="padding:5px 8px;font-weight:bold;font-size:13px;border-bottom:1px solid ${border}">${esc(title)}</div>
      <div style="padding:8px;font-size:13px;white-space:pre-wrap;min-height:40px;line-height:1.35">${esc(value || '—')}</div>
    </div>`

  const daliHtml = `
    <div style="margin-top:10px;border:1px solid #6ee7b7;border-radius:8px;overflow:hidden">
      <div style="background:#059669;color:#fff;font-weight:bold;padding:8px 10px;font-size:15px">การประยุกต์ใช้ 3C - DALI กับการออกแบบการดูแลผู้ป่วย</div>
      <div style="padding:10px">
        ${daliCell('Key Process / Key Population', dali?.keyProcess ?? '', '#f8fafc', '#cbd5e1')}
        <div style="display:table;width:100%;table-layout:fixed;margin-top:8px;border-collapse:separate;border-spacing:6px 0">
          <div style="display:table-row">
            <div style="display:table-cell;width:33%;vertical-align:top;padding:0 3px 0 0">${daliCell('Core Values & Concepts / หลักคิด', dali?.coreValues ?? '', '#ecfdf5', '#6ee7b7')}</div>
            <div style="display:table-cell;width:33%;vertical-align:top;padding:0 3px">${daliCell('Context / บริบท', dali?.context ?? '', '#fff1f2', '#fda4af')}</div>
            <div style="display:table-cell;width:33%;vertical-align:top;padding:0 0 0 3px">${daliCell('Criteria / เกณฑ์', dali?.criteria ?? '', '#ecfdf5', '#6ee7b7')}</div>
          </div>
        </div>
        <div style="display:table;width:100%;table-layout:fixed;margin-top:8px;border-collapse:separate;border-spacing:6px 0">
          <div style="display:table-row">
            <div style="display:table-cell;width:50%;vertical-align:top;padding-right:4px">${daliCell('Purpose / เป้าหมายเชิงรุก', dali?.purpose ?? '', '#fff1f2', '#fda4af')}</div>
            <div style="display:table-cell;width:50%;vertical-align:top;padding-left:4px">${daliCell('Design / ออกแบบ', dali?.design ?? '', '#fef3c7', '#fcd34d')}</div>
          </div>
        </div>
        <p style="margin:10px 0 6px;font-weight:bold;font-size:14px;color:#0369a1">DALI Cycle · Clinical CQI</p>
        <div style="display:table;width:100%;table-layout:fixed;border-collapse:separate;border-spacing:6px 0">
          <div style="display:table-row">
            <div style="display:table-cell;width:25%;vertical-align:top;padding-right:3px">${daliCell('Action / ปฏิบัติ', dali?.action ?? '', '#ecfdf5', '#6ee7b7')}</div>
            <div style="display:table-cell;width:25%;vertical-align:top;padding:0 3px">${daliCell('Learning / ติดตาม', dali?.learning ?? '', '#fff1f2', '#fda4af')}</div>
            <div style="display:table-cell;width:25%;vertical-align:top;padding:0 3px">${daliCell('Improve / ปรับปรุง', dali?.improve ?? '', '#fef3c7', '#fcd34d')}</div>
            <div style="display:table-cell;width:25%;vertical-align:top;padding-left:3px">${daliCell('Spread / ขยายผล', dali?.spread ?? '', '#fef3c7', '#fcd34d')}</div>
          </div>
        </div>
        <div style="display:table;width:100%;table-layout:fixed;margin-top:8px;border-collapse:separate;border-spacing:6px 0">
          <div style="display:table-row">
            <div style="display:table-cell;width:50%;vertical-align:top;padding-right:4px">${daliCell('Patient Care', dali?.patientCare ?? '', '#f0f9ff', '#7dd3fc')}</div>
            <div style="display:table-cell;width:50%;vertical-align:top;padding-left:4px">${daliCell('Monitor & Learning', dali?.monitorLearning ?? '', '#f0f9ff', '#7dd3fc')}</div>
          </div>
        </div>
      </div>
    </div>`

  const cqiProgress = `<div style="display:flex;gap:8px;flex-wrap:wrap">${cqiYearHtml('2023', data.cqiInProgress.y2023)}${cqiYearHtml('2024', data.cqiInProgress.y2024)}${cqiYearHtml('2025', data.cqiInProgress.y2025)}</div>${daliHtml}`

  const bestPractice = `${listHtml('Best Practice / Key Learnings', data.bestPractices)}<p style="margin-top:12px"><strong>Prepared by :</strong> ${esc(data.preparedBy || '—')}</p>`

  // ฟอนต์ราชการไทย TH Sarabun PSK/New — สำรองด้วย Sarabun (เว็บฟอนต์) และฟอนต์ระบบ
  const fontStack =
    '"TH Sarabun New", "TH SarabunPSK", "THSarabunNew", "Sarabun", "Leelawadee UI", Tahoma, "Segoe UI", Arial, sans-serif'

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="th">
<head>
<meta charset="utf-8" />
<title>Unit Profile Worksheet</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
  @page { size: A4 portrait; margin: 1.4cm 1.2cm; }
  * {
    box-sizing: border-box;
    letter-spacing: normal !important;
    word-spacing: normal !important;
    font-kerning: none !important;
    font-variant-ligatures: none !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #111;
    font-family: ${fontStack};
    font-size: 15px;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  body { padding: 20px; width: 754px; }
  table { border-collapse: collapse; }
  td, th, p, div, span, li, h1, strong {
    font-family: ${fontStack} !important;
    letter-spacing: normal !important;
  }
  h1 { color: #1e5a9e; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.25; }
  .subtitle { color: #1e5a9e; font-weight: 700; margin-top: 4px; font-size: 16px; line-height: 1.35; }
  img { display: block; max-width: 100%; }
</style>
</head>
<body>
  <table style="width:100%;margin-bottom:20px;border-bottom:2px solid #1e5a9e33">
    <tr>
      ${logoCell}
      <td style="vertical-align:top">
        <h1>UNIT PROFILE</h1>
        <div class="subtitle"></div>
      </td>
      <td style="text-align:right;vertical-align:top;font-size:15px">
        <div><strong>Date :</strong> ${esc(displayDate)}</div>
        <div><strong>Unit :</strong> ${esc(data.unitHeader || '—')}</div>
      </td>
    </tr>
  </table>
  <div id="pdf-main">
    <table style="width:100%"><tr>
      <td style="width:50%;vertical-align:top;padding-right:10px">
        ${sectionHtml('1. Unit Information (ข้อมูลพื้นฐานหน่วยงาน)', unitInfo)}
        ${sectionHtml('2. Mission (พันธกิจ)', mission)}
        ${sectionHtml('5. CQI in Progress (งานพัฒนาคุณภาพที่กำลังดำเนินการ)', cqiProgress)}
        <p style="font-size:14px;background:#f0f9ff;border:1px solid #bae6fd;padding:8px"><strong>Note :</strong> Risk Matrix is used to prioritize key risks and supports CQI planning and unit risk management.</p>
      </td>
      <td style="width:50%;vertical-align:top;padding-left:10px">
        ${sectionHtml('3. Risk Matrix (ตารางประเมินความเสี่ยง)', riskSection)}
        ${sectionHtml('4. Strategy (กลยุทธ์)', strategy)}
        <div style="border:1px solid #ddd;padding:10px;font-size:14px">${bestPractice}</div>
      </td>
    </tr></table>
  </div>
  <div id="pdf-cqi" style="margin-top:8px">
    ${sectionHtml('6. CQI Development Plan (แผนการทำโครงการพัฒนาคุณภาพ)', cqiPlan, '#e11d48', 'section-cqi-plan')}
  </div>
  <div id="pdf-kpi" style="margin-top:8px">
    ${sectionHtml('7. KPI / Key Results / Best Practice (ตัวชี้วัด / ผลลัพธ์ / แนวปฏิบัติที่เป็นเลิศ)', kpi)}
  </div>
</body>
</html>`
}

/* ============================================================================
 * Word (.doc) — HTML แบบ MSO ที่รองรับ Word
 * Word ไม่รองรับ display:flex / display:table div / border-radius / flex gap
 * จึงต้องใช้ <table> จริงทั้งหมด และเรียงเนื้อหาตามข้อ 1→7 แบบเอกสารทางการ
 * ==========================================================================*/

const WORD_FONT = "'TH SarabunPSK','TH Sarabun New','THSarabunNew','Sarabun','Angsana New',serif"

/**
 * ความกว้างเนื้อหาของหน้า A4 หลังหักขอบกระดาษ (595.28pt − 1.2cm × 2 ≈ 527pt ≈ 702px)
 *
 * Word คำนวณ width="100%" ของตารางซ้อนจากความกว้างเซลล์แม่โดยไม่หัก padding
 * และ cellspacing ยังบวกเพิ่มนอกเหนือจาก 100% อีก ตารางที่ซ้อนหลายชั้นจึงล้นกรอบ
 * ทั้งเอกสารนี้จึงกำหนดความกว้างเป็นพิกเซลจริงทุกชั้น ไม่ใช้เปอร์เซ็นต์
 */
const WORD_PORTRAIT_W = 702
/** แนวนอน: 841.89pt − 1.4cm × 2 ≈ 762pt ≈ 1016px */
const WORD_LANDSCAPE_W = 1016

type Orientation = 'portrait' | 'landscape'

type PageLayout = {
  orientation: Orientation
  /** ความกว้างเนื้อหาของหน้า */
  pageW: number
  /** ความกว้างภายในกรอบของแต่ละข้อ (หักเส้นขอบ 1px และ padding 10px ทั้งสองด้าน) */
  sectionW: number
  /** ความกว้างของแต่ละคอลัมน์ในเลย์เอาต์สองคอลัมน์ */
  halfW: number
}

function pageLayout(orientation: Orientation): PageLayout {
  const pageW = orientation === 'landscape' ? WORD_LANDSCAPE_W : WORD_PORTRAIT_W
  const sectionW = pageW - 2 - 20
  return { orientation, pageW, sectionW, halfW: Math.floor((sectionW - 20) / 2) }
}

const PORTRAIT = pageLayout('portrait')
const LANDSCAPE = pageLayout('landscape')

/**
 * ข้อที่เนื้อหากว้างเกินหน้าแนวตั้ง จึงจัดให้อยู่บนหน้าแนวนอน
 * - ข้อ 5 : ตาราง CQI สามปีเรียงกัน + ผัง 3C–DALI ที่มีการ์ดหลายใบต่อแถว
 * - ข้อ 6 : การ์ดขั้นตอนพัฒนาคุณภาพ 5 คอลัมน์
 */
const LANDSCAPE_BLOCK_IDS = new Set(['w-s5', 'w-s6'])

/** ลำดับบล็อกของเอกสาร ใช้ร่วมกันทั้งฝั่ง Word และการตัดหน้า PDF */
const WORKSHEET_BLOCK_IDS = [
  'w-header',
  'w-s1',
  'w-s2',
  'w-s3',
  'w-s4',
  'w-s5',
  'w-s6',
  'w-s7',
  'w-note',
] as const

const blockOrientation = (id: string): Orientation =>
  LANDSCAPE_BLOCK_IDS.has(id) ? 'landscape' : 'portrait'

const blockLayout = (id: string): PageLayout =>
  LANDSCAPE_BLOCK_IDS.has(id) ? LANDSCAPE : PORTRAIT

/**
 * Word ใส่ระยะขอบเซลล์ (0.19 ซม. ซ้าย-ขวา) และระยะรอบตารางให้เองถ้าไม่สั่งทับ
 * ระยะนี้ถูกบวกเพิ่มจากความกว้างที่ประกาศไว้ ตารางหลายคอลัมน์จึงล้นกรอบ
 */
const MSO_TABLE_RESET =
  'mso-table-lspace:0pt;mso-table-rspace:0pt;mso-padding-alt:0cm 0cm 0cm 0cm'

/**
 * ตารางที่กำหนดความกว้างครบทุกคอลัมน์แล้วต้องใช้ table-layout:fixed
 * ไม่งั้นข้อความยาวที่ตัดคำไม่ได้ (ภาษาไทยไม่มีเว้นวรรค) จะดันคอลัมน์ให้กว้างเกินกรอบ
 * Word ไม่อ่าน table-layout จึงต้องสั่ง mso-table-layout-alt คู่กันเสมอ
 */
const FIXED = `table-layout:fixed;mso-table-layout-alt:fixed;${MSO_TABLE_RESET}`
/** บังคับตัดคำกลางคำเมื่อข้อความยาวเกินความกว้างเซลล์ */
const WRAP = 'word-wrap:break-word;overflow-wrap:break-word'

/** จัดคอลัมน์ด้วยความกว้างพิกเซลจริง + เซลล์คั่นระยะ (Word ไม่รองรับ flex/gap) */
function wCols(items: string[], total: number, gap: number): string {
  const count = items.length
  const usable = total - gap * (count - 1)
  const base = Math.floor(usable / count)
  const widths = items.map((_, i) => (i === count - 1 ? usable - base * (count - 1) : base))
  const cells = items
    .map((html, i) => {
      const cell = `<td width="${widths[i]}" valign="top" style="width:${widths[i]}px;${WRAP}">${html}</td>`
      const spacer =
        i < count - 1
          ? `<td width="${gap}" style="width:${gap}px;font-size:1pt;line-height:1">&nbsp;</td>`
          : ''
      return cell + spacer
    })
    .join('')
  return `<table cellspacing="0" cellpadding="0" width="${total}" style="border-collapse:collapse;${FIXED};width:${total}px"><tr>${cells}</tr></table>`
}

function wNumbered(label: string, items: string[], numbered: boolean, width: number): string {
  const rows = items
    .map(
      (item, i) =>
        `<tr><td valign="top" width="22" style="width:22px;padding:2px 4px 2px 0;color:#555">${numbered ? `${i + 1})` : ''}</td><td valign="top" style="padding:2px 0;${WRAP}">${esc(item || '—')}</td></tr>`
    )
    .join('')
  return `<p style="margin:0 0 4px;font-weight:bold">${esc(label)}</p><table cellspacing="0" cellpadding="0" width="${width}" style="border-collapse:collapse;${FIXED};width:${width}px">${rows}</table>`
}

function wField(label: string, value: string, highlight = false): string {
  const valueCell = highlight
    ? `<div style="border:1px solid #a67c52;background:#fff5ee;padding:6px 8px;white-space:pre-wrap;line-height:1.35;${WRAP}">${esc(value || '—')}</div>`
    : `<span style="white-space:pre-wrap;${WRAP}">${esc(value || '—')}</span>`
  return `<tr><td valign="top" width="150" style="width:150px;font-weight:bold;padding:3px 8px 3px 0;${WRAP}">${esc(label)}</td><td valign="top" style="padding:3px 0;${WRAP}">${valueCell}</td></tr>`
}

/** ตารางครอบชุด wField ให้กว้างเท่ากรอบข้อพอดี */
function wFieldTable(rows: string, width: number): string {
  return `<table cellspacing="0" cellpadding="0" width="${width}" style="border-collapse:collapse;${FIXED};width:${width}px">${rows}</table>`
}

function wSection(no: string, title: string, body: string, id: string, color = '#1e5a9e'): string {
  const { pageW } = blockLayout(id)
  return `<table id="${id}" cellspacing="0" cellpadding="0" width="${pageW}" style="border-collapse:collapse;${FIXED};width:${pageW}px;margin:0 0 14px;page-break-inside:avoid;break-inside:avoid">
    <tr><td bgcolor="${color.replace('#', '')}" style="background:${color};color:#ffffff;font-weight:bold;padding:5px 10px;font-size:15pt;${WRAP}">${esc(no)} ${esc(title)}</td></tr>
    <tr><td style="border:1px solid #cccccc;border-top:none;padding:10px;vertical-align:top;${WRAP}">${body}</td></tr>
  </table>`
}

function wTwoCol(left: string, right: string, layout: PageLayout): string {
  return wCols([left, right], layout.sectionW, 20)
}

export type RiskLevelKey = ReturnType<typeof riskLevel>

/** สีระดับความเสี่ยง — ค่าเดียวกับ RISK_LEVEL_CLASS ในหน้ากรอกข้อมูล (แปลงเป็น hex เพื่อให้ Word อ่านได้) */
export const RISK_TONE: Record<RiskLevelKey, { bg: string; text: string; border: string; en: string; th: string; range: string }> = {
  low: { bg: '#a7f3d0', text: '#022c22', border: '#34d399', en: 'Low', th: 'ต่ำ', range: 'Low 1–3' },
  moderate: { bg: '#fef08a', text: '#422006', border: '#facc15', en: 'Moderate', th: 'ปานกลาง', range: 'Moderate 4–6' },
  high: { bg: '#fdba74', text: '#431407', border: '#f97316', en: 'High', th: 'สูง', range: 'High 7–12' },
  extreme: { bg: '#f87171', text: '#450a0a', border: '#dc2626', en: 'Extreme', th: 'สูงมาก', range: 'Extreme 13–25' },
}

export const RISK_LEVEL_ORDER: RiskLevelKey[] = ['low', 'moderate', 'high', 'extreme']

export const LIKELIHOOD_ROWS = [
  { value: 5, label: 'Almost certain' },
  { value: 4, label: 'Likely' },
  { value: 3, label: 'Possible' },
  { value: 2, label: 'Unlikely' },
  { value: 1, label: 'Rare' },
]

export const CONSEQUENCE_COLS = [
  { value: 1, label: 'Negligible' },
  { value: 2, label: 'Minor' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Major' },
  { value: 5, label: 'Catastrophic' },
]

export function worstRiskLevel(cells: UnitProfileWorksheet['riskCells']): RiskLevelKey | null {
  if (!cells.length) return null
  return riskLevel(Math.max(...cells.map((c) => riskScore(c.likelihood, c.consequence))))
}

/** ป้ายระดับความเสี่ยง (ใช้ตารางซ้อนเพื่อให้พื้นหลังแสดงผลใน Word) */
function wRiskChip(level: RiskLevelKey, text: string, align: 'left' | 'right' = 'right'): string {
  const t = RISK_TONE[level]
  return `<table cellspacing="0" cellpadding="0" align="${align}" style="border-collapse:collapse"><tr>
    <td bgcolor="${t.bg.replace('#', '')}" style="background:${t.bg};border:1px solid ${t.border};color:${t.text};padding:2px 8px;font-size:12pt;font-weight:bold;white-space:nowrap">${esc(text)}</td>
  </tr></table>`
}

/**
 * ตาราง Risk Matrix — โครงเดียวกับหน้ากรอกข้อมูล
 * มีแกน Consequence / Likelihood พร้อมคำกำกับ, ช่องไล่สีตามระดับความเสี่ยง,
 * ช่องที่เลือกตีกรอบเข้ม และมีแถบคำอธิบายสีด้านล่าง
 */
function wRiskMatrix(cells: UnitProfileWorksheet['riskCells'], width: number): string {
  const selected = new Set(cells.map((c) => `${c.likelihood}-${c.consequence}`))
  const axis = 'padding:3px 4px;font-size:11pt;color:#475569;line-height:1.2'

  // cellspacing 3 เกิดช่องว่าง 7 ช่อง (นอก 2 + ระหว่างคอลัมน์ 5) ต้องหักออกก่อนแบ่งความกว้าง
  const spacing = 3
  const usable = width - spacing * 7
  const scoreW = Math.floor((usable * 0.17) / 1)
  const labelW = usable - scoreW * 5

  const headerTop = `<tr>
    <td rowspan="2" width="${labelW}" align="center" valign="middle" style="${axis};width:${labelW}px;font-weight:bold;color:#0f172a">Likelihood<br />(Probability)</td>
    <td colspan="5" align="center" style="padding:2px 4px;font-weight:bold;font-size:12pt;color:#475569">CONSEQUENCE (IMPACT)</td>
  </tr>`

  const headerCols = `<tr>${CONSEQUENCE_COLS.map(
    (c) =>
      `<td width="${scoreW}" align="center" valign="bottom" style="${axis};width:${scoreW}px"><b>${c.value}</b><br />${esc(c.label)}</td>`
  ).join('')}</tr>`

  const body = LIKELIHOOD_ROWS.map((l) => {
    const label = `<td align="center" valign="middle" style="${axis}"><b>${l.value}</b><br />${esc(l.label)}</td>`
    const tds = CONSEQUENCE_COLS.map((c) => {
      const score = riskScore(l.value, c.value)
      const t = RISK_TONE[riskLevel(score)]
      const active = selected.has(`${l.value}-${c.value}`)
      return `<td align="center" valign="middle" bgcolor="${t.bg.replace('#', '')}" style="background:${t.bg};color:${t.text};border:${
        active ? '3px solid #0f172a' : `1px solid ${t.border}`
      };padding:4px 2px;line-height:1.2">
        <span style="font-size:11pt${active ? ';font-weight:bold' : ''}">${t.en}</span><br />
        <span style="font-size:13pt;font-weight:bold">${score}</span>
      </td>`
    }).join('')
    return `<tr>${label}${tds}</tr>`
  }).join('')

  const legend = `<table cellspacing="4" cellpadding="0" style="border-collapse:separate;margin:6px 0 0"><tr>${RISK_LEVEL_ORDER.map(
    (key) => `<td>${wRiskChip(key, RISK_TONE[key].range, 'left')}</td>`
  ).join('')}</tr></table>`

  const picked = cells.length
    ? `<p style="margin:6px 0 0;font-size:12pt;color:#475569">ความเสี่ยงที่เลือก: ${cells
        .map((c) => `L${c.likelihood}×C${c.consequence}=${riskScore(c.likelihood, c.consequence)}`)
        .join(', ')}</p>`
    : `<p style="margin:6px 0 0;font-size:12pt;color:#94a3b8">ยังไม่ได้เลือกช่องใน Risk Matrix</p>`

  return `<table cellspacing="${spacing}" cellpadding="0" width="${width}" style="border-collapse:separate;width:${width}px">${headerTop}${headerCols}${body}</table>${legend}${picked}`
}

/** ตาราง CQI รายปี — หัวตาราง Topic / Result และคอลัมน์ลำดับ เหมือนหน้ากรอกข้อมูล */
function wCqiYear(year: string, rows: { topic: string; result: string }[], width: number): string {
  const cellStyle = `border:1px solid #cbd5e1;padding:4px 6px;white-space:pre-wrap;line-height:1.35;${WRAP}`
  const headStyle = 'border:1px solid #cbd5e1;padding:4px 6px;font-weight:bold;background:#f1f5f9'
  // width ของเซลล์นับเฉพาะกรอบเนื้อหา จึงต้องหัก padding 12px และเส้นขอบ 2px ออกก่อนประกาศ
  const inset = 14
  const indexW = 32
  const textW = Math.floor((width - indexW) / 2)
  // คอลัมน์ Result ปล่อยอัตโนมัติให้รับเศษที่เหลือ จะได้กว้างเท่ากับ Topic พอดี
  const indexAttr = `width="${indexW - inset}" style="${cellStyle};width:${indexW - inset}px`
  const topicAttr = `width="${textW - inset}" style="${cellStyle};width:${textW - inset}px`
  const safeRows = rows.length ? rows : [{ topic: '', result: '' }]
  const body = safeRows
    .map(
      (r, i) => `<tr>
        <td align="center" valign="top" ${indexAttr};background:#f8fafc;color:#64748b;font-weight:bold" bgcolor="f8fafc">${i + 1})</td>
        <td valign="top" ${topicAttr}">${esc(r.topic || '—')}</td>
        <td valign="top" style="${cellStyle}">${esc(r.result || '—')}</td>
      </tr>`
    )
    .join('')
  return `<p style="text-align:center;font-weight:bold;color:#1e5a9e;margin:0 0 4px;font-size:15pt">${esc(year)}</p>
    <table cellspacing="0" cellpadding="0" width="${width}" style="border-collapse:collapse;${FIXED};width:${width}px;border:1px solid #cbd5e1">
      <tr>
        <td width="${indexW - inset}" bgcolor="f1f5f9" style="${headStyle};width:${indexW - inset}px"></td>
        <td width="${textW - inset}" bgcolor="f1f5f9" style="${headStyle};width:${textW - inset}px">Topic</td>
        <td bgcolor="f1f5f9" style="${headStyle}">Result</td>
      </tr>${body}
    </table>`
}

/** สีพื้นการ์ดขั้นตอน CQI — เรียงตาม CQI_STEP_META */
export const CQI_STEP_BG = ['#fce7f3', '#ffedd5', '#fef9c3', '#dcfce7', '#ccfbf1']

/**
 * การ์ดขั้นตอน CQI — ใช้ตารางซ้อนแบบเดียวกับ wDaliCard
 * padding ต้องอยู่ในเซลล์ของตารางลูก ห้ามอยู่บนเซลล์ที่กำหนดความกว้าง
 * เพราะเบราว์เซอร์และ Word นับ width ของเซลล์เป็นกรอบเนื้อหา แล้วบวก padding เพิ่มจนตารางล้นกรอบ
 */
function wCqiStepCard(
  step: (typeof CQI_STEP_META)[number],
  content: string,
  bg: string,
  width: number
): string {
  // ความกว้างภายในการ์ด = ความกว้างการ์ด − เส้นขอบ 2px − padding 12px
  const innerW = width - 2 - 12
  const hints = step.hints
    .map(
      (h) =>
        `<tr><td valign="top" width="12" style="width:12px">•</td><td style="${WRAP}">${esc(h)}</td></tr>`
    )
    .join('')
  return `<table cellspacing="0" cellpadding="0" width="${width}" style="width:${width}px;border:1px solid #d1d5db;border-collapse:collapse;${FIXED}">
    <tr><td valign="top" bgcolor="${bg.replace('#', '')}" style="background:${bg};padding:6px;${WRAP}">
      <p style="margin:0 0 6px;font-weight:bold">${esc(step.title)}</p>
      <table cellspacing="0" cellpadding="0" width="${innerW}" style="border-collapse:collapse;${FIXED};width:${innerW}px;font-size:13pt;color:#374151">${hints}</table>
      <div style="margin-top:6px;white-space:pre-wrap;line-height:1.35;${WRAP}">${esc(content || '—')}</div>
    </td></tr>
  </table>`
}

/** โทนสีการ์ด 3C – DALI — ตรงกับแถบหัวการ์ดในหน้ากรอกข้อมูล */
export const DALI_TONE = {
  green: { head: '#059669', headText: '#ffffff', border: '#6ee7b7' },
  red: { head: '#e11d48', headText: '#ffffff', border: '#fda4af' },
  amber: { head: '#f59e0b', headText: '#451a03', border: '#fcd34d' },
  sky: { head: '#e0f2fe', headText: '#075985', border: '#7dd3fc' },
  slate: { head: '#f1f5f9', headText: '#0f172a', border: '#cbd5e1' },
} as const

export type DaliTone = keyof typeof DALI_TONE

/** การ์ดเวที 3C – DALI : แถบหัวสี + ชื่ออังกฤษซ้าย / ไทยขวา + เนื้อหาพื้นขาว */
function wDaliCard(en: string, th: string, value: string, tone: DaliTone, width: number, step?: string): string {
  const t = DALI_TONE[tone]
  // ความกว้างภายในการ์ด = ความกว้างการ์ด − เส้นขอบ 2px − padding แถบหัว 16px
  const headInnerW = width - 2 - 16
  const badge = step
    ? `<td width="18" align="center" valign="middle" bgcolor="ffffff" style="width:18px;background:#ffffff;color:#334155;font-weight:bold;font-size:11pt;padding:0 3px">${esc(step)}</td>`
    : ''
  return `<table cellspacing="0" cellpadding="0" width="${width}" style="width:${width}px;border:1px solid ${t.border};border-collapse:collapse;${FIXED}">
    <tr><td bgcolor="${t.head.replace('#', '')}" style="background:${t.head};padding:4px 8px">
      <table cellspacing="0" cellpadding="0" width="${headInnerW}" style="width:${headInnerW}px;border-collapse:collapse"><tr>
        ${badge}
        <td valign="middle" style="color:${t.headText};font-weight:bold;font-size:13pt${step ? ';padding-left:6px' : ''};${WRAP}">${esc(en)}</td>
        <td align="right" valign="middle" style="color:${t.headText};font-size:11pt;white-space:nowrap">${esc(th)}</td>
      </tr></table>
    </td></tr>
    <tr><td valign="top" style="padding:6px 8px;background:#ffffff;white-space:pre-wrap;line-height:1.35;font-size:13pt;${WRAP}">${esc(value || '—')}</td></tr>
  </table>`
}

/** หัวข้อเฟส 1 / 2 / 3 พร้อมหมายเลขกำกับ */
function wDaliPhase(step: string, title: string, sub: string, color: string): string {
  return `<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 6px"><tr>
    <td width="20" align="center" valign="middle" bgcolor="${color.replace('#', '')}" style="background:${color};color:#ffffff;font-weight:bold;font-size:12pt;padding:2px 6px">${esc(step)}</td>
    <td valign="middle" style="padding-left:8px;font-weight:bold;font-size:14pt;color:#0f172a">${esc(title)}</td>
    <td valign="middle" style="padding-left:8px;font-size:11pt;color:#64748b">${esc(sub)}</td>
  </tr></table>`
}

/** ความกว้างของการ์ดแต่ละใบเมื่อวางเรียง n ใบในพื้นที่ที่กำหนด */
function daliCardWidth(total: number, count: number, gap = 6): number {
  return Math.floor((total - gap * (count - 1)) / count)
}

const wDaliArrow = (color: string) =>
  `<p style="margin:4px 0;text-align:center;color:${color};font-size:15pt;font-weight:bold;line-height:1">▼</p>`

export const DALI_KEY_PROCESS_HINT =
  'เน้นกระบวนการสำคัญ / กลุ่มประชากรเป้าหมาย เพื่อให้เกิดการดูแลที่มีประสิทธิภาพสูง (highly effective care) และได้ผลลัพธ์ที่ดี'

function wDali(dali: UnitProfileWorksheet['daliFramework'], width: number): string {
  const v = (key: keyof NonNullable<UnitProfileWorksheet['daliFramework']>) => dali?.[key] ?? ''

  const gap = 6
  const w2 = daliCardWidth(width, 2, gap)
  const w3 = daliCardWidth(width, 3, gap)

  const keyProcessBox = `<table cellspacing="0" cellpadding="0" width="${width}" style="width:${width}px;border:1px solid #cbd5e1;border-collapse:collapse;${FIXED};margin:0 0 6px">
    <tr><td valign="top" bgcolor="f8fafc" style="background:#f8fafc;padding:6px 8px;white-space:pre-wrap;line-height:1.35;font-size:13pt;${WRAP}">${esc(
      v('keyProcess') || DALI_KEY_PROCESS_HINT
    )}</td></tr>
  </table>`

  const careDesignHints = `<p style="margin:0 0 6px;font-size:12pt;color:#0369a1">• Evidence-based / HFE&nbsp;&nbsp; • Tacit knowledge&nbsp;&nbsp; • Gap Analysis, CareMap</p>`

  const careDesignNote = `<table cellspacing="0" cellpadding="0" width="${width}" style="width:${width}px;border:1px solid #bae6fd;border-collapse:collapse;${FIXED};margin:2px 0 0">
    <tr><td bgcolor="f0f9ff" style="background:#f0f9ff;padding:4px 8px;font-size:12pt;color:#475569;${WRAP}">ทิศทางที่ควรเน้นเพื่อความสำเร็จและความต่อเนื่อง คือ การดูแลผู้ป่วย</td></tr>
  </table>`

  const row = (cards: string[]) => `<div style="margin:0 0 4px">${wCols(cards, width, gap)}</div>`

  return `${wDaliPhase('1', 'Key Process / Key Population', 'กระบวนการ / ประชากรเป้าหมาย', '#059669')}
    ${keyProcessBox}
    ${row([
      wDaliCard('Core Values & Concepts', 'หลักคิด', v('coreValues'), 'green', w3),
      wDaliCard('Context', 'บริบท', v('context'), 'red', w3),
      wDaliCard('Criteria', 'เกณฑ์', v('criteria'), 'green', w3),
    ])}
    ${wDaliArrow('#0ea5e9')}
    ${wDaliPhase('2', 'Effective Care Design', 'ออกแบบการดูแลที่มีประสิทธิภาพ', '#0284c7')}
    ${careDesignHints}
    ${row([
      wDaliCard('Purpose', 'เป้าหมายเชิงรุก', v('purpose'), 'red', w2),
      wDaliCard('Design', 'ออกแบบ', v('design'), 'amber', w2),
    ])}
    ${careDesignNote}
    ${wDaliArrow('#0ea5e9')}
    ${wDaliPhase('3', 'Clinical CQI (DALI)', 'วงจรพัฒนาคุณภาพต่อเนื่อง', '#f59e0b')}
    ${row([
      wDaliCard('Action', 'ปฏิบัติ', v('action'), 'green', w2, '1'),
      wDaliCard('Learning', 'เรียนรู้', v('learning'), 'red', w2, '2'),
    ])}
    ${row([
      wDaliCard('Improve', 'ปรับปรุง', v('improve'), 'amber', w2, '4'),
      wDaliCard('Spread', 'ขยายผล', v('spread'), 'amber', w2, '3'),
    ])}
    <p style="margin:2px 0 6px;text-align:center;font-weight:bold;font-size:13pt;color:#0f172a">Clinical CQI</p>
    ${row([
      wDaliCard('Patient Care', 'การดูแลผู้ป่วย', v('patientCare'), 'sky', w2),
      wDaliCard('Monitor & Learning', 'ติดตามและเรียนรู้', v('monitorLearning'), 'sky', w2),
    ])}`
}

export function buildWorksheetWordHtml(
  data: UnitProfileWorksheet,
  options?: { logoUrl?: string }
): string {
  const displayDate = data.date
    ? new Date(data.date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })
    : '—'
  const logoUrl = options?.logoUrl ?? '/logo2.png'

  const p = PORTRAIT
  const focusInnerW = p.sectionW - 2 - 16
  const focusFixed = `<div style="border:1px solid #a67c52;background:#fff5ee;padding:6px 8px;margin:6px 0"><b style="color:#0a4d68">เข็มมุ่ง (Focus area)</b><table cellspacing="0" cellpadding="0" width="${focusInnerW}" style="border-collapse:collapse;width:${focusInnerW}px;margin-top:4px">${VISION_FACULTY_FOCUS_ITEMS.map(
    (item) => `<tr><td valign="top" width="16" style="width:16px">•</td><td>${esc(item)}</td></tr>`
  ).join('')}</table></div>`

  const s1 = wFieldTable(
    `
    ${wField('Unit :', data.unit)}
    ${wField('Vision - Faculty :', data.visionFaculty)}
    ${wField('Vision - Hospital :', data.visionHospital, true)}
    <tr><td colspan="2">${focusFixed}</td></tr>
    ${wField('Core Value :', data.coreValue, true)}
  `,
    p.sectionW
  )

  const s2 = wTwoCol(
    wNumbered('Mission (in Alignment with Organization)', [...MISSION_ALIGNMENT_FIXED_ITEMS], true, p.halfW),
    wNumbered('Mission (of Unit)', data.missionOfUnit, true, p.halfW),
    p
  )

  const s3 = resolveRiskAssessments(data)
    .map((assessment, index) => {
      const summary = buildRiskAssessmentSummary(assessment.cells)
      const worst = worstRiskLevel(assessment.cells)
      const heading = `<table cellspacing="0" cellpadding="0" width="${p.sectionW}" style="width:${p.sectionW}px;border:1px solid #cbd5e1;border-collapse:collapse;${FIXED};margin:${
        index === 0 ? '0' : '14px'
      } 0 8px">
      <tr>
        <td width="26" align="center" valign="middle" bgcolor="0f172a" style="width:26px;background:#0f172a;color:#ffffff;font-weight:bold;font-size:13pt;padding:5px 4px">${index + 1}</td>
        <td valign="middle" bgcolor="f8fafc" style="background:#f8fafc;padding:5px 10px;font-weight:bold;font-size:15pt;color:#0f172a;${WRAP}">หัวข้อที่ ${
          index + 1
        }${assessment.topic.trim() ? ` — ${esc(assessment.topic.trim())}` : ''}</td>
        <td align="right" valign="middle" width="130" bgcolor="f8fafc" style="width:130px;background:#f8fafc;padding:5px 8px">${
          worst ? wRiskChip(worst, `สูงสุด: ${RISK_TONE[worst].th}`) : ''
        }</td>
      </tr>
    </table>`
      return `${heading}${wFieldTable(wField('หัวข้อประเมิน :', assessment.topic), p.sectionW)}<div style="margin-top:8px">${wRiskMatrix(
        assessment.cells,
        p.sectionW
      )}</div><div style="margin-top:8px">${wFieldTable(wField('สรุปค่าประเมิน :', summary, true), p.sectionW)}</div>`
    })
    .join('')

  const s4 = wTwoCol(
    wNumbered('Strategy (MED UP)', [...STRATEGY_MED_UP_FIXED_ITEMS], false, p.halfW),
    wNumbered('Unit Strategy', data.unitStrategy, true, p.halfW),
    p
  )

  const l = LANDSCAPE
  const yearW = Math.floor((l.sectionW - 8 * 2) / 3)
  // การ์ด DALI อยู่ในกรอบเขียวที่มีเส้นขอบ 1px และ padding 10px ทั้งสองด้าน
  const daliInnerW = l.sectionW - 2 - 20
  const s5 = `${wCols(
    [
      wCqiYear('2023', data.cqiInProgress.y2023, yearW),
      wCqiYear('2024', data.cqiInProgress.y2024, yearW),
      wCqiYear('2025', data.cqiInProgress.y2025, yearW),
    ],
    l.sectionW,
    8
  )}
  <table cellspacing="0" cellpadding="0" width="${l.sectionW}" style="width:${l.sectionW}px;border:1px solid #6ee7b7;border-collapse:collapse;${FIXED};margin-top:12px">
    <tr><td bgcolor="047857" style="background:#047857;padding:6px 10px">
      <table cellspacing="0" cellpadding="0" width="${daliInnerW}" style="width:${daliInnerW}px;border-collapse:collapse"><tr>
        <td valign="middle" style="color:#ffffff;font-weight:bold;font-size:15pt">การประยุกต์ใช้ 3C – DALI กับการออกแบบการดูแลผู้ป่วย</td>
        <td align="right" valign="middle" style="color:#d1fae5;font-size:11pt;white-space:nowrap">Applying 3C – DALI to Patient Care Design</td>
      </tr></table>
    </td></tr>
    <tr><td valign="top" style="padding:10px">${wDali(data.daliFramework, daliInnerW)}</td></tr>
  </table>`

  const stepGap = 6
  const stepCount = CQI_STEP_META.length
  const stepW = Math.floor((l.sectionW - stepGap * (stepCount - 1)) / stepCount)
  const stepsW = stepW * stepCount + stepGap * (stepCount - 1)
  const renderWordCqiSteps = (plan: CqiDevelopmentPlan) =>
    wCols(
      CQI_STEP_META.map((step, i) =>
        wCqiStepCard(step, plan.steps[i]?.content ?? '', CQI_STEP_BG[i], stepW)
      ),
      stepsW,
      stepGap
    )

  const s6 = resolveCqiPlans(data)
    .map((plan, index) => {
      const heading = `<table cellspacing="0" cellpadding="0" width="${l.sectionW}" style="width:${l.sectionW}px;border:1px solid #fecdd3;border-collapse:collapse;${FIXED};margin:${
        index === 0 ? '0' : '12px'
      } 0 8px">
      <tr><td bgcolor="fff1f2" style="background:#fff1f2;padding:6px 10px;font-weight:bold;color:#9f1239;font-size:15pt;${WRAP}">โครงการที่ ${index + 1}${plan.title.trim() ? ` — ${esc(plan.title.trim())}` : ''}${plan.year.trim() ? ` · Year ${esc(plan.year.trim())}` : ''}</td></tr>
    </table>`
      return `${heading}<div style="margin-bottom:8px">${wFieldTable(
        `
    ${wField('CQI Title (ชื่อเรื่อง CQI) :', plan.title)}
    ${wField('Owner/Responsible (ผู้รับผิดชอบ) :', plan.owner)}
    ${wField('Objective (วัตถุประสงค์) :', plan.objective)}
    ${wField('Timeline (ระยะเวลา) :', plan.timeline)}
  `,
        l.sectionW
      )}</div>
  ${renderWordCqiSteps(plan)}`
    })
    .join('')

  const s7 = `${wTwoCol(
    wNumbered('KPI / Key Success Indicators', data.kpiIndicators, true, p.halfW),
    wNumbered('Results/Target', data.kpiResults, true, p.halfW),
    p
  )}
  <div style="margin-top:10px;border-top:1px solid #ddd;padding-top:8px">${wNumbered('Best Practice / Key Learnings', data.bestPractices, true, p.sectionW)}</div>
  <p style="margin-top:10px"><b>Prepared by :</b> ${esc(data.preparedBy || '—')}</p>`

  const header = `<table id="w-header" cellspacing="0" cellpadding="0" width="${p.pageW}" style="border-collapse:collapse;width:${p.pageW}px;border-bottom:2px solid #1e5a9e;margin-bottom:16px">
    <tr>
      <td width="56" style="width:56px;vertical-align:middle;padding-right:10px"><img src="${esc(logoUrl)}" width="48" height="48" style="display:block" alt="logo" /></td>
      <td valign="middle">
        <h1> UNIT PROFILE</h1>
        <div style="color:#1e5a9e;font-weight:bold;font-size:16pt"></div>
      </td>
      <td align="right" valign="top" style="font-size:15pt">
        <div><b>Date :</b> ${esc(displayDate)}</div>
        <div><b>Unit :</b> ${esc(data.unitHeader || '—')}</div>
      </td>
    </tr>
  </table>`

  const note = `<p id="w-note" style="width:${p.pageW - 18}px;border:1px solid #bae6fd;background:#f0f9ff;padding:8px;margin-top:4px"><b>Note :</b> Risk Matrix is used to prioritize key risks and supports CQI planning and unit risk management.</p>`

  const htmlById: Record<string, string> = {
    'w-header': header,
    'w-s1': wSection('1.', 'Unit Information (ข้อมูลพื้นฐานหน่วยงาน)', s1, 'w-s1'),
    'w-s2': wSection('2.', 'Mission (พันธกิจ)', s2, 'w-s2'),
    'w-s3': wSection('3.', 'Risk Matrix (ตารางประเมินความเสี่ยง)', s3, 'w-s3'),
    'w-s4': wSection('4.', 'Strategy (กลยุทธ์)', s4, 'w-s4'),
    'w-s5': wSection('5.', 'CQI in Progress (งานพัฒนาคุณภาพที่กำลังดำเนินการ)', s5, 'w-s5'),
    'w-s6': wSection('6.', 'CQI Development Plan (แผนการทำโครงการพัฒนาคุณภาพ)', s6, 'w-s6', '#e11d48'),
    'w-s7': wSection('7.', 'KPI / Key Results / Best Practice (ตัวชี้วัด / ผลลัพธ์ / แนวปฏิบัติที่เป็นเลิศ)', s7, 'w-s7'),
    'w-note': note,
  }

  // รวมบล็อกที่ใช้แนวกระดาษเดียวกันและอยู่ติดกันไว้ใน section เดียว
  // Word เปลี่ยนแนวกระดาษได้เฉพาะเมื่อขึ้น section ใหม่เท่านั้น
  const groups: { orientation: Orientation; blocks: string[] }[] = []
  for (const id of WORKSHEET_BLOCK_IDS) {
    const orientation = blockOrientation(id)
    const current = groups[groups.length - 1]
    if (current && current.orientation === orientation) current.blocks.push(htmlById[id])
    else groups.push({ orientation, blocks: [htmlById[id]] })
  }

  // Word เก็บค่าหน้ากระดาษของแต่ละ section ไว้ใน @page ที่ตั้งชื่อไว้ แล้วผูกกับ div ผ่าน page:
  // ระบุ mso-page-orientation เฉพาะแนวนอน เพราะ Word ใช้ค่านี้กับค่าที่ไม่ใช่ค่าเริ่มต้นเท่านั้น
  const pageCss = groups
    .map(({ orientation }, i) => {
      const name = `Sec${i + 1}`
      const landscape = orientation === 'landscape'
      const size = landscape ? '841.9pt 595.3pt' : '595.3pt 841.9pt'
      const margin = landscape ? '34.0pt 39.7pt' : '39.7pt 34.0pt'
      const orient = landscape ? ' mso-page-orientation: landscape;' : ''
      return `@page ${name} { size: ${size};${orient} margin: ${margin}; mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt; mso-paper-source: 0; }
  div.${name} { page: ${name}; }`
    })
    .join('\n  ')

  // ต้องใช้ break สองชั้น ขาดตัวใดตัวหนึ่ง Word จะขึ้นหน้าใหม่แต่ไม่เปลี่ยนแนวกระดาษ
  // - page break ปิดท้าย div เดิม
  // - section break คั่นระหว่าง div เพื่อบอกว่าเริ่ม section ใหม่จริง ๆ
  const pageBreak =
    '<br clear="all" style="mso-special-character:line-break;page-break-before:always" />'
  const sectionBreak =
    '<br clear="all" style="page-break-before:always;mso-break-type:section-break" />'

  const body = groups
    .map(({ blocks }, i) => {
      const isLast = i === groups.length - 1
      const div = `<div class="Sec${i + 1}">\n${blocks.join('\n')}\n${isLast ? '' : pageBreak}</div>`
      return isLast ? div : `${div}\n${sectionBreak}`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" lang="th">
<head>
<meta charset="utf-8" />
<title>Unit Profile Worksheet</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
  ${pageCss}
  body { font-family: ${WORD_FONT}; font-size: 15pt; color: #111; line-height: 1.4; }
  table { font-family: ${WORD_FONT}; font-size: 15pt; ${MSO_TABLE_RESET}; }
  p { margin: 0 0 6px; }
  h1 { color: #1e5a9e; font-size: 22pt; margin: 0; }
  /* ภาษาไทยไม่มีเว้นวรรค ข้อความยาวจึงต้องตัดกลางคำ ไม่งั้นจะดันตารางล้นขอบกระดาษ */
  td, th, p, div, span, li { word-wrap: break-word; overflow-wrap: break-word; }
</style>
</head>
<body>
${body}
</body>
</html>`
}

function waitForImages(doc: Document) {
  const images = Array.from(doc.images)
  return Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve()
              img.onerror = () => resolve()
            })
    )
  )
}

const PDF_FONT_STACK =
  '"TH Sarabun New", "TH SarabunPSK", "THSarabunNew", "Sarabun", "Leelawadee UI", Tahoma, "Segoe UI", Arial, sans-serif'

async function waitForFonts(doc: Document) {
  try {
    // บังคับโหลดฟอนต์ที่ใช้ในเอกสารก่อนจับภาพ (TH Sarabun / Sarabun สำรอง)
    if (doc.fonts?.load) {
      await Promise.all([
        doc.fonts.load('15px "TH Sarabun New"'),
        doc.fonts.load('700 15px "TH Sarabun New"'),
        doc.fonts.load('15px "Sarabun"'),
        doc.fonts.load('600 15px "Sarabun"'),
        doc.fonts.load('700 24px "Sarabun"'),
        doc.fonts.load('15px "Leelawadee UI"'),
      ])
    }
    if (doc.fonts?.ready) await doc.fonts.ready
  } catch {
    // ถ้าโหลดฟอนต์ไม่สำเร็จ ยังสร้าง PDF ต่อได้
  }
}

type JsPdfInstance = InstanceType<typeof import('jspdf').jsPDF>

const A4_MM: Record<Orientation, { w: number; h: number }> = {
  portrait: { w: 210, h: 297 },
  landscape: { w: 297, h: 210 },
}

/**
 * ตัวจัดวางเนื้อหาแบบไหลต่อเนื่อง (flow) ลงหน้า PDF
 * - แต่ละบล็อก (ข้อ) จะไม่ถูกตัดกลางถ้าย้ายไปหน้าใหม่แล้วพอดี
 * - ตัดเป็นหน้า ๆ เฉพาะบล็อกที่สูงเกินหนึ่งหน้าเท่านั้น
 * - บล็อกที่ขอแนวกระดาษต่างจากหน้าปัจจุบันจะขึ้นหน้าใหม่ในแนวนั้น
 */
function createPdfFlow(pdf: JsPdfInstance, margin: number, gapMm: number, initial: Orientation) {
  let orientation = initial
  let usableWidth = A4_MM[initial].w - margin * 2
  let usableHeight = A4_MM[initial].h - margin * 2
  let bottom = margin + usableHeight
  let cursorY = margin

  const addPage = (next: Orientation) => {
    pdf.addPage('a4', next)
    orientation = next
    usableWidth = A4_MM[next].w - margin * 2
    usableHeight = A4_MM[next].h - margin * 2
    bottom = margin + usableHeight
    cursorY = margin
  }

  const drawSlice = (canvas: HTMLCanvasElement, sy: number, sliceHeight: number, destY: number, heightMm: number) => {
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = Math.max(1, Math.ceil(sliceHeight))
    const ctx = pageCanvas.getContext('2d')
    if (!ctx) throw new Error('ไม่สามารถสร้างหน้า PDF ได้')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    ctx.drawImage(canvas, 0, sy, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)
    pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, destY, usableWidth, heightMm)
  }

  return {
    add(canvas: HTMLCanvasElement, blockOrientation: Orientation) {
      if (blockOrientation !== orientation) addPage(blockOrientation)

      const pxPerMm = canvas.width / usableWidth
      const blockHeightMm = canvas.height / pxPerMm

      // ถ้าบล็อกพอดีหนึ่งหน้าแต่ที่เหลือในหน้าปัจจุบันไม่พอ → ขึ้นหน้าใหม่ทั้งบล็อก
      if (blockHeightMm <= usableHeight && cursorY + blockHeightMm > bottom + 0.5) {
        addPage(orientation)
      }

      let sy = 0
      while (sy < canvas.height - 1) {
        let availMm = bottom - cursorY
        if (availMm < 12) {
          addPage(orientation)
          availMm = usableHeight
        }
        const availPx = Math.floor(availMm * pxPerMm)
        const sliceHeight = Math.min(availPx, canvas.height - sy)
        const heightMm = sliceHeight / pxPerMm
        drawSlice(canvas, sy, sliceHeight, cursorY, heightMm)
        cursorY += heightMm
        sy += sliceHeight
        if (sy < canvas.height - 1) addPage(orientation)
      }
      cursorY += gapMm
    },
  }
}

async function renderElementToCanvas(
  html2canvas: typeof import('html2canvas-pro').default,
  el: HTMLElement,
  windowWidth: number
) {
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      const clonedBody = clonedDoc.body
      clonedBody.style.fontFamily = PDF_FONT_STACK
      clonedBody.style.letterSpacing = 'normal'
      clonedDoc.querySelectorAll<HTMLElement>('*').forEach((node) => {
        node.style.letterSpacing = 'normal'
        node.style.wordSpacing = 'normal'
        node.style.fontKerning = 'none'
      })
    },
  })
}

/**
 * สร้าง PDF ด้วย html2canvas-pro + jsPDF
 * ใช้เลย์เอาต์เดียวกับ Word — เรียงตามข้อ 1→7 คอลัมน์เดียวแบบเอกสารทางการ
 * แต่ละข้อจับภาพแยกกัน แล้วไหลลงหน้า โดยไม่ตัดกลางข้อถ้าย้ายหน้าใหม่แล้วพอดี
 */
export async function downloadWorksheetPdf(data: UnitProfileWorksheet, filename: string) {
  const logoUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/logo2.png` : '/logo2.png'
  const html = buildWorksheetWordHtml(data, { logoUrl })

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  // กว้างพอสำหรับบล็อกแนวนอน เพื่อไม่ให้ตารางถูกบีบตอน html2canvas จับภาพ
  const captureViewportW = WORD_LANDSCAPE_W + 120
  iframe.style.cssText = `position:fixed;left:0;top:0;width:${captureViewportW}px;height:1123px;border:0;visibility:hidden;pointer-events:none;z-index:-1`
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) {
    iframe.remove()
    throw new Error('ไม่สามารถสร้างเอกสารสำหรับ PDF ได้')
  }

  doc.open()
  doc.write(html)
  doc.close()

  try {
    await waitForImages(doc)
    await waitForFonts(doc)
    await new Promise((r) => setTimeout(r, 400))

    const blocks = WORKSHEET_BLOCK_IDS.map((id) => ({
      el: doc.getElementById(id),
      orientation: blockOrientation(id),
      width: blockLayout(id).pageW,
    })).filter((b): b is { el: HTMLElement; orientation: Orientation; width: number } =>
      Boolean(b.el)
    )
    if (!blocks.length) throw new Error('ไม่พบโครงสร้างเอกสารสำหรับ PDF')

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas-pro'),
      import('jspdf'),
    ])

    const makeCaptureWrap = (node: HTMLElement, width: number) => {
      const wrap = doc.createElement('div')
      wrap.style.width = `${width}px`
      wrap.style.background = '#fff'
      wrap.style.padding = '0'
      wrap.style.boxSizing = 'border-box'
      wrap.style.fontFamily = PDF_FONT_STACK
      wrap.appendChild(node.cloneNode(true))
      doc.body.appendChild(wrap)
      return wrap
    }

    const rendered: { canvas: HTMLCanvasElement; orientation: Orientation }[] = []
    for (const block of blocks) {
      const wrap = makeCaptureWrap(block.el, block.width)
      // eslint-disable-next-line no-await-in-loop
      const canvas = await renderElementToCanvas(html2canvas, wrap, captureViewportW)
      rendered.push({ canvas, orientation: block.orientation })
    }

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: rendered[0].orientation })
    const flow = createPdfFlow(pdf, 10, 3, rendered[0].orientation)
    for (const { canvas, orientation } of rendered) flow.add(canvas, orientation)

    pdf.save(filename)
  } finally {
    iframe.remove()
  }
}

export function worksheetFilename(data: UnitProfileWorksheet, ext: 'pdf' | 'doc' | 'docx') {
  const unit = (data.unitHeader || data.unit || 'unit-profile').replace(/[^\w\u0E00-\u0E7F-]+/g, '-')
  return `unit-profile-worksheet-${unit}.${ext}`
}
