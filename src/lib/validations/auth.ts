/**
 * Authentication Validation Schemas
 * Using Zod for type-safe form validation
 */

import { z } from 'zod'

/**
 * Password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Create user schema (Admin only)
 */
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['admin', 'account_manager', 'field_rep']),
  accountManagerName: z.string().optional(),
})

export type CreateUserFormData = z.infer<typeof createUserSchema>

/**
 * Password reset request schema
 */
export const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type ResetPasswordRequestFormData = z.infer<typeof resetPasswordRequestSchema>

/**
 * New password schema (for password reset)
 */
export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type NewPasswordFormData = z.infer<typeof newPasswordSchema>
