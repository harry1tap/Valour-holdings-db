'use client'

/**
 * Set Password Page
 * Allows invited users to set their password before first login
 *
 * Features:
 * - Displays user's email and name
 * - Password form with validation
 * - Strong password requirements
 * - Auto-logout after password is set
 * - Redirects to login with success message
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBrowserClient } from '@/lib/supabase/client'
import { newPasswordSchema } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export default function SetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createBrowserClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(newPasswordSchema),
  })

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login?error=Session expired')
        return
      }

      setUserEmail(user.email || '')
      setUserName(user.user_metadata?.full_name || '')
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    setError(null)

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Success - show message and sign out
      setSuccess(true)

      // Wait 2 seconds, then sign out and redirect
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login?message=Password set successfully. Please login with your new password.')
      }, 2000)

    } catch (err) {
      setError('Failed to set password. Please try again.')
      console.error('Set password error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-semibold text-foreground">Password Set Successfully!</h2>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
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

      {/* RIGHT SIDE - Password Setup Form */}
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
                Set Your Password
              </h2>
              <p className="text-muted-foreground text-sm">
                Welcome {userName}! Please set a password for your account.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Account: <span className="font-medium text-foreground">{userEmail}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-card-foreground">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  {...register('password')}
                  className="bg-input border-input"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-card-foreground">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                  {...register('confirmPassword')}
                  className="bg-input border-input"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
                <p className="font-medium mb-1">Password must contain:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character</li>
                </ul>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting password...
                  </>
                ) : (
                  'Set Password'
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                After setting your password, you'll be logged out and can sign in with your new credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
