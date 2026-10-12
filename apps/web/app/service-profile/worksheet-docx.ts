/**
 * Unit Profile Worksheet — ตัวสร้างไฟล์ .docx จริง
 *
 * เดิมไฟล์ Word ถูกสร้างด้วยการเขียน HTML แล้วให้ Word แปลงเอง ซึ่งตัวแปลงนั้นไม่มีสเปก
 * สาธารณะ ตีความ CSS คนละแบบกับเบราว์เซอร์ และบวกระยะขอบเซลล์ของตัวเองเข้าไป
 * ทำให้ความกว้างตารางกับแนวกระดาษเพี้ยนจาก PDF เสมอ
 *
 * ไฟล์นี้เขียนโครง OOXML ตรง ๆ ผ่านไลบรารี docx จึงกำหนดขนาดได้แน่นอนทุกจุด
 * หน่วยความกว้างทั้งไฟล์เป็น twip (1/20 pt) และตารางทุกใบใช้ layout แบบ fixed
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  PageOrientation,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'

import {
  CONSEQUENCE_COLS,
  CQI_STEP_BG,
  DALI_KEY_PROCESS_HINT,
  DALI_TONE,
  LIKELIHOOD_ROWS,
  RISK_LEVEL_ORDER,
  RISK_TONE,
  worstRiskLevel,
  type DaliTone,
} from '@/app/service-profile/worksheet-export'
import {
  buildRiskAssessmentSummary,
  CQI_STEP_META,
  MISSION_ALIGNMENT_FIXED_ITEMS,
  resolveCqiPlans,
  resolveRiskAssessments,
  riskLevel,
  riskScore,
  STRATEGY_MED_UP_FIXED_ITEMS,
  VISION_FACULTY_FOCUS_ITEMS,
  type CqiDevelopmentPlan,
  type CqiProgressRow,
  type UnitProfileWorksheet,
} from '@/app/service-profile/worksheet-types'

/* -------------------------------------------------------------------------- */
/* หน่วยวัดและค่าคงที่                                                          */
/* -------------------------------------------------------------------------- */

/** 1 px ที่ 96dpi = 0.75pt = 15 twip — ใช้แปลงเลขจากดีไซน์ฝั่งเว็บ */
const px = (n: number) => Math.round(n * 15)
/** ขนาดตัวอักษรใน OOXML เป็นครึ่งพอยต์ */
const hp = (n: number) => Math.round(n * 2)
/** ความหนาเส้นขอบใน OOXML เป็น 1/8 พอยต์ */
const lineWidth = (ptValue: number) => Math.round(ptValue * 8)

const hex = (color: string) => color.replace('#', '').toUpperCase()

/** ฟอนต์มาตรฐานเอกสารราชการไทย — ต้องตั้ง cs ด้วย ไม่งั้น Word ใช้ฟอนต์อื่นกับข้อความไทย */
const FONT = { ascii: 'TH SarabunPSK', hAnsi: 'TH SarabunPSK', cs: 'TH SarabunPSK' }

const A4_SHORT = 11906
const A4_LONG = 16838
/** ขอบด้านยาวของหน้า 1.4 ซม. ด้านสั้น 1.2 ซม. */
const MARGIN_WIDE = 794
const MARGIN_NARROW = 680

const PORTRAIT_W = A4_SHORT - MARGIN_NARROW * 2
const LANDSCAPE_W = A4_LONG - MARGIN_WIDE * 2

/** ระยะขอบในเซลล์มาตรฐาน */
const PAD_X = px(8)
const PAD_Y = px(4)
/** ระยะขอบในกรอบของแต่ละข้อ */
const FRAME_PAD = px(10)

const COLOR = {
  blue: '1E5A9E',
  rose: 'E11D48',
  ink: '111111',
  slate900: '0F172A',
  slate600: '475569',
  slate400: '94A3B8',
  slate200: 'CBD5E1',
  slate100: 'F1F5F9',
  slate50: 'F8FAFC',
  grey: 'CCCCCC',
  white: 'FFFFFF',
  cream: 'FFF5EE',
  creamBorder: 'A67C52',
  purple: '0A4D68',
  sky700: '0369A1',
  sky500: '0EA5E9',
  sky200: 'BAE6FD',
  sky50: 'F0F9FF',
  emerald700: '047857',
  emerald600: '059669',
  emerald200: '6EE7B7',
  emerald100: 'D1FAE5',
  amber500: 'F59E0B',
  rose50: 'FFF1F2',
  rose200: 'FECDD3',
  rose800: '9F1239',
  cyan700: '0284C7',
  step: 'D1D5DB',
  stepText: '374151',
} as const

/* -------------------------------------------------------------------------- */
/* ตัวช่วยระดับ run / paragraph                                                 */
/* -------------------------------------------------------------------------- */

type TextOptions = {
  bold?: boolean
  size?: number
  color?: string
  italics?: boolean
}

