import { UserRole } from './database'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  accountManagerName?: string | null
  isActive: boolean
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}
