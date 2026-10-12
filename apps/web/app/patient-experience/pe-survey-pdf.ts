import { formatSatisfactionPercent } from '@/app/patient-experience/pe-survey-analytics'
import type { PeComment, PeDataset, PeDemographics } from '@/app/patient-experience/pe-types'
import {
  PE_IPD_DEPARTMENTS,
  PE_OPD_DEPARTMENTS,
  PE_PART2_Q17,
  PE_PART2_QUESTIONS,
  PE_PART3_SUGGESTIONS,
  PE_SURVEY_ORG,
  PE_SURVEY_TITLE,
  type PeCommentLike,
} from '@/app/patient-experience/pe-survey-form-content'

const PDF_FONT_STACK =
  '"TH Sarabun New", "TH SarabunPSK", "THSarabunNew", "Sarabun", "Leelawadee UI", Tahoma, "Segoe UI", Arial, sans-serif'

const A4_W_PX = 794
const A4_H_PX = 1123

export type PePdfExportOptions = {
  scopeLabel: string
  yearLabel: string
  filename?: string
  /** รวมหน้าความคิดเห็นทั้งหมด (ค่าเริ่มต้น true) */
  includeCommentPages?: boolean
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function waitForImages(doc: Document) {
  const images = Array.from(doc.images)
  return Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
    )
  )
}

async function waitForFonts(doc: Document) {
  try {
    if (doc.fonts?.load) {
      await Promise.all([
        doc.fonts.load('14px "TH Sarabun New"'),
        doc.fonts.load('700 14px "TH Sarabun New"'),
        doc.fonts.load('14px "Sarabun"'),
        doc.fonts.load('700 14px "Sarabun"'),
        doc.fonts.load('14px "Leelawadee UI"'),
      ])
    }
    if (doc.fonts?.ready) await doc.fonts.ready
  } catch {
    // continue
  }
}

function checkbox(checked = false) {
  return checked
    ? `<span style="display:inline-block;width:12px;height:12px;border:1.5px solid #111;margin-right:6px;vertical-align:middle;text-align:center;line-height:10px;font-size:10px;font-weight:700">✓</span>`
    : `<span style="display:inline-block;width:12px;height:12px;border:1.5px solid #111;margin-right:6px;vertical-align:middle;background:#fff"></span>`
}

function optionRow(items: { label: string; checked?: boolean; suffix?: string }[]) {
  return items
    .map((item) => {
      const suffix = item.suffix
        ? ` <span style="color:#444;font-size:11.5px">(${esc(item.suffix)})</span>`
        : ''
      return `<span style="display:inline-block;margin-right:14px;margin-bottom:4px;white-space:nowrap">${checkbox(item.checked)}${esc(item.label)}${suffix}</span>`
    })
    .join('')
}

function bucketMap(buckets: { label: string; count: number }[] | undefined) {
  const map = new Map<string, number>()
  for (const b of buckets ?? []) map.set(b.label, b.count)
  return map
}

function bucketSuffix(map: Map<string, number>, label: string, total: number) {
  const n = map.get(label) ?? 0
  if (!n) return undefined
  const pct = total > 0 ? Math.round((n / total) * 100) : 0
  return `${n} · ${pct}%`
}

function topBucketLabels(map: Map<string, number>, minShare = 0.01): Set<string> {
  const total = [...map.values()].reduce((s, n) => s + n, 0)
  if (!total) return new Set()
  const max = Math.max(...map.values())
  const out = new Set<string>()
  for (const [label, n] of map) {
    if (n >= max && n / total >= minShare) out.add(label)
  }
  return out
}

function deptCountMap(dataset: PeDataset) {
  const map = new Map<string, number>()
  for (const d of dataset.departments) map.set(d.label, d.count)
  return map
}

function deptGridFilled(items: string[], counts: Map<string, number>, cols = 3) {
  const rows: string[] = []
  const parts = items.map((label) => {
    const n = counts.get(label) ?? 0
    const checked = n > 0
    const suffix = n > 0 ? ` <span style="color:#555;font-size:11px">(${n})</span>` : ''
    return `<td style="width:${100 / cols}%;padding:1px 4px 2px 0;vertical-align:top;font-size:12px;line-height:1.3">${checkbox(checked)}${esc(label)}${suffix}</td>`
  })
  for (let i = 0; i < parts.length; i += cols) {
    const slice = parts.slice(i, i + cols)
    while (slice.length < cols) slice.push('<td></td>')
    rows.push(`<tr>${slice.join('')}</tr>`)
  }
  return `<table style="width:100%;border-collapse:collapse;margin:2px 0 6px 12px">${rows.join('')}</table>`
}