/** ตั้งค่าคู่ขนาน complex-script ทุกครั้ง ไม่งั้น Word ใช้ค่าเริ่มต้นกับข้อความไทย */
function run(text: string, options: TextOptions = {}): TextRun {
  const size = hp(options.size ?? 15)
  return new TextRun({
    text,
    font: FONT,
    size,
    sizeComplexScript: size,
    bold: options.bold,
    boldComplexScript: options.bold,
    italics: options.italics,
    italicsComplexScript: options.italics,
    color: options.color ? hex(options.color) : undefined,
  })
}

type ParagraphOptions = TextOptions & {
  align?: (typeof AlignmentType)[keyof typeof AlignmentType]
  before?: number
  after?: number
  indent?: { left?: number; hanging?: number }
  tabRight?: number
}

function paragraph(children: TextRun[], options: ParagraphOptions = {}): Paragraph {
  return new Paragraph({
    children,
    alignment: options.align,
    spacing: { before: options.before ?? 0, after: options.after ?? 0, line: 300 },
    indent: options.indent,
    tabStops: options.tabRight
      ? [{ type: TabStopType.RIGHT, position: options.tabRight }]
      : undefined,
  })
}

const line = (text: string, options: ParagraphOptions = {}) => paragraph([run(text, options)], options)

/** ย่อหน้าบางเฉียบสำหรับปิดท้ายเซลล์ที่มีตารางซ้อน — OOXML บังคับว่าเซลล์ต้องจบด้วยย่อหน้า */
const closer = () =>
  new Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: 'exact' }, children: [] })

/** แตกข้อความหลายบรรทัดเป็นหลายย่อหน้า เพื่อคงการขึ้นบรรทัดที่ผู้ใช้พิมพ์ไว้ */
function textBlock(value: string, options: ParagraphOptions = {}): Paragraph[] {
  const content = value?.trim() ? value : '—'
  return content.split('\n').map((row) => line(row.trim() || ' ', options))
}

/* -------------------------------------------------------------------------- */
/* ตัวช่วยระดับตาราง                                                            */
/* -------------------------------------------------------------------------- */

type Edge = {
  style: (typeof BorderStyle)[keyof typeof BorderStyle]
  size: number
  color: string
}
type Borders = { top: Edge; bottom: Edge; left: Edge; right: Edge }

const edge = (color: string, ptValue = 0.75): Edge => ({
  style: BorderStyle.SINGLE,
  size: lineWidth(ptValue),
  color: hex(color),
})

const NO_EDGE: Edge = { style: BorderStyle.NONE, size: 0, color: COLOR.white }

const boxBorders = (color: string, ptValue = 0.75): Borders => ({
  top: edge(color, ptValue),
  bottom: edge(color, ptValue),
  left: edge(color, ptValue),
  right: edge(color, ptValue),
})

const NO_BORDERS: Borders = { top: NO_EDGE, bottom: NO_EDGE, left: NO_EDGE, right: NO_EDGE }

type CellOptions = {
  width?: number
  fill?: string
  borders?: Borders
  padX?: number
  padY?: number
  colSpan?: number
  rowSpan?: number
  middle?: boolean
}

function cell(children: (Paragraph | Table)[], options: CellOptions = {}): TableCell {
  const padX = options.padX ?? PAD_X
  const padY = options.padY ?? PAD_Y
  return new TableCell({
    children,
    width: options.width ? { size: options.width, type: WidthType.DXA } : undefined,
    columnSpan: options.colSpan,
    rowSpan: options.rowSpan,
    verticalAlign: options.middle ? VerticalAlign.CENTER : VerticalAlign.TOP,
    borders: options.borders ?? NO_BORDERS,
    margins: { top: padY, bottom: padY, left: padX, right: padX, marginUnitType: WidthType.DXA },
    shading: options.fill
      ? { type: ShadingType.CLEAR, fill: hex(options.fill), color: 'auto' }
      : undefined,
  })
}

