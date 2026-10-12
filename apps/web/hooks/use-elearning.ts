'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ElearnCourseListItem } from '@/app/elearning/elearning'
import { fetchApiList } from '@/app/common/api-json'
import {
  type CourseFormValues,
  type LessonFormValues,
  createCourse,
  createLesson,
  deleteCourse,
  deleteLesson,
  fetchElearnCourse,
  fetchElearnLesson,
  fetchElearnMyProgress,
  fetchElearnQuiz,
  fetchMyCertificates,
  updateCourse,
  updateLesson,
} from '@/app/elearning/elearning-api'

type CoursesParams = {
  search?: string
  isPublished?: string
  page?: number
  limit?: number
}

export function useElearnCourses(params: CoursesParams = {}) {
  return useQuery({
    queryKey: ['elearning', 'courses', params],
    queryFn: async () => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      const published = params.isPublished ?? 'true'
      if (published === 'true' || published === 'false') q.set('isPublished', published)
      q.set('page', String(params.page ?? 1))
      q.set('limit', String(params.limit ?? 20))
      return fetchApiList<ElearnCourseListItem, { page: number; limit: number; total: number; totalPages: number }>(
        `elearning/courses?${q}`
      )
    },
  })
}

export function useElearnCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ['elearning', 'course', courseId],
    queryFn: () => fetchElearnCourse(courseId!),
    enabled: Boolean(courseId?.trim()),
  })
}

export function useElearnLesson(courseId: string | undefined, lessonId: string | undefined) {
  return useQuery({
    queryKey: ['elearning', 'lesson', courseId, lessonId],
    queryFn: () => fetchElearnLesson(courseId!, lessonId!),
    enabled: Boolean(courseId?.trim() && lessonId?.trim()),
  })
}

export function useElearnProgress(courseId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['elearning', 'progress', courseId],
    queryFn: () => fetchElearnMyProgress(courseId!),
    enabled: Boolean(courseId?.trim()) && enabled,
    retry: false,
  })
}

export function useElearnQuiz(courseId: string | undefined, enabled = false) {
  return useQuery({
    queryKey: ['elearning', 'quiz', courseId],
    queryFn: () => fetchElearnQuiz(courseId!),
    enabled: Boolean(courseId?.trim()) && enabled,
    retry: false,
  })
}

export function useMyCertificates() {
  return useQuery({
    queryKey: ['elearning', 'certificates'],
    queryFn: fetchMyCertificates,
    retry: false,
  })
}

function useInvalidateElearning() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['elearning'] })
}

export function useCreateCourse() {
  const invalidate = useInvalidateElearning()
  return useMutation({
    mutationFn: (values: CourseFormValues) => createCourse(values),
    onSuccess: invalidate,
  })
}

export function useUpdateCourse(id: string) {
  const invalidate = useInvalidateElearning()
  return useMutation({
    mutationFn: (values: Partial<CourseFormValues>) => updateCourse(id, values),
    onSuccess: invalidate,
  })
}

export function useDeleteCourse() {
  const invalidate = useInvalidateElearning()
  return useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: invalidate,
  })
}

export function useCreateLesson(courseId: string) {
  const invalidate = useInvalidateElearning()
  return useMutation({
    mutationFn: (values: LessonFormValues) => createLesson(courseId, values),
    onSuccess: invalidate,
  })
}

export function useUpdateLesson(courseId: string) {
  const invalidate = useInvalidateElearning()
  return useMutation({
    mutationFn: ({ lessonId, values }: { lessonId: string; values: Partial<LessonFormValues> }) =>
      updateLesson(courseId, lessonId, values),
    onSuccess: invalidate,
  })
}

export function useDeleteLesson(courseId: string) {
  const invalidate = useInvalidateElearning()
  return useMutation({
    mutationFn: (lessonId: string) => deleteLesson(courseId, lessonId),
    onSuccess: invalidate,
  })
}
