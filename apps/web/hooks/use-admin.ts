'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCategory,
  createDepartment,
  createQualityLevel,
  createQualityUnit,
  deleteCategory,
  deleteDepartment,
  deleteQualityLevel,
  deleteQualityUnit,
  fetchAdminRoles,
  fetchAdminCategories,
  fetchAdminDepartmentsFull,
  fetchAdminQualityLevels,
  fetchAdminQualityUnits,
  fetchAdminOverview,
  fetchMenuConfig,
  fetchSettings,
  saveMenuConfig,
  saveSettings,
  updateCategory,
  updateDepartment,
  updateQualityLevel,
  updateQualityUnit,
  type MenuOverride,
} from '@/app/admin/admin-api'

export function useAdminOverview() {
  return useQuery({ queryKey: ['admin', 'overview'], queryFn: fetchAdminOverview })
}

export function useAdminSettings() {
  return useQuery({ queryKey: ['admin', 'settings'], queryFn: fetchSettings })
}

export function useSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
      qc.invalidateQueries({ queryKey: ['app-config'] })
    },
  })
}

export function useMenuConfig() {
  return useQuery({ queryKey: ['admin', 'menu'], queryFn: fetchMenuConfig })
}

export function useSaveMenuConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<MenuOverride>) => saveMenuConfig(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'menu'] })
      qc.invalidateQueries({ queryKey: ['app-config'] })
    },
  })
}

export function useAdminDepartments() {
  return useQuery({ queryKey: ['admin', 'departments'], queryFn: fetchAdminDepartmentsFull })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'departments'] }),
  })
}

export function useUpdateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; code?: string; name?: string; nameEn?: string | null; isActive?: boolean }) =>
      updateDepartment(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'departments'] }),
  })
}

export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'departments'] }),
  })
}

export function useAdminCategories() {
  return useQuery({ queryKey: ['admin', 'categories'], queryFn: fetchAdminCategories })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; code?: string; name?: string; description?: string | null; sortOrder?: number; isActive?: boolean }) =>
      updateCategory(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  })
}

export function useAdminQualityLevels() {
  return useQuery({ queryKey: ['admin', 'quality-levels'], queryFn: fetchAdminQualityLevels })
}

export function useCreateQualityLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createQualityLevel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'quality-levels'] })
      qc.invalidateQueries({ queryKey: ['quality-document-levels'] })
    },
  })
}

export function useUpdateQualityLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; order?: number; code?: string; name?: string }) =>
      updateQualityLevel(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'quality-levels'] })
      qc.invalidateQueries({ queryKey: ['quality-document-levels'] })
    },
  })
}

export function useDeleteQualityLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteQualityLevel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'quality-levels'] })
      qc.invalidateQueries({ queryKey: ['quality-document-levels'] })
    },
  })
}

export function useAdminQualityUnits() {
  return useQuery({ queryKey: ['admin', 'quality-units'], queryFn: fetchAdminQualityUnits })
}

export function useCreateQualityUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createQualityUnit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'quality-units'] })
      qc.invalidateQueries({ queryKey: ['documents', 'departments'] })
    },
  })
}

export function useUpdateQualityUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string
      order?: number
      code?: string
      name?: string
      group?: string
    }) => updateQualityUnit(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'quality-units'] })
      qc.invalidateQueries({ queryKey: ['documents', 'departments'] })
    },
  })
}

export function useDeleteQualityUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteQualityUnit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'quality-units'] })
      qc.invalidateQueries({ queryKey: ['documents', 'departments'] })
    },
  })
}

export function useAdminRolesList() {
  return useQuery({ queryKey: ['admin', 'roles'], queryFn: fetchAdminRoles })
}