function table(rows: TableRow[], columnWidths: number[]): Table {
  return new Table({
    rows,
    columnWidths,
    width: { size: columnWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: NO_BORDERS,
  })
}

/** วางบล็อกหลายชิ้นเรียงเป็นคอลัมน์ พร้อมช่องไฟคั่น (Word ไม่มี flex gap) */
function columns(items: (Paragraph | Table)[][], total: number, gap: number): Table {
  const count = items.length
  const usable = total - gap * (count - 1)
  const base = Math.floor(usable / count)
  const widths = items.map((_, i) => (i === count - 1 ? usable - base * (count - 1) : base))

  const cells: TableCell[] = []
  const grid: number[] = []
  items.forEach((children, i) => {
    cells.push(cell([...children, closer()], { width: widths[i], padX: 0, padY: 0 }))
    grid.push(widths[i])
    if (i < count - 1) {
      cells.push(cell([closer()], { width: gap, padX: 0, padY: 0 }))
      grid.push(gap)
    }
  })

  return table([new TableRow({ children: cells })], grid)
}

/** ความกว้างของการ์ดแต่ละใบเมื่อวางเรียง n ใบในพื้นที่ที่กำหนด */
const cardWidth = (total: number, count: number, gap: number) =>
  Math.floor((total - gap * (count - 1)) / count)

/* -------------------------------------------------------------------------- */
/* โครงหน้าและกรอบของแต่ละข้อ                                                   */
/* -------------------------------------------------------------------------- */

type PageBox = {
  /** ความกว้างเนื้อหาของหน้า */
  width: number
  /** ความกว้างภายในกรอบของแต่ละข้อ */
  inner: number
  /** ความกว้างของแต่ละคอลัมน์ในเลย์เอาต์สองคอลัมน์ */
  half: number
}

function pageBox(width: number): PageBox {
  const inner = width - FRAME_PAD * 2
  return { width, inner, half: Math.floor((inner - px(20)) / 2) }
}

const PORTRAIT = pageBox(PORTRAIT_W)
const LANDSCAPE = pageBox(LANDSCAPE_W)

/** กรอบของแต่ละข้อ — แถบหัวสีทึบ + กล่องเนื้อหามีเส้นขอบ */
function sectionFrame(
  no: string,
  title: string,
  body: (Paragraph | Table)[],
  box: PageBox,
  headFill: string = COLOR.blue
): Table {
  return table(
    [
      new TableRow({
        children: [
          cell([line(`${no} ${title}`, { bold: true, color: COLOR.white })], {
            width: box.width,
            fill: headFill,
            padX: FRAME_PAD,
            padY: px(5),
          }),
        ],
      }),
      new TableRow({
        children: [
          cell([...body, closer()], {
            width: box.width,
            padX: FRAME_PAD,
            padY: FRAME_PAD,
            borders: {
              top: NO_EDGE,
              bottom: edge(COLOR.grey),
              left: edge(COLOR.grey),
              right: edge(COLOR.grey),
            },
          }),
        ],
      }),
    ],
    [box.width]
  )
}

const gapLine = (height = px(10)) =>
  new Paragraph({ spacing: { before: 0, after: 0, line: height, lineRule: 'exact' }, children: [] })

/* -------------------------------------------------------------------------- */
/* ชิ้นส่วนเนื้อหาที่ใช้ซ้ำ                                                       */
/* -------------------------------------------------------------------------- */

const LABEL_W = px(150)

/** แถวข้อมูลแบบ "ป้ายกำกับ : ค่า" */
function fieldRow(label: string, value: string, boxed = false, width: number): TableRow {
  const valueW = width - LABEL_W
  return new TableRow({
    children: [
      cell([line(label, { bold: true })], { width: LABEL_W, padX: 0, padY: px(3) }),
      cell(boxed ? [...textBlock(value), closer()] : textBlock(value), {
        width: valueW,
        padX: boxed ? PAD_X : 0,
        padY: boxed ? px(6) : px(3),
        fill: boxed ? COLOR.cream : undefined,
        borders: boxed ? boxBorders(COLOR.creamBorder) : undefined,
      }),
    ],
  })
}

const fieldTable = (rows: TableRow[], width: number) => table(rows, [LABEL_W, width - LABEL_W])

/** รายการมีหมายเลข/จุดนำ — ใช้ย่อหน้าเยื้องแขวน อ่านง่ายและแก้ไขต่อได้ใน Word */
function numberedList(label: string, items: string[], numbered: boolean): Paragraph[] {
  const indent = { left: px(22), hanging: px(22) }
  return [
    line(label, { bold: true, after: px(4) }),
    ...items.map((item, i) =>
      line(`${numbered ? `${i + 1})` : '•'}\u00a0${item?.trim() || '—'}`, { indent, after: px(2) })
    ),
  ]
}

/** ป้ายระดับความเสี่ยง */
function riskChip(level: keyof typeof RISK_TONE, text: string, width: number): Table {
  const tone = RISK_TONE[level]
  return table(
    [
      new TableRow({
        children: [
          cell([line(text, { bold: true, size: 12, color: tone.text })], {
            width,
            fill: tone.bg,
            borders: boxBorders(tone.border),
            padX: px(8),
            padY: px(2),
          }),
        ],
      }),
    ],
    [width]
  )
}

/**
 * ตาราง Risk Matrix — โครงเดียวกับหน้ากรอกข้อมูล
 * แกน Consequence ด้านบน / Likelihood ด้านซ้าย ช่องไล่สีตามระดับ และช่องที่เลือกตีกรอบเข้ม
 */
