'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAdminUser,
  fetchAdminDepartments,
  fetchAdminRoles,
  fetchAdminUser,
  fetchAdminUsers,
  updateAdminUser,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/app/users/users-admin-api'
import { useSession } from 'next-auth/react'

export function useAdminUsers(filters: {
  departmentId?: string
  roleId?: string
  search?: string
  isActive?: boolean
}) {
  const { status } = useSession()
  return useQuery({
    queryKey: ['admin', 'users', status, filters],
    queryFn: () => fetchAdminUsers(filters),
    enabled: status === 'authenticated',
  })
}

export function useAdminUser(id: string | null, enabled: boolean) {
  const { status } = useSession()
  return useQuery({
    queryKey: ['admin', 'users', id, status],
    queryFn: () => fetchAdminUser(id!),
    enabled: status === 'authenticated' && enabled && !!id,
  })
}

export function useAdminRoles() {
  const { status } = useSession()
  return useQuery({
    queryKey: ['admin', 'roles', status],
    queryFn: fetchAdminRoles,
    enabled: status === 'authenticated',
  })
}

export function useAdminDepartments() {
  const { status } = useSession()
  return useQuery({
    queryKey: ['admin', 'departments', status],
    queryFn: fetchAdminDepartments,
    enabled: status === 'authenticated',
  })
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => createAdminUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      updateAdminUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