function pageShell(pageNo: number, body: string) {
  return `
  <div class="pe-page" id="pe-page-${pageNo}" style="width:${A4_W_PX}px;min-height:${A4_H_PX}px;padding:28px 36px 32px;box-sizing:border-box;background:#fff;color:#111;position:relative;page-break-after:always">
    <div style="position:absolute;top:18px;right:36px;font-size:14px;font-weight:700">${pageNo}</div>
    ${body}
  </div>`
}

function metaBanner(opts: {
  scopeLabel: string
  yearLabel: string
  respondents: number
  sourceLabel: string
  dateFrom: string
  dateTo: string
  mode: 'blank' | 'filled'
}) {
  if (opts.mode === 'blank') return ''
  return `
  <div style="margin:0 0 10px;padding:8px 10px;border:1px solid #c4b5fd;background:#f5f3ff;font-size:12px;line-height:1.5;border-radius:4px">
    <b>รายงานสรุปจากข้อมูล Patient Experience [PEP]</b> — เติมค่าตามแบบประเมินรับฟังความคิดเห็นผู้ป่วย<br/>
    ขอบเขต: <b>${esc(opts.scopeLabel)}</b>
    &nbsp;|&nbsp; ปี พ.ศ.: <b>${esc(opts.yearLabel)}</b>
    &nbsp;|&nbsp; ผู้ตอบ: <b>${opts.respondents.toLocaleString('th-TH')}</b><br/>
    ช่วงข้อมูล: ${esc(opts.dateFrom)} ถึง ${esc(opts.dateTo)}
    &nbsp;|&nbsp; แหล่ง: ${esc(opts.sourceLabel)}
  </div>`
}