function riskMatrix(cells: UnitProfileWorksheet['riskCells'], width: number): Table {
  const selected = new Set(cells.map((c) => `${c.likelihood}-${c.consequence}`))
  const scoreW = Math.floor(width * 0.17)
  const labelW = width - scoreW * 5
  const grid = [labelW, ...CONSEQUENCE_COLS.map(() => scoreW)]

  const axisCell = (children: Paragraph[], width_: number, rowSpan?: number) =>
    cell(children, {
      width: width_,
      rowSpan,
      middle: true,
      padX: px(4),
      padY: px(3),
      borders: boxBorders(COLOR.slate200),
      fill: COLOR.slate50,
    })

  const header = new TableRow({
    children: [
      axisCell(
        [
          line('Likelihood', { bold: true, size: 12, align: AlignmentType.CENTER }),
          line('(Probability)', { bold: true, size: 12, align: AlignmentType.CENTER }),
        ],
        labelW,
        2
      ),
      cell([line('CONSEQUENCE (IMPACT)', { bold: true, size: 12, align: AlignmentType.CENTER })], {
        colSpan: 5,
        middle: true,
        padY: px(2),
        borders: boxBorders(COLOR.slate200),
        fill: COLOR.slate50,
      }),
    ],
  })

  const headerCols = new TableRow({
    children: CONSEQUENCE_COLS.map((c) =>
      axisCell(
        [
          line(String(c.value), { bold: true, size: 12, align: AlignmentType.CENTER }),
          line(c.label, { size: 11, align: AlignmentType.CENTER }),
        ],
        scoreW
      )
    ),
  })

  const body = LIKELIHOOD_ROWS.map(
    (l) =>
      new TableRow({
        children: [
          axisCell(
            [
              line(String(l.value), { bold: true, size: 12, align: AlignmentType.CENTER }),
              line(l.label, { size: 11, align: AlignmentType.CENTER }),
            ],
            labelW
          ),
          ...CONSEQUENCE_COLS.map((c) => {
            const score = riskScore(l.value, c.value)
            const tone = RISK_TONE[riskLevel(score)]
            const active = selected.has(`${l.value}-${c.value}`)
            return cell(
              [
                line(tone.en, {
                  size: 11,
                  bold: active,
                  color: tone.text,
                  align: AlignmentType.CENTER,
                }),
                line(String(score), {
                  size: 13,
                  bold: true,
                  color: tone.text,
                  align: AlignmentType.CENTER,
                }),
              ],
              {
                width: scoreW,
                middle: true,
                fill: tone.bg,
                padX: px(2),
                padY: px(4),
                borders: active ? boxBorders(COLOR.slate900, 2.25) : boxBorders(tone.border),
              }
            )
          }),
        ],
      })
  )

  return table([header, headerCols, ...body], grid)
}

/** แถบคำอธิบายสีใต้ Risk Matrix */
function riskLegend(width: number): Table {
  const gap = px(4)
  const chipW = Math.floor((width - gap * (RISK_LEVEL_ORDER.length - 1)) / RISK_LEVEL_ORDER.length)
  return columns(
    RISK_LEVEL_ORDER.map((key) => [riskChip(key, RISK_TONE[key].range, chipW)]),
    width,
    gap
  )
}

/** ตาราง CQI รายปี — หัวตาราง Topic / Result และคอลัมน์ลำดับ */
function cqiYearTable(year: string, rows: CqiProgressRow[], width: number): (Paragraph | Table)[] {
  const indexW = px(32)
  const textW = Math.floor((width - indexW) / 2)
  const grid = [indexW, textW, width - indexW - textW]
  const borders = boxBorders(COLOR.slate200)
  const safeRows = rows.length ? rows : [{ topic: '', result: '' }]

  const head = new TableRow({
    children: [
      cell([closer()], { width: indexW, fill: COLOR.slate100, borders }),
      cell([line('Topic', { bold: true })], { width: grid[1], fill: COLOR.slate100, borders }),
      cell([line('Result', { bold: true })], { width: grid[2], fill: COLOR.slate100, borders }),
    ],
  })

  const body = safeRows.map(
    (row, i) =>
      new TableRow({
        children: [
          cell([line(`${i + 1})`, { bold: true, color: COLOR.slate600, align: AlignmentType.CENTER })], {
            width: indexW,
            fill: COLOR.slate50,
            borders,
            padX: px(2),
          }),
          cell(textBlock(row.topic), { width: grid[1], borders }),
          cell(textBlock(row.result), { width: grid[2], borders }),
        ],
      })
  )

  return [
    line(year, { bold: true, color: COLOR.blue, align: AlignmentType.CENTER, after: px(4) }),
    table([head, ...body], grid),
  ]
}

/* -------------------------------------------------------------------------- */
/* ผัง 3C – DALI                                                                */
/* -------------------------------------------------------------------------- */

/** การ์ดเวที DALI : แถบหัวสี + ชื่ออังกฤษซ้าย / ไทยขวา + เนื้อหาพื้นขาว */
function daliCard(
  en: string,
  th: string,
  value: string,
  tone: DaliTone,
  width: number,
  step?: string
): Table {
  const t = DALI_TONE[tone]
  const headInner = width - px(16)
  const heading = paragraph(
    [
      ...(step ? [run(`${step}  `, { bold: true, size: 11, color: t.headText })] : []),
      run(en, { bold: true, size: 13, color: t.headText }),
      run('\t'),
      run(th, { size: 11, color: t.headText }),
    ],
    { tabRight: headInner }
  )

  return table(
    [
      new TableRow({
        children: [
          cell([heading], {
            width,
            fill: t.head,
            padX: px(8),
            padY: px(4),
            borders: NO_BORDERS,
          }),
        ],
      }),
      new TableRow({
        children: [
          cell(textBlock(value, { size: 13 }), {
            width,
            fill: COLOR.white,
            padX: px(8),
            padY: px(6),
          }),
        ],
      }),
    ],
    [width]
  )
}

