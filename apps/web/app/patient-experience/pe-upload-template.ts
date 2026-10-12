/**
 * เทมเพลต CSV ตามแบบประเมิน PEP — ใช้เป็นหัวคอลัมน์มาตรฐานเมื่ออัปโหลด
 */

import {
  PE_PART2_SHORT_LABELS,
  PE_PART3_SHORT_LABELS,
} from '@/app/patient-experience/pe-survey-form-content'

export function buildPeUploadTemplateCsv(): string {
  const part2 = Array.from({ length: 16 }, (_, i) => `part2_${i + 1}`)
  const part3 = Array.from({ length: 5 }, (_, i) => `part3_${i + 1}`)

  const headers = [
    'date',
    'department',
    'visit_frequency',
    'gender',
    'age',
    'education',
    'rights',
    ...part2,
    'part2_17',
    ...part3,
    'answer_part3_text',
  ]

  const sample = [
    '2569-01-15',
    'ผู้ป่วยนอก 1',
    'มากกว่า 1 ครั้ง',
    'หญิง',
    '36-51 ปี',
    'ปริญญาตรี',
    'หลักประกันสุขภาพถ้วนหน้า',
    ...Array.from({ length: 16 }, () => '5'),
    'แนะนำ',
    '1',
    '1',
    '0',
    '0',
    '0',
    'เจ้าหน้าที่ดูแลเอาใจใส่ เป็นกันเอง',
  ]

  const guide = [
    '# หัวคอลัมน์มาตรฐานแบบประเมิน PEP',
    `# ส่วนที่ 2: ${PE_PART2_SHORT_LABELS.map((l, i) => `${i + 1}=${l}`).join(' | ')}`,
    `# ส่วนที่ 3: ${PE_PART3_SHORT_LABELS.map((l, i) => `${i + 1}=${l}`).join(' | ')}`,
    '# คะแนนส่วนที่ 2 ใช้ 0–5 (0=ไม่ได้ใช้บริการ) · ข้อ 17 ใช้ แนะนำ/ไม่แนะนำ',
    '# ส่วนที่ 3 ใช้ 1=เลือก / 0=ไม่เลือก และใส่ข้อความเพิ่มใน answer_part3_text ได้',
  ]

  return `${guide.join('\n')}\n${headers.join(',')}\n${sample.join(',')}\n`
}

export function downloadPeUploadTemplate() {
  const csv = buildPeUploadTemplateCsv()
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pep-survey-upload-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}
