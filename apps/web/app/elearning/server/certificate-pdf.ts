import PDFDocument from 'pdfkit'

export type CertificatePdfData = {
  certificateNo: string
  verifyCode: string
  userName: string
  courseTitle: string
  score: number
  issuedAt: Date
}

export function generateCertificatePdf(data: CertificatePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(22).fillColor('#0066B3').text('โรงพยาบาลมหาวิทยาลัยพะเยา', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(16).fillColor('#333').text('ศูนย์ประสานงาน HA — ใบรับรองการอบรม', { align: 'center' })
    doc.moveDown(2)

    doc.fontSize(14).fillColor('#000').text('ขอมอบใบรับรองฉบับนี้แก่', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(20).fillColor('#0066B3').text(data.userName, { align: 'center' })
    doc.moveDown(1)

    doc.fontSize(14).text('ได้ผ่านการอบรมหลักสูตร', { align: 'center' })
    doc.fontSize(16).text(`"${data.courseTitle}"`, { align: 'center' })
    doc.moveDown(1)

    doc.fontSize(12).text(`คะแนน: ${data.score.toFixed(1)}%`, { align: 'center' })
    doc.text(`เลขที่ใบรับรอง: ${data.certificateNo}`, { align: 'center' })
    doc.text(`รหัสตรวจสอบ: ${data.verifyCode}`, { align: 'center' })
    doc.text(
      `ออกเมื่อ: ${data.issuedAt.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })}`,
      { align: 'center' }
    )

    doc.end()
  })
}