/** หัวข้อเฟส 1 / 2 / 3 พร้อมหมายเลขกำกับ */
function daliPhase(step: string, title: string, sub: string, color: string): Paragraph {
  return new Paragraph({
    spacing: { before: px(2), after: px(6), line: 300 },
    children: [
      new TextRun({
        text: ` ${step} `,
        font: FONT,
        size: hp(12),
        sizeComplexScript: hp(12),
        bold: true,
        boldComplexScript: true,
        color: COLOR.white,
        shading: { type: ShadingType.CLEAR, fill: hex(color), color: 'auto' },
      }),
      run(`  ${title}`, { bold: true, size: 14, color: COLOR.slate900 }),
      run(`   ${sub}`, { size: 11, color: COLOR.slate600 }),
    ],
  })
}

const daliArrow = () =>
  line('▼', { align: AlignmentType.CENTER, color: COLOR.sky500, bold: true, before: px(4), after: px(4) })

/** กล่องข้อความพื้นอ่อนมีเส้นขอบ ใช้กับหมายเหตุในผัง DALI */
function noteBox(text: string, fill: string, border: string, width: number, size = 13): Table {
  return table(
    [
      new TableRow({
        children: [
          cell(textBlock(text, { size }), {
            width,
            fill,
            borders: boxBorders(border),
            padX: px(8),
            padY: px(6),
          }),
        ],
      }),
    ],
    [width]
  )
}

function daliDiagram(dali: UnitProfileWorksheet['daliFramework'], width: number): (Paragraph | Table)[] {
  const v = (key: keyof UnitProfileWorksheet['daliFramework']) => dali?.[key] ?? ''
  const gap = px(6)
  const w2 = cardWidth(width, 2, gap)
  const w3 = cardWidth(width, 3, gap)
  const row = (cards: Table[]) => columns(cards.map((c) => [c]), width, gap)

  return [
    daliPhase('1', 'Key Process / Key Population', 'กระบวนการ / ประชากรเป้าหมาย', COLOR.emerald600),
    noteBox(v('keyProcess') || DALI_KEY_PROCESS_HINT, COLOR.slate50, COLOR.slate200, width),
    gapLine(px(6)),
    row([
      daliCard('Core Values & Concepts', 'หลักคิด', v('coreValues'), 'green', w3),
      daliCard('Context', 'บริบท', v('context'), 'red', w3),
      daliCard('Criteria', 'เกณฑ์', v('criteria'), 'green', w3),
    ]),
    daliArrow(),
    daliPhase('2', 'Effective Care Design', 'ออกแบบการดูแลที่มีประสิทธิภาพ', COLOR.cyan700),
    line('• Evidence-based / HFE   • Tacit knowledge   • Gap Analysis, CareMap', {
      size: 12,
      color: COLOR.sky700,
      after: px(6),
    }),
    row([
      daliCard('Purpose', 'เป้าหมายเชิงรุก', v('purpose'), 'red', w2),
      daliCard('Design', 'ออกแบบ', v('design'), 'amber', w2),
    ]),
    gapLine(px(4)),
    noteBox(
      'ทิศทางที่ควรเน้นเพื่อความสำเร็จและความต่อเนื่อง คือ การดูแลผู้ป่วย',
      COLOR.sky50,
      COLOR.sky200,
      width,
      12
    ),
    daliArrow(),
    daliPhase('3', 'Clinical CQI (DALI)', 'วงจรพัฒนาคุณภาพต่อเนื่อง', COLOR.amber500),
    row([
      daliCard('Action', 'ปฏิบัติ', v('action'), 'green', w2, '1'),
      daliCard('Learning', 'เรียนรู้', v('learning'), 'red', w2, '2'),
    ]),
    gapLine(px(4)),
    row([
      daliCard('Improve', 'ปรับปรุง', v('improve'), 'amber', w2, '4'),
      daliCard('Spread', 'ขยายผล', v('spread'), 'amber', w2, '3'),
    ]),
    line('Clinical CQI', {
      bold: true,
      size: 13,
      align: AlignmentType.CENTER,
      color: COLOR.slate900,
      before: px(4),
      after: px(4),
    }),
    row([
      daliCard('Patient Care', 'การดูแลผู้ป่วย', v('patientCare'), 'sky', w2),
      daliCard('Monitor & Learning', 'ติดตามและเรียนรู้', v('monitorLearning'), 'sky', w2),
    ]),
  ]
}