function headerBlock(logoUrl: string) {
  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:6px">
      <tr>
        <td style="width:64px;vertical-align:middle">
          <img src="${esc(logoUrl)}" alt="logo" width="52" height="52" style="display:block;object-fit:contain" />
        </td>
        <td style="text-align:center;vertical-align:middle;padding:0 8px">
          <div style="font-size:20px;font-weight:700;line-height:1.25">${esc(PE_SURVEY_TITLE)}</div>
          <div style="font-size:18px;font-weight:700;line-height:1.3;margin-top:2px">${esc(PE_SURVEY_ORG)}</div>
        </td>
        <td style="width:64px"></td>
      </tr>
    </table>
    <div style="border-top:1.5px solid #222;margin:8px 0 10px"></div>`
}

function buildPage1(
  logoUrl: string,
  fill?: {
    dataset: PeDataset
    scopeLabel: string
    yearLabel: string
  }
) {
  const demo: PeDemographics | undefined = fill?.dataset.demographics
  const visit = bucketMap(demo?.visitFrequency)
  const gender = bucketMap(demo?.gender)
  const age = bucketMap(demo?.age)
  const education = bucketMap(demo?.education)
  const rights = bucketMap(demo?.rights)
  const visitTotal = [...visit.values()].reduce((s, n) => s + n, 0)
  const genderTotal = [...gender.values()].reduce((s, n) => s + n, 0)
  const ageTotal = [...age.values()].reduce((s, n) => s + n, 0)
  const eduTotal = [...education.values()].reduce((s, n) => s + n, 0)
  const rightsTotal = [...rights.values()].reduce((s, n) => s + n, 0)
  const visitTop = topBucketLabels(visit)
  const genderTop = topBucketLabels(gender)
  const ageTop = topBucketLabels(age)
  const eduTop = topBucketLabels(education)
  const rightsTop = topBucketLabels(rights)
  const deptCounts = fill ? deptCountMap(fill.dataset) : new Map<string, number>()
  const dateLine = fill
    ? `${fill.dataset.dateFrom} ถึง ${fill.dataset.dateTo}`
    : '........................................................'

  const body = `
    ${headerBlock(logoUrl)}
    ${
      fill
        ? metaBanner({
            scopeLabel: fill.scopeLabel,
            yearLabel: fill.yearLabel,
            respondents: fill.dataset.kpis.respondents,
            sourceLabel: fill.dataset.sourceLabel,
            dateFrom: fill.dataset.dateFrom,
            dateTo: fill.dataset.dateTo,
            mode: 'filled',
          })
        : ''
    }
    <div style="font-size:15px;font-weight:700;margin-bottom:10px">ส่วนที่ 1 ข้อมูลของผู้ตอบแบบสอบถาม</div>

    <div style="font-size:13.5px;line-height:1.55;margin-bottom:8px">
      <div style="margin-bottom:4px"><b>1. ท่านมาใช้บริการ ?</b></div>
      <div style="padding-left:14px">${optionRow([
        {
          label: 'ครั้งแรก',
          checked: visitTop.has('ครั้งแรก'),
          suffix: bucketSuffix(visit, 'ครั้งแรก', visitTotal),
        },
        {
          label: 'มากกว่า 1 ครั้ง',
          checked: visitTop.has('มากกว่า 1 ครั้ง'),
          suffix: bucketSuffix(visit, 'มากกว่า 1 ครั้ง', visitTotal),
        },
      ])}</div>
    </div>

    <div style="font-size:13.5px;line-height:1.45;margin-bottom:6px">
      <div style="margin-bottom:4px"><b>2. ครั้งนี้ท่านเข้ารับบริการแบบใด ?</b>
        ${
          fill
            ? `<span style="font-size:11.5px;font-weight:400;color:#555"> — ติ๊กหน่วยงานที่มีผู้ตอบ (ตัวเลข = จำนวน)</span>`
            : ''
        }
      </div>
      <div style="padding-left:8px;font-weight:600;margin:4px 0 2px">- งานผู้ป่วยนอก</div>
      ${deptGridFilled(PE_OPD_DEPARTMENTS, deptCounts, 3)}
      <div style="padding-left:8px;font-weight:600;margin:6px 0 2px">- งานผู้ป่วยใน (นอนพักรักษาในโรงพยาบาล)</div>
      ${deptGridFilled(PE_IPD_DEPARTMENTS, deptCounts, 3)}
    </div>

    <div style="font-size:13.5px;line-height:1.7;margin-bottom:6px">
      <b>3. วันที่เข้ารับการรักษา</b> ${esc(dateLine)}
    </div>

    <div style="font-size:13.5px;line-height:1.7;margin-bottom:6px">
      <b>4. เพศ</b>&nbsp;&nbsp;${optionRow([
        {
          label: 'ชาย',
          checked: genderTop.has('ชาย'),
          suffix: bucketSuffix(gender, 'ชาย', genderTotal),
        },
        {
          label: 'หญิง',
          checked: genderTop.has('หญิง'),
          suffix: bucketSuffix(gender, 'หญิง', genderTotal),
        },
      ])}
    </div>

    <div style="font-size:13.5px;line-height:1.7;margin-bottom:6px">
      <b>5. อายุ</b>&nbsp;&nbsp;${optionRow(
        ['ต่ำกว่า 18 ปี', '19-35 ปี', '36-51 ปี', '52-70 ปี', '70 ปี ขึ้นไป'].map((label) => ({
          label,
          checked: ageTop.has(label),
          suffix: bucketSuffix(age, label, ageTotal),
        }))
      )}
    </div>

    <div style="font-size:13.5px;line-height:1.7;margin-bottom:6px">
      <b>6. การศึกษา</b>&nbsp;&nbsp;${optionRow(
        ['ประถมศึกษา', 'มัธยมศึกษา', 'อนุปริญญา', 'ปริญญาตรี', 'สูงกว่าปริญญาตรี'].map((label) => ({
          label,
          checked: eduTop.has(label),
          suffix: bucketSuffix(education, label, eduTotal),
        }))
      )}
    </div>

    <div style="font-size:13.5px;line-height:1.7">
      <b>7. สิทธิการรักษา</b>&nbsp;&nbsp;${optionRow(
        [
          'ไม่มีสิทธิการรักษา',
          'สวัสดิการข้าราชการ',
          'ประกันสังคม',
          'หลักประกันสุขภาพถ้วนหน้า',
        ].map((label) => ({
          label,
          checked: rightsTop.has(label),
          suffix: bucketSuffix(rights, label, rightsTotal),
        }))
      )}
      <div style="margin-top:4px;padding-left:14px">${checkbox(rightsTop.has('อื่น ๆ'))}อื่น ๆ ระบุ${
        rights.get('อื่น ๆ')
          ? ` ${esc(bucketSuffix(rights, 'อื่น ๆ', rightsTotal) ?? '')}`
          : '................................................'
      }</div>
    </div>`

  return pageShell(1, body)
}

function scoreMark(avg: number, col: 1 | 2 | 3 | 4 | 5 | 0, unusedCount: number) {
  if (col === 0) {
    return unusedCount > 0
      ? `<span style="font-size:11px;font-weight:700">${unusedCount}</span>`
      : ''
  }
  if (!(avg > 0)) return ''
  const rounded = Math.min(5, Math.max(1, Math.round(avg)))
  if (rounded !== col) return ''
  return `<span style="font-size:14px;font-weight:700">✓</span><div style="font-size:10px;color:#333;margin-top:1px">${avg.toFixed(2)}</div>`
}

function buildPage2(fill?: { dataset: PeDataset; scopeLabel: string; yearLabel: string }) {
  const scoreHeaders = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '0<br/><span style="font-size:9px;font-weight:400">(ไม่ได้ใช้บริการ)</span>',
  ]
  const headerCells = scoreHeaders
    .map(
      (h) =>
        `<th style="border:1px solid #222;padding:3px 2px;text-align:center;font-size:12px;font-weight:700;width:42px;line-height:1.15">${h}</th>`
    )
    .join('')

  const items = fill?.dataset.part2Items ?? []

  const rows = PE_PART2_QUESTIONS.map((q, i) => {
    const item = items.find((it) => it.questionNo === i + 1)
    const avg = item?.avgScore ?? 0
    const unused = item?.unusedCount ?? 0
    const cols: Array<1 | 2 | 3 | 4 | 5 | 0> = [1, 2, 3, 4, 5, 0]
    const scoreCells = cols
      .map((col) => {
        const mark = fill ? scoreMark(avg, col, unused) : ''
        const bg =
          fill && avg > 0 && col !== 0 && Math.round(avg) === col ? 'background:#ede9fe;' : ''
        return `<td style="border:1px solid #222;height:30px;text-align:center;vertical-align:middle;${bg}">${mark}</td>`
      })
      .join('')
    return `<tr>
      <td style="border:1px solid #222;padding:3px 4px;text-align:center;font-size:12.5px;width:28px">${i + 1}</td>
      <td style="border:1px solid #222;padding:3px 6px;font-size:12px;line-height:1.3;text-align:left">${esc(q)}${
        fill && item && item.responseCount > 0
          ? `<div style="font-size:10.5px;color:#555;margin-top:2px">n=${item.responseCount} · ค่าเฉลี่ย ${avg.toFixed(2)}</div>`
          : ''
      }</td>
      ${scoreCells}
    </tr>`
  }).join('')

  const recommendRate = fill?.dataset.kpis.recommendRate ?? 0
  const recommendYes = fill ? recommendRate >= 50 : false
  const recommendNo = fill ? recommendRate < 50 && fill.dataset.kpis.respondents > 0 : false

  const body = `
    ${
      fill
        ? metaBanner({
            scopeLabel: fill.scopeLabel,
            yearLabel: fill.yearLabel,
            respondents: fill.dataset.kpis.respondents,
            sourceLabel: fill.dataset.sourceLabel,
            dateFrom: fill.dataset.dateFrom,
            dateTo: fill.dataset.dateTo,
            mode: 'filled',
          })
        : ''
    }
    <div style="font-size:15px;font-weight:700;margin:4px 0 8px">ส่วนที่ 2 สอบถามความพึงพอใจต่อการให้บริการในโรงพยาบาล</div>
    <div style="font-size:12px;line-height:1.5;margin-bottom:8px">
      <div><b>เกณฑ์การให้คะแนน</b></div>
      <div>คะแนน 0 หมายถึง ไม่ได้ใช้บริการ · 1 น้อยที่สุด · 2 น้อย · 3 ปานกลาง · 4 มาก · 5 มากที่สุด</div>
      ${
        fill
          ? `<div style="margin-top:2px;color:#4c1d95">รายงานนี้ใส่ <b>✓</b> ที่ระดับคะแนนที่ใกล้ค่าเฉลี่ย และแสดงค่าเฉลี่ยรายข้อ</div>`
          : ''
      }
    </div>
    <table style="width:100%;border-collapse:collapse;table-layout:fixed">
      <thead>
        <tr>
          <th style="border:1px solid #222;padding:4px;width:28px;font-size:12.5px">ที่</th>
          <th style="border:1px solid #222;padding:4px;font-size:12.5px">หัวข้อ</th>
          ${headerCells}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:12px;font-size:13.5px;line-height:1.55">
      <b>17.</b> ${esc(PE_PART2_Q17)}
      <div style="margin-top:8px;padding-left:18px">${optionRow([
        {
          label: 'แนะนำ',
          checked: recommendYes,
          suffix: fill ? `${recommendRate.toFixed(1)}%` : undefined,
        },
        {
          label: 'ไม่แนะนำ',
          checked: recommendNo,
          suffix: fill ? `${Math.max(0, 100 - recommendRate).toFixed(1)}%` : undefined,
        },
      ])}</div>
      ${
        fill
          ? `<div style="margin-top:6px;font-size:12px;color:#444">คะแนนพึงพอใจเฉลี่ยรวม: <b>${formatSatisfactionPercent(fill.dataset.kpis.avgSatisfaction)}</b> · ระดับ: ${esc(fill.dataset.kpis.overallHealthLabel)} · % ไม่พึงพอใจ: ${fill.dataset.kpis.dissatisfactionRate.toFixed(1)}%</div>`
          : ''
      }
    </div>`

  return pageShell(2, body)
}

function buildPage3(
  fill?: { dataset: PeDataset; scopeLabel: string; yearLabel: string },
  options?: {
    checkedThemes?: boolean[]
    otherText?: string
    commentLines?: string[]
  }
) {
  const themes = fill?.dataset.part3Themes ?? []
  const checked =
    options?.checkedThemes ??
    PE_PART3_SUGGESTIONS.map((_, i) => (themes.find((t) => t.themeIndex === i)?.count ?? 0) > 0)

  const items = PE_PART3_SUGGESTIONS.map((label, i) => {
    const stat = themes.find((t) => t.themeIndex === i)
    const suffix =
      fill && stat
        ? ` <span style="color:#555;font-size:12px">— ${stat.count} รายการ (${stat.pct}%)</span>`
        : ''
    return `<div style="margin:0 0 12px;font-size:13.5px;line-height:1.5">${checkbox(Boolean(checked[i]))}${esc(label)}${suffix}</div>`
  }).join('')

  const otherStat = themes.find((t) => t.themeIndex === -1)
  const otherText =
    options?.otherText ??
    (otherStat && otherStat.count > 0
      ? `ความคิดเห็นอื่น ๆ ${otherStat.count} รายการ (${otherStat.pct}%)`
      : undefined)

  const preview =
    options?.commentLines ??
    (fill?.dataset.comments ?? []).slice(0, 6).map((c) => `${c.department}: ${c.text}`)

  const blankLines =
    preview.length > 0
      ? preview
          .map(
            (line) =>
              `<div style="border-bottom:1px dotted #444;min-height:22px;margin:8px 0 0;font-size:12.5px;line-height:1.45;padding-bottom:2px">${esc(line)}</div>`
          )
          .join('')
      : Array.from({ length: 5 })
          .map(() => `<div style="border-bottom:1px dotted #444;height:22px;margin:10px 0 0"></div>`)
          .join('')

  const summary =
    fill != null
      ? `<div style="font-size:12px;line-height:1.45;margin:0 0 12px;padding:8px 10px;border:1px solid #ddd;background:#fafafa">
      <b>สรุปส่วนที่ 3 จากข้อมูลจริง</b> — ขอบเขต ${esc(fill.scopeLabel)} · ปี ${esc(fill.yearLabel)} · ความคิดเห็น ${fill.dataset.comments.length} รายการ
    </div>`
      : ''

  const body = `
    <div style="font-size:15px;font-weight:700;margin:10px 0 12px">ส่วนที่ 3 ข้อเสนอแนะ</div>
    ${summary}
    ${items}
    <div style="margin:0 0 10px;font-size:13.5px;line-height:1.5">${checkbox(Boolean(otherText))}${
      otherText
        ? `อื่น ๆ โปรดระบุ ${esc(otherText)}`
        : 'อื่น ๆ โปรดระบุ................................................................................................................................................................'
    }</div>
    ${blankLines}`

  return pageShell(3, body)
}

function buildKpiDeptPage(
  pageNo: number,
  dataset: PeDataset,
  opts: { scopeLabel: string; yearLabel: string }
) {
  const kpi = dataset.kpis
  const rows = [...dataset.departments]
    .sort((a, b) => b.count - a.count)
    .map(
      (d, i) => `<tr>
      <td style="border:1px solid #ccc;padding:4px;text-align:center;font-size:11.5px">${i + 1}</td>
      <td style="border:1px solid #ccc;padding:4px;font-size:11.5px">${esc(d.label)}</td>
      <td style="border:1px solid #ccc;padding:4px;text-align:center;font-size:11.5px">${d.count}</td>
      <td style="border:1px solid #ccc;padding:4px;text-align:center;font-size:11.5px">${formatSatisfactionPercent(d.avgSatisfaction)}</td>
      <td style="border:1px solid #ccc;padding:4px;text-align:center;font-size:11.5px">${d.recommendRate.toFixed(1)}%</td>
      <td style="border:1px solid #ccc;padding:4px;text-align:center;font-size:11.5px">${d.returnRate.toFixed(1)}%</td>
      <td style="border:1px solid #ccc;padding:4px;text-align:center;font-size:11.5px">${d.dissatisfactionRate.toFixed(1)}%</td>
    </tr>`
    )
    .join('')

  const dimRows = dataset.dimensions
    .map(
      (d) => `<tr>
      <td style="border:1px solid #ccc;padding:5px;font-size:12px">${esc(d.label)}</td>
      <td style="border:1px solid #ccc;padding:5px;text-align:center;font-size:12px;font-weight:700">${d.score.toFixed(1)}</td>
      <td style="border:1px solid #ccc;padding:5px;text-align:center;font-size:12px">/ ${d.max}</td>
    </tr>`
    )
    .join('')

  return pageShell(
    pageNo,
    `
    <div style="font-size:15px;font-weight:700;margin:6px 0 8px">ภาคผนวก ก — สรุป KPI และหน่วยงาน</div>
    ${metaBanner({
      scopeLabel: opts.scopeLabel,
      yearLabel: opts.yearLabel,
      respondents: kpi.respondents,
      sourceLabel: dataset.sourceLabel,
      dateFrom: dataset.dateFrom,
      dateTo: dataset.dateTo,
      mode: 'filled',
    })}
    <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
      <tr>
        <td style="border:1px solid #ddd;padding:8px;width:20%;background:#f8fafc"><div style="font-size:10px;color:#666">ผู้ตอบ</div><div style="font-size:16px;font-weight:700">${kpi.respondents.toLocaleString('th-TH')}</div></td>
        <td style="border:1px solid #ddd;padding:8px;width:20%;background:#f8fafc"><div style="font-size:10px;color:#666">พึงพอใจเฉลี่ย</div><div style="font-size:16px;font-weight:700">${formatSatisfactionPercent(kpi.avgSatisfaction)}</div></td>
        <td style="border:1px solid #ddd;padding:8px;width:20%;background:#f8fafc"><div style="font-size:10px;color:#666">แนะนำ (ข้อ 17)</div><div style="font-size:16px;font-weight:700">${kpi.recommendRate.toFixed(1)}%</div></td>
        <td style="border:1px solid #ddd;padding:8px;width:20%;background:#f8fafc"><div style="font-size:10px;color:#666">กลับมาใช้</div><div style="font-size:16px;font-weight:700">${kpi.returnRate.toFixed(1)}%</div></td>
        <td style="border:1px solid #ddd;padding:8px;width:20%;background:#f8fafc"><div style="font-size:10px;color:#666">ไม่พึงพอใจ</div><div style="font-size:16px;font-weight:700">${kpi.dissatisfactionRate.toFixed(1)}%</div></td>
      </tr>
    </table>

    <div style="font-size:13px;font-weight:700;margin:0 0 6px">มิติส่วนที่ 2 (คะแนนปรับฐาน)</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
      <thead><tr style="background:#f3f4f6">
        <th style="border:1px solid #ccc;padding:5px;text-align:left;font-size:12px">มิติ</th>
        <th style="border:1px solid #ccc;padding:5px;font-size:12px">คะแนน</th>
        <th style="border:1px solid #ccc;padding:5px;font-size:12px">เต็ม</th>
      </tr></thead>
      <tbody>${dimRows}</tbody>
    </table>

    <div style="font-size:13px;font-weight:700;margin:0 0 6px">ตารางหน่วยงาน</div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f3f4f6">
        <th style="border:1px solid #ccc;padding:4px;font-size:11px">ที่</th>
        <th style="border:1px solid #ccc;padding:4px;font-size:11px">หน่วยงาน</th>
        <th style="border:1px solid #ccc;padding:4px;font-size:11px">n</th>
        <th style="border:1px solid #ccc;padding:4px;font-size:11px">% พึงพอใจ</th>
        <th style="border:1px solid #ccc;padding:4px;font-size:11px">แนะนำ</th>
        <th style="border:1px solid #ccc;padding:4px;font-size:11px">กลับมาใช้</th>
        <th style="border:1px solid #ccc;padding:4px;font-size:11px">ไม่พอใจ</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="7" style="border:1px solid #ccc;padding:8px;text-align:center;color:#888">ไม่มีข้อมูลหน่วยงาน</td></tr>`}</tbody>
    </table>`
  )
}

