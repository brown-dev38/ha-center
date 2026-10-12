/** ประเภทและป้ายกำกับ E-learning HA */

export type ElearnCourseListItem = {
  id: string
  title: string
  description: string | null
  passScore: number
  durationHours: number | null
  isPublished: boolean
  lessonCount: number
  userProgress: number | null
}

export type ElearnCourseDetail = {
  id: string
  title: string
  description: string | null
  passScore: number
  durationHours: number | null
  isPublished: boolean
  lessons: ElearnLessonSummary[]
  quiz: {
    id: string
    title: string
    questionCount: number
    passScore: number
  } | null
}

export type ElearnLessonSummary = {
  id: string
  title: string
  orderNo: number
  contentType: string
  duration: number | null
}

export type ElearnLessonDetail = {
  id: string
  title: string
  orderNo: number
  contentType: string
  content: string | null
  contentUrl: string | null
  videoUrl: string | null
  filePath: string | null
  duration: number | null
}

export type ElearnQuizQuestion = {
  id: string
  question: string
  options: { A: string; B: string; C: string; D: string }
  sortOrder: number
}

export type ElearnQuizPayload = {
  id: string
  title: string
  passScore: number
  questions: ElearnQuizQuestion[]
}

export type ElearnMyProgress = {
  completedLessons: string[]
  overallProgress: number
  canTakeQuiz: boolean
}

export type ElearnQuizSubmitResult = {
  score: number
  passed: boolean
  correctAnswers: Array<{
    questionId: string
    correctOption: string
    explanation: string | null
  }>
  certificate?: {
    id: string
    url: string
    certificateNo: string
    verifyCode?: string
  }
}

export type ElearnCertificate = {
  id: string
  certificateNo: string
  verifyCode: string
  score: number | null
  passed: boolean
  course: { id: string; title: string }
  issuedAt: string
  downloadUrl: string
  verifyUrl: string
}

export const ELEARN_SYSTEM_MODULES = [
  {
    title: 'เนื้อหาพื้นฐาน HA',
    description: 'บทเรียนเรียงลำดับ — ความหมาย มาตรฐาน บทบาททีมคุณภาพ และแนวปฏิบัติ',
    icon: 'book' as const,
  },
  {
    title: 'แบบฝึกหัด / ความคืบหน้า',
    description: 'ทำเครื่องหมายเรียนจบแต่ละบท ติดตาม % ความคืบหน้าก่อนสอบ',
    icon: 'progress' as const,
  },
  {
    title: 'ข้อสอบวัดผล',
    description: 'แบบทดสอบหลังเรียนครบ — คะแนนผ่านตามเกณฑ์หลักสูตร (เช่น 70%)',
    icon: 'quiz' as const,
  },
  {
    title: 'ใบรับรอง',
    description: 'ออกใบรับรอง PDF อัตโนมัติเมื่อสอบผ่าน พร้อมรหัสตรวจสอบ',
    icon: 'cert' as const,
  },
]

export const CONTENT_TYPE_LABEL: Record<string, string> = {
  text: 'เนื้อหาอ่าน',
  video: 'วิดีโอ',
  pdf: 'เอกสาร PDF',
  slide: 'สไลด์',
}

export function elearnCourseHref(courseId: string) {
  return `/dashboard/elearning/courses/${courseId}`
}

export function elearnLessonHref(courseId: string, lessonId: string) {
  return `/dashboard/elearning/courses/${courseId}/lessons/${lessonId}`
}

export function elearnQuizHref(courseId: string) {
  return `/dashboard/elearning/courses/${courseId}/quiz`
}

export function elearnHubHref() {
  return '/dashboard/elearning'
}

export function splitLessonParagraphs(content: string | null | undefined): string[] {
  if (!content?.trim()) return []
  return content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function scoreGrade(score: number, passScore: number) {
  if (score >= passScore + 15) return { label: 'ยอดเยี่ยม', className: 'text-emerald-700' }
  if (score >= passScore) return { label: 'ผ่านเกณฑ์', className: 'text-primary' }
  return { label: 'ไม่ผ่านเกณฑ์', className: 'text-destructive' }
}