/* -------------------------------------------------------------------------- */
/* เนื้อหาแต่ละข้อ                                                              */
/* -------------------------------------------------------------------------- */

function unitInformation(data: UnitProfileWorksheet, box: PageBox): (Paragraph | Table)[] {
  const focusInner = box.inner - px(18)
  return [
    fieldTable(
      [
        fieldRow('Unit :', data.unit, false, box.inner),
        fieldRow('Vision - Faculty :', data.visionFaculty, false, box.inner),
        fieldRow('Vision - Hospital :', data.visionHospital, true, box.inner),
      ],
      box.inner
    ),
    gapLine(px(6)),
    table(
      [
        new TableRow({
          children: [
            cell(
              [
                line('เข็มมุ่ง (Focus area)', { bold: true, color: COLOR.purple, after: px(4) }),
                ...VISION_FACULTY_FOCUS_ITEMS.map((item) =>
                  line(`•\u00a0${item}`, { indent: { left: px(14), hanging: px(14) } })
                ),
                closer(),
              ],
              {
                width: focusInner,
                fill: COLOR.cream,
                borders: boxBorders(COLOR.creamBorder),
                padY: px(6),
              }
            ),
          ],
        }),
      ],
      [focusInner]
    ),
    gapLine(px(6)),
    fieldTable([fieldRow('Core Value :', data.coreValue, true, box.inner)], box.inner),
  ]
}

function twoColumns(
  left: (Paragraph | Table)[],
  right: (Paragraph | Table)[],
  box: PageBox
): Table {
  return columns([left, right], box.inner, px(20))
}

function riskAssessmentSection(data: UnitProfileWorksheet, box: PageBox): (Paragraph | Table)[] {
  const chipW = px(130)
  return resolveRiskAssessments(data).flatMap((assessment, index) => {
    const worst = worstRiskLevel(assessment.cells)
    const heading = table(
      [
        new TableRow({
          children: [
            cell([line(String(index + 1), { bold: true, size: 13, color: COLOR.white, align: AlignmentType.CENTER })], {
              width: px(26),
              fill: COLOR.slate900,
              middle: true,
              padX: px(4),
              padY: px(5),
              borders: boxBorders(COLOR.slate200),
            }),
            cell(
              [
                line(
                  `หัวข้อที่ ${index + 1}${assessment.topic.trim() ? ` — ${assessment.topic.trim()}` : ''}`,
                  { bold: true, color: COLOR.slate900 }
                ),
              ],
              {
                width: box.inner - px(26) - chipW,
                fill: COLOR.slate50,
                middle: true,
                padY: px(5),
                borders: boxBorders(COLOR.slate200),
              }
            ),
            cell(worst ? [riskChip(worst, `สูงสุด: ${RISK_TONE[worst].th}`, chipW - px(16)), closer()] : [closer()], {
              width: chipW,
              fill: COLOR.slate50,
              middle: true,
              padY: px(5),
              borders: boxBorders(COLOR.slate200),
            }),
          ],
        }),
      ],
      [px(26), box.inner - px(26) - chipW, chipW]
    )

    return [
      ...(index === 0 ? [] : [gapLine(px(14))]),
      heading,
      gapLine(px(8)),
      fieldTable([fieldRow('หัวข้อประเมิน :', assessment.topic, false, box.inner)], box.inner),
      gapLine(px(8)),
      riskMatrix(assessment.cells, box.inner),
      gapLine(px(6)),
      riskLegend(box.inner),
      gapLine(px(6)),
      line(
        assessment.cells.length
          ? `ความเสี่ยงที่เลือก: ${assessment.cells
              .map((c) => `L${c.likelihood}×C${c.consequence}=${riskScore(c.likelihood, c.consequence)}`)
              .join(', ')}`
          : 'ยังไม่ได้เลือกช่องใน Risk Matrix',
        { size: 12, color: assessment.cells.length ? COLOR.slate600 : COLOR.slate400 }
      ),
      gapLine(px(8)),
      fieldTable(
        [fieldRow('สรุปค่าประเมิน :', buildRiskAssessmentSummary(assessment.cells), true, box.inner)],
        box.inner
      ),
    ]
  })
}