function buildCommentsExtraPages(comments: PeCommentLike[], startPage: number) {
  const perPage = 16
  const pages: string[] = []
  const totalPages = Math.max(1, Math.ceil(comments.length / perPage))
  for (let i = 0; i < comments.length; i += perPage) {
    const slice = comments.slice(i, i + perPage)
    const pageNo = startPage + pages.length
    const rows = slice
      .map((c, idx) => {
        const n = i + idx + 1
        const sentiment =
          c.sentiment === 'positive' ? 'เชิงบวก' : c.sentiment === 'negative' ? 'เชิงลบ' : 'กลาง'
        return `<tr>
          <td style="border:1px solid #ccc;padding:4px 6px;text-align:center;width:32px;font-size:11.5px">${n}</td>
          <td style="border:1px solid #ccc;padding:4px 6px;width:130px;font-size:11.5px">${esc(c.department)}</td>
          <td style="border:1px solid #ccc;padding:4px 6px;width:64px;font-size:11.5px;text-align:center">${esc(sentiment)}</td>
          <td style="border:1px solid #ccc;padding:4px 6px;font-size:12px;line-height:1.35">${esc(c.text)}</td>
        </tr>`
      })
      .join('')

    pages.push(
      pageShell(
        pageNo,
        `
      <div style="font-size:15px;font-weight:700;margin:8px 0 6px">ภาคผนวก ข — รายการความคิดเห็นผู้ป่วย (ส่วนที่ 3)</div>
      <div style="font-size:12px;color:#444;margin-bottom:10px">หน้า ${pages.length + 1} จาก ${totalPages} · รวม ${comments.length} รายการ</div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="border:1px solid #ccc;padding:5px;font-size:12px">ที่</th>
            <th style="border:1px solid #ccc;padding:5px;font-size:12px">หน่วยงาน</th>
            <th style="border:1px solid #ccc;padding:5px;font-size:12px">Sentiment</th>
            <th style="border:1px solid #ccc;padding:5px;font-size:12px">ข้อความ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`
      )
    )
  }
  return pages
}

