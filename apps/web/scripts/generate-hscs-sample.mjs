/**
 * Generate a sample HSCS69.xlsx matching the documented schema.
 * Run: bun scripts/generate-hscs-sample.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'data', 'hscs')
const outFile = path.join(outDir, 'HSCS69.xlsx')

const SECTIONS = [
  { letter: 'A', title: 'การทำงานเป็นทีม', n: 6 },
  { letter: 'B', title: 'บุคลากรและพื้นที่การทำงาน', n: 4 },
  { letter: 'C', title: 'องค์กรแห่งการเรียนรู้', n: 4 },
  { letter: 'D', title: 'การตอบสนองต่อความคลาดเคลื่อน', n: 5 },
  { letter: 'E', title: 'การสนับสนุนของหัวหน้างาน / Safety Grade', n: 3 },
  { letter: 'F', title: 'การสื่อสารเรื่องความคลาดเคลื่อน', n: 4 },
  { letter: 'G', title: 'การรายงานเหตุการณ์ / ความถี่', n: 3 },
  { letter: 'H', title: 'ข้อเสนอแนะ', n: 1 },
]

const DEPTS = [
  'งานกายภาพบำบัด',
  'งานเภสัชกรรม',
  'แพทย์',
  'งานการพยาบาลผู้ป่วยใน',
  'งานการพยาบาลผู้ป่วยนอก',
  'งานบริหารทั่วไป',
  'งานรังสีวิทยา',
  'เทคนิคการแพทย์',
]

function randLikert(bias = 3.8) {
  // Rough normal around bias, clamp 1-5; ~8% blank/0 excluded
  if (Math.random() < 0.06) return 0
  if (Math.random() < 0.04) return ''
  const v = Math.round(bias + (Math.random() - 0.5) * 2.4)
  return Math.min(5, Math.max(1, v))
}

const categoryRow = ['รหัสบุคคลกร', 'วันที่ตอบ']
const numberRow = ['', '']
for (const s of SECTIONS) {
  for (let i = 1; i <= s.n; i++) {
    categoryRow.push(i === 1 ? `${s.letter}. ${s.title}` : '')
    numberRow.push(`${s.letter}${i}`)
  }
}

const exportRows = [categoryRow, numberRow]
const reportRows = [['รหัสบุคคลกร', 'แผนก/วิชาชีพ']]

for (let i = 1; i <= 120; i++) {
  const id = `UPH${String(1000 + i)}`
  const dept = DEPTS[i % DEPTS.length]
  reportRows.push([id, dept])

  const day = 1 + (i % 28)
  const month = 1 + (i % 8)
  const row = [id, `${day}/${month}/2569`]
  for (const s of SECTIONS) {
    for (let q = 1; q <= s.n; q++) {
      if (s.letter === 'H') {
        row.push(
          i % 4 === 0
            ? `ควรเพิ่มการสื่อสารระหว่างทีมในหน่วยงาน ${dept}`
            : i % 5 === 0
              ? 'ต้องการอบรมด้านความปลอดภัยเพิ่มเติม'
              : ''
        )
      } else {
        const bias = s.letter === 'B' || s.letter === 'D' ? 3.2 : 4.0
        row.push(randLikert(bias))
      }
    }
  }
  exportRows.push(row)
}

const wb = XLSX.utils.book_new()
const wsExport = XLSX.utils.aoa_to_sheet(exportRows)
const wsReport = XLSX.utils.aoa_to_sheet(reportRows)
XLSX.utils.book_append_sheet(wb, wsExport, 'export')
XLSX.utils.book_append_sheet(wb, wsReport, 'HSCS เพื่อออกรายงาน')

fs.mkdirSync(outDir, { recursive: true })
XLSX.writeFile(wb, outFile)
console.log('Wrote', outFile)