function cqiInProgressSection(data: UnitProfileWorksheet, box: PageBox): (Paragraph | Table)[] {
  const gap = px(8)
  const daliInner = box.inner - px(22)

  return [
    columns(
      [
        cqiYearTable('2023', data.cqiInProgress.y2023, cardWidth(box.inner, 3, gap)),
        cqiYearTable('2024', data.cqiInProgress.y2024, cardWidth(box.inner, 3, gap)),
        cqiYearTable('2025', data.cqiInProgress.y2025, cardWidth(box.inner, 3, gap)),
      ],
      box.inner,
      gap
    ),
    gapLine(px(12)),
    table(
      [
        new TableRow({
          children: [
            cell(
              [
                paragraph(
                  [
                    run('การประยุกต์ใช้ 3C – DALI กับการออกแบบการดูแลผู้ป่วย', {
                      bold: true,
                      color: COLOR.white,
                    }),
                    run('\t'),
                    run('Applying 3C – DALI to Patient Care Design', {
                      size: 11,
                      color: COLOR.emerald100,
                    }),
                  ],
                  { tabRight: daliInner }
                ),
              ],
              {
                width: box.inner,
                fill: COLOR.emerald700,
                padX: px(10),
                padY: px(6),
                borders: NO_BORDERS,
              }
            ),
          ],
        }),
        new TableRow({
          children: [
            cell([...daliDiagram(data.daliFramework, daliInner), closer()], {
              width: box.inner,
              padX: px(10),
              padY: px(10),
              borders: {
                top: NO_EDGE,
                bottom: edge(COLOR.emerald200),
                left: edge(COLOR.emerald200),
                right: edge(COLOR.emerald200),
              },
            }),
          ],
        }),
      ],
      [box.inner]
    ),
  ]
}

function cqiStepCard(
  step: (typeof CQI_STEP_META)[number],
  content: string,
  fill: string,
  width: number
): Table {
  return table(
    [
      new TableRow({
        children: [
          cell(
            [
              line(step.title, { bold: true, after: px(4) }),
              ...step.hints.map((hint) =>
                line(`•\u00a0${hint}`, {
                  size: 13,
                  color: COLOR.stepText,
                  indent: { left: px(12), hanging: px(12) },
                })
              ),
              gapLine(px(4)),
              ...textBlock(content),
              closer(),
            ],
            {
              width,
              fill,
              borders: boxBorders(COLOR.step),
              padX: px(6),
              padY: px(6),
            }
          ),
        ],
      }),
    ],
    [width]
  )
}

function cqiDevelopmentSection(data: UnitProfileWorksheet, box: PageBox): (Paragraph | Table)[] {
  const gap = px(6)
  const stepW = cardWidth(box.inner, CQI_STEP_META.length, gap)

  const steps = (plan: CqiDevelopmentPlan) =>
    columns(
      CQI_STEP_META.map((step, i) => [cqiStepCard(step, plan.steps[i]?.content ?? '', CQI_STEP_BG[i], stepW)]),
      stepW * CQI_STEP_META.length + gap * (CQI_STEP_META.length - 1),
      gap
    )

  return resolveCqiPlans(data).flatMap((plan, index) => {
    const title = `โครงการที่ ${index + 1}${plan.title.trim() ? ` — ${plan.title.trim()}` : ''}${
      plan.year.trim() ? ` · Year ${plan.year.trim()}` : ''
    }`
    return [
      ...(index === 0 ? [] : [gapLine(px(12))]),
      table(
        [
          new TableRow({
            children: [
              cell([line(title, { bold: true, color: COLOR.rose800 })], {
                width: box.inner,
                fill: COLOR.rose50,
                borders: boxBorders(COLOR.rose200),
                padX: px(10),
                padY: px(6),
              }),
            ],
          }),
        ],
        [box.inner]
      ),
      gapLine(px(8)),
      fieldTable(
        [
          fieldRow('CQI Title (ชื่อเรื่อง CQI) :', plan.title, false, box.inner),
          fieldRow('Owner/Responsible (ผู้รับผิดชอบ) :', plan.owner, false, box.inner),
          fieldRow('Objective (วัตถุประสงค์) :', plan.objective, false, box.inner),
          fieldRow('Timeline (ระยะเวลา) :', plan.timeline, false, box.inner),
        ],
        box.inner
      ),
      gapLine(px(8)),
      steps(plan),
    ]
  })
}

/* -------------------------------------------------------------------------- */
/* ประกอบเอกสาร                                                                 */
/* -------------------------------------------------------------------------- */

function documentHeader(data: UnitProfileWorksheet, logo: ArrayBuffer | null, box: PageBox): Table {
  const logoW = px(56)
  const metaW = px(220)
  const titleW = box.width - logoW - metaW

  const displayDate = data.date
    ? new Date(data.date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })
    : '—'

  const logoCell = logo
    ? cell(
        [
          new Paragraph({
            spacing: { before: 0, after: 0, line: 240, lineRule: 'exact' },
            children: [
              new ImageRun({ type: 'png', data: logo, transformation: { width: 48, height: 48 } }),
            ],
          }),
        ],
        { width: logoW, padX: 0, middle: true }
      )
    : cell([closer()], { width: logoW, padX: 0 })

  return table(
    [
      new TableRow({
        children: [
          logoCell,
          cell([line('UNIT PROFILE', { bold: true, size: 22, color: COLOR.blue })], {
            width: titleW,
            padX: px(6),
            middle: true,
            borders: { ...NO_BORDERS, bottom: edge(COLOR.blue, 1.5) },
          }),
          cell(
            [
              paragraph([run('Date : ', { bold: true }), run(displayDate)], {
                align: AlignmentType.RIGHT,
              }),
              paragraph([run('Unit : ', { bold: true }), run(data.unitHeader || '—')], {
                align: AlignmentType.RIGHT,
              }),
            ],
            {
              width: metaW,
              padX: 0,
              borders: { ...NO_BORDERS, bottom: edge(COLOR.blue, 1.5) },
            }
          ),
        ],
      }),
    ],
    [logoW, titleW, metaW]
  )
}

