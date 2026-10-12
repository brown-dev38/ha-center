import { apiFetch } from '@/app/common/api-fetch'
import { apiHeaders } from '@/app/common/api-headers'
import type {
  ElearnCertificate,
  ElearnCourseDetail,
  ElearnLessonDetail,
  ElearnMyProgress,
  ElearnQuizPayload,
  ElearnQuizSubmitResult,
} from '@/app/elearning/elearning'

import { readApiData, readApiJson } from '@/app/common/parse-api-response'


async function parseResponse<T>(response: Response): Promise<T> {
  return readApiData<T>(response)
}

export function lessonFileUrl(courseId: string, lessonId: string) {
  return `/api/v1/elearning/courses/${courseId}/lessons/${lessonId}/file`
}

export function certificateDownloadUrl(certId: string) {
  return `/api/v1/elearning/certificates/${certId}/download`
}

export async function fetchElearnCourse(id: string) {
  const res = await apiFetch(`/api/v1/elearning/courses/${id}`, { headers: apiHeaders() })
  return parseResponse<ElearnCourseDetail>(res)
}

export async function fetchElearnLesson(courseId: string, lessonId: string) {
  const res = await apiFetch(`/api/v1/elearning/courses/${courseId}/lessons/${lessonId}`, {
    headers: apiHeaders(),
  })
  return parseResponse<ElearnLessonDetail>(res)
}

export async function fetchElearnMyProgress(courseId: string) {
  const res = await apiFetch(`/api/v1/elearning/courses/${courseId}/my-progress`, {
    headers: apiHeaders(),
  })
  return parseResponse<ElearnMyProgress>(res)
}

export async function completeElearnLesson(courseId: string, lessonId: string) {
  const res = await apiFetch(
    `/api/v1/elearning/courses/${courseId}/lessons/${lessonId}/complete`,
    { method: 'POST', headers: apiHeaders() }
  )
  return parseResponse<{ completed: boolean; overallProgress: number }>(res)
}

export async function fetchElearnQuiz(courseId: string) {
  const res = await apiFetch(`/api/v1/elearning/courses/${courseId}/quiz`, {
    headers: apiHeaders(),
  })
  return parseResponse<ElearnQuizPayload>(res)
}

export async function submitElearnQuiz(
  courseId: string,
  answers: Array<{ questionId: string; selectedOption: 'A' | 'B' | 'C' | 'D' }>
) {
  const res = await apiFetch(`/api/v1/elearning/courses/${courseId}/quiz/submit`, {
    method: 'POST',
    headers: apiHeaders(true),
    body: JSON.stringify({ answers }),
  })
  return parseResponse<ElearnQuizSubmitResult>(res)
}

export async function fetchMyCertificates() {
  const res = await apiFetch(`/api/v1/elearning/certificates/my`, {
    headers: apiHeaders(),
  })
  return parseResponse<ElearnCertificate[]>(res)
}

async function mutateJson(url: string, method: string, body?: unknown) {
  const res = await apiFetch(url, {
    method,
    headers: apiHeaders(true),
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await readApiJson<{
    success: boolean
    message?: string
    error?: string
    data?: unknown
  }>(res)
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? json.message ?? 'ดำเนินการไม่สำเร็จ')
  }
  return json
}

export type CourseFormValues = {
  title: string
  description: string
  passScore: number
  durationHours: number | null
  isPublished: boolean
}

export type LessonFormValues = {
  title: string
  content: string
  contentType: string
  contentUrl: string
  videoUrl: string
  duration: number | null
}

export function createCourse(values: CourseFormValues) {
  return mutateJson('/api/v1/elearning/courses', 'POST', values)
}

export function updateCourse(id: string, values: Partial<CourseFormValues>) {
  return mutateJson(`/api/v1/elearning/courses/${id}`, 'PATCH', values)
}

export function deleteCourse(id: string) {
  return mutateJson(`/api/v1/elearning/courses/${id}`, 'DELETE')
}

export function createLesson(courseId: string, values: LessonFormValues) {
  return mutateJson(`/api/v1/elearning/courses/${courseId}/lessons`, 'POST', values)
}

export function updateLesson(courseId: string, lessonId: string, values: Partial<LessonFormValues>) {
  return mutateJson(`/api/v1/elearning/courses/${courseId}/lessons/${lessonId}`, 'PATCH', values)
}

export function deleteLesson(courseId: string, lessonId: string) {
  return mutateJson(`/api/v1/elearning/courses/${courseId}/lessons/${lessonId}`, 'DELETE')
}

export async function openCertificatePdf(certId: string) {
  const res = await apiFetch(certificateDownloadUrl(certId), { headers: apiHeaders() })
  if (!res.ok) throw new Error('เปิดใบรับรองไม่สำเร็จ')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