function docShell(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
  * { box-sizing: border-box; letter-spacing: normal !important; word-spacing: normal !important; font-kerning: none !important; }
  body { margin: 0; padding: 0; background: #fff; font-family: ${PDF_FONT_STACK}; color: #111; }
</style>
</head>
<body>
${body}
</body>
</html>`
}

export function buildPeSurveyBlankHtml(logoUrl: string) {
  return docShell(
    PE_SURVEY_TITLE,
    `${buildPage1(logoUrl)}${buildPage2()}${buildPage3()}`
  )
}

/** PDF รายงานเต็ม — เติมข้อมูลจริงลงแบบฟอร์มส่วนที่ 1–3 + ภาคผนวก */
export function buildPeSurveyFilledHtml(
  dataset: PeDataset,
  options: { logoUrl: string; scopeLabel: string; yearLabel: string; includeCommentPages?: boolean }
) {
  const fill = {
    dataset,
    scopeLabel: options.scopeLabel,
    yearLabel: options.yearLabel,
  }
  const pages = [
    buildPage1(options.logoUrl, fill),
    buildPage2(fill),
    buildPage3(fill),
    buildKpiDeptPage(4, dataset, options),
  ]
  if (options.includeCommentPages !== false && dataset.comments.length > 0) {
    pages.push(...buildCommentsExtraPages(dataset.comments, 5))
  }
  return docShell(`รายงาน PEP — ${PE_SURVEY_ORG}`, pages.join('\n'))
}

async function renderPagesToPdf(html: string, filename: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = `position:fixed;left:0;top:0;width:${A4_W_PX + 40}px;height:${A4_H_PX}px;border:0;visibility:hidden;pointer-events:none;z-index:-1`
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
    await new Promise((r) => setTimeout(r, 350))

    const pages = Array.from(doc.querySelectorAll<HTMLElement>('.pe-page'))
    if (!pages.length) throw new Error('ไม่พบหน้าแบบฟอร์มสำหรับ PDF')

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas-pro'),
      import('jspdf'),
    ])

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pageW = 210
    const pageH = 297

    for (let i = 0; i < pages.length; i++) {
      const el = pages[i]
      // eslint-disable-next-line no-await-in-loop
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: A4_W_PX + 40,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          clonedDoc.body.style.fontFamily = PDF_FONT_STACK
          clonedDoc.querySelectorAll<HTMLElement>('*').forEach((node) => {
            node.style.letterSpacing = 'normal'
            node.style.wordSpacing = 'normal'
            node.style.fontKerning = 'none'
          })
        },
      })

      const img = canvas.toDataURL('image/jpeg', 0.95)
      if (i > 0) pdf.addPage('a4', 'portrait')
      pdf.addImage(img, 'JPEG', 0, 0, pageW, pageH)
    }

    pdf.save(filename)
  } finally {
    iframe.remove()
  }
}

export async function downloadPeSurveyBlankPdf(filename?: string) {
  const logoUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/logo2.png` : '/logo2.png'
  await renderPagesToPdf(
    buildPeSurveyBlankHtml(logoUrl),
    filename ?? `แบบประเมินรับฟังความคิดเห็นผู้ป่วย-ว่าง-${PE_SURVEY_ORG}.pdf`
  )
}

/** ส่งออกรายงาน PDF เติมข้อมูลจริงจาก dataset */
export async function downloadPeSurveyFilledPdf(
  dataset: PeDataset,
  options: PePdfExportOptions
) {
  const logoUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/logo2.png` : '/logo2.png'
  const html = buildPeSurveyFilledHtml(dataset, {
    logoUrl,
    scopeLabel: options.scopeLabel,
    yearLabel: options.yearLabel,
    includeCommentPages: options.includeCommentPages,
  })
  const safeScope = options.scopeLabel.replace(/[^\w\u0E00-\u0E7F-]+/g, '-')
  await renderPagesToPdf(
    html,
    options.filename ?? `รายงาน-PEP-${safeScope}-${options.yearLabel}.pdf`
  )
}

/** @deprecated ใช้ downloadPeSurveyFilledPdf แทน — คงไว้เพื่อความเข้ากันได้ */
export async function downloadPeCommentsPdf(
  comments: PeCommentLike[],
  options: { scopeLabel: string; yearLabel: string; filename?: string; dataset?: PeDataset }
) {
  if (options.dataset) {
    await downloadPeSurveyFilledPdf(
      {
        ...options.dataset,
        comments: comments as PeComment[],
      },
      options
    )
    return
  }
  const logoUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/logo2.png` : '/logo2.png'
  const minimal: PeDataset = {
    dateFrom: '',
    dateTo: '',
    sourceLabel: 'ความคิดเห็นผู้ป่วย',
    realtime: false,
    kpis: {
      respondents: comments.length,
      avgSatisfaction: 0,
      overallHealthLabel: '—',
      returnRate: 0,
      recommendRate: 0,
      dissatisfactionRate: 0,
    },
    departments: [],
    dimensions: [],
    topStrengths: [],
    topImprovements: [],
    comments: comments as PeComment[],
    part2Items: [],
    part3Themes: [],
  }
  await renderPagesToPdf(
    buildPeSurveyFilledHtml(minimal, {
      logoUrl,
      scopeLabel: options.scopeLabel,
      yearLabel: options.yearLabel,
    }),
    options.filename ??
      `ความคิดเห็นผู้ป่วย-PEP-${options.scopeLabel.replace(/[^\w\u0E00-\u0E7F-]+/g, '-')}-${options.yearLabel}.pdf`
  )
}