// docx สลับ width/height ให้เองเมื่อเป็นแนวนอน จึงต้องส่งขนาดแนวตั้งเข้าไปเสมอ
const pageProperties = (orientation: 'portrait' | 'landscape') => ({
  page: {
    size: {
      width: A4_SHORT,
      height: A4_LONG,
      orientation:
        orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
    },
    margin:
      orientation === 'landscape'
        ? { top: MARGIN_NARROW, bottom: MARGIN_NARROW, left: MARGIN_WIDE, right: MARGIN_WIDE }
        : { top: MARGIN_WIDE, bottom: MARGIN_WIDE, left: MARGIN_NARROW, right: MARGIN_NARROW },
  },
})

export function buildWorksheetDocument(
  data: UnitProfileWorksheet,
  logo: ArrayBuffer | null = null
): Document {
  const p = PORTRAIT
  const l = LANDSCAPE

  const front: (Paragraph | Table)[] = [
    documentHeader(data, logo, p),
    gapLine(px(14)),
    sectionFrame('1.', 'Unit Information (ข้อมูลพื้นฐานหน่วยงาน)', unitInformation(data, p), p),
    gapLine(px(12)),
    sectionFrame(
      '2.',
      'Mission (พันธกิจ)',
      [
        twoColumns(
          numberedList('Mission (in Alignment with Organization)', [...MISSION_ALIGNMENT_FIXED_ITEMS], true),
          numberedList('Mission (of Unit)', data.missionOfUnit, true),
          p
        ),
      ],
      p
    ),
    gapLine(px(12)),
    sectionFrame(
      '3.',
      'Risk Matrix (ตารางประเมินความเสี่ยง)',
      riskAssessmentSection(data, p),
      p
    ),
    gapLine(px(12)),
    sectionFrame(
      '4.',
      'Strategy (กลยุทธ์)',
      [
        twoColumns(
          numberedList('Strategy (MED UP)', [...STRATEGY_MED_UP_FIXED_ITEMS], false),
          numberedList('Unit Strategy', data.unitStrategy, true),
          p
        ),
      ],
      p
    ),
  ]

  const wide: (Paragraph | Table)[] = [
    sectionFrame(
      '5.',
      'CQI in Progress (งานพัฒนาคุณภาพที่กำลังดำเนินการ)',
      cqiInProgressSection(data, l),
      l
    ),
    gapLine(px(12)),
    sectionFrame(
      '6.',
      'CQI Development Plan (แผนการทำโครงการพัฒนาคุณภาพ)',
      cqiDevelopmentSection(data, l),
      l,
      COLOR.rose
    ),
  ]

  const back: (Paragraph | Table)[] = [
    sectionFrame(
      '7.',
      'KPI / Key Results / Best Practice (ตัวชี้วัด / ผลลัพธ์ / แนวปฏิบัติที่เป็นเลิศ)',
      [
        twoColumns(
          numberedList('KPI / Key Success Indicators', data.kpiIndicators, true),
          numberedList('Results/Target', data.kpiResults, true),
          p
        ),
        gapLine(px(10)),
        ...numberedList('Best Practice / Key Learnings', data.bestPractices, true),
        gapLine(px(8)),
        paragraph([run('Prepared by : ', { bold: true }), run(data.preparedBy || '—')]),
      ],
      p
    ),
    gapLine(px(10)),
    table(
      [
        new TableRow({
          children: [
            cell(
              [
                paragraph([
                  run('Note : ', { bold: true }),
                  run(
                    'Risk Matrix is used to prioritize key risks and supports CQI planning and unit risk management.'
                  ),
                ]),
              ],
              {
                width: p.width,
                fill: COLOR.sky50,
                borders: boxBorders(COLOR.sky200),
                padY: px(6),
              }
            ),
          ],
        }),
      ],
      [p.width]
    ),
  ]

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: hp(15), sizeComplexScript: hp(15), color: COLOR.ink },
          paragraph: { spacing: { before: 0, after: 0, line: 300 } },
        },
      },
    },
    sections: [
      { properties: pageProperties('portrait'), children: front },
      { properties: pageProperties('landscape'), children: wide },
      { properties: pageProperties('portrait'), children: back },
    ],
  })
}

async function loadLogo(): Promise<ArrayBuffer | null> {
  if (typeof window === 'undefined') return null
  try {
    const response = await fetch(`${window.location.origin}/logo2.png`)
    if (!response.ok) return null
    return await response.arrayBuffer()
  } catch {
    return null
  }
}

export async function downloadWorksheetDocx(data: UnitProfileWorksheet, filename: string) {
  const logo = await loadLogo()
  const blob = await Packer.toBlob(buildWorksheetDocument(data, logo))
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
