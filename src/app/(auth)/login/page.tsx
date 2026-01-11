'use client'

/**
 * Login Page
 * Handles user authentication via Supabase
 *
 * Features:
 * - Split-screen layout with branding and form
 * - Email/password form validation
 * - Error handling and display
 * - Loading states
 * - Redirect after successful login
 * - Responsive design (mobile/desktop)
 */

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBrowserClient } from '@/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const supabase = createBrowserClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Check for auth errors and success messages from URL
  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    if (error) {
      setAuthError(decodeURIComponent(error))
    }

    if (message) {
      setSuccessMessage(decodeURIComponent(message))
    }
  }, [searchParams])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setAuthError(error.message)
        return
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setAuthError('An unexpected error occurred. Please try again.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-sidebar flex-col items-center justify-center p-12">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logo.avif"
            alt="Valour Holdings"
            width={120}
            height={120}
            className="mx-auto"
            priority
          />
        </div>

        {/* Company Name */}
        <h1 className="text-4xl font-bold text-sidebar-foreground mb-3">
          Valour Holdings
        </h1>

        {/* Tagline */}
        <p className="text-sidebar-foreground/70 text-center text-lg">
          Solar Lead Management Dashboard
        </p>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo (hidden on desktop) */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.avif"
                alt="Valour Holdings"
                width={80}
                height={80}
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Valour Holdings
            </h1>
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-card-foreground mb-2">
                Sign in to your account
              </h2>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to access the dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  {...register('email')}
                  className="bg-input border-input"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-card-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...register('password')}
                  className="bg-input border-input"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Success Message Display */}
              {successMessage && (
                <div className="flex items-start gap-2 p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Error Display */}
              {authError && (
                <div className="flex items-start gap-2 p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Need help? Contact your administrator for access or password reset.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
