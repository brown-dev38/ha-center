import { create } from 'zustand'
import type { AdminUser } from '@/app/users/users-admin-api'

type UsersAdminDialogState = {
  createOpen: boolean
  editUser: AdminUser | null
  openCreate: () => void
  openEdit: (user: AdminUser) => void
  close: () => void
}

export const useUsersAdminDialogStore = create<UsersAdminDialogState>((set) => ({
  createOpen: false,
  editUser: null,
  openCreate: () => set({ createOpen: true, editUser: null }),
  openEdit: (user) => set({ createOpen: false, editUser: user }),
  close: () => set({ createOpen: false, editUser: null }),
}))
