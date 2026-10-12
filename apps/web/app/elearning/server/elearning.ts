import { randomUUID } from 'crypto'
import { prisma } from '@/app/common/server/prisma'
import { generateCertificatePdf } from '@/app/elearning/server/certificate-pdf'
import { saveCertificatePdf } from '@/app/elearning/server/elearning-storage'

export function formatUserName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim()
}

export function mapQuestionPublic(q: {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  sortOrder: number
}) {
  return {
    id: q.id,
    question: q.question,
    options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
    sortOrder: q.sortOrder,
  }
}

export async function ensureCourseQuiz(courseId: string, passScore: number) {
  return prisma.quiz.upsert({
    where: { courseId },
    update: { passScore },
    create: { courseId, passScore, title: 'แบบทดสอบวัดผล' },
  })
}

export async function getLessonCount(courseId: string) {
  return prisma.lesson.count({ where: { courseId, isActive: true } })
}

export async function calcOverallProgress(userId: string, courseId: string) {
  const [total, completed] = await Promise.all([
    prisma.lesson.count({ where: { courseId, isActive: true } }),
    prisma.userProgress.count({
      where: { userId, courseId, completed: true, lessonId: { not: null } },
    }),
  ])
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export async function getCompletedLessonIds(userId: string, courseId: string) {
  const rows = await prisma.userProgress.findMany({
    where: { userId, courseId, completed: true, lessonId: { not: null } },
    select: { lessonId: true },
  })
  return rows.map((r) => r.lessonId!).filter(Boolean)
}

export async function canTakeQuiz(userId: string, courseId: string) {
  const progress = await calcOverallProgress(userId, courseId)
  return progress >= 100
}

export function generateCertificateNo(): string {
  const year = new Date().getFullYear()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `HA-ELEARN-${year}-${rand}`
}

export async function issueCertificate(params: {
  userId: string
  courseId: string
  courseTitle: string
  userName: string
  score: number
  passScore: number
}) {
  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId: params.userId, courseId: params.courseId } },
  })
  if (existing) {
    return {
      id: existing.id,
      url: `/api/v1/elearning/certificates/${existing.id}/download`,
      certificateNo: existing.certificateNo,
      verifyCode: existing.verifyCode,
    }
  }

  const certificateNo = generateCertificateNo()
  const verifyCode = randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()
  const issuedAt = new Date()

  const cert = await prisma.certificate.create({
    data: {
      userId: params.userId,
      courseId: params.courseId,
      certificateNo,
      verifyCode,
      score: params.score,
      passed: params.score >= params.passScore,
    },
  })

  const pdfBuffer = await generateCertificatePdf({
    certificateNo,
    verifyCode,
    userName: params.userName,
    courseTitle: params.courseTitle,
    score: params.score,
    issuedAt,
  })

  const filePath = await saveCertificatePdf(cert.id, pdfBuffer)
  await prisma.certificate.update({ where: { id: cert.id }, data: { filePath } })

  return {
    id: cert.id,
    url: `/api/v1/elearning/certificates/${cert.id}/download`,
    certificateNo,
    verifyCode,
  }
}
