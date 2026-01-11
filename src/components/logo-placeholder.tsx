/**
 * Logo Placeholder Component
 * Temporary logo with "VH" monogram until actual company logo is uploaded
 * Easy to replace by updating the login page to use the real logo image
 */

import { cn } from '@/lib/utils/cn'

interface LogoPlaceholderProps {
  size?: number
  className?: string
}

export function LogoPlaceholder({
  size = 120,
  className
}: LogoPlaceholderProps) {
  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Outer circle */}
      <div
        className="absolute inset-0 border-4 border-primary rounded-full"
        style={{ borderWidth: size > 100 ? 4 : 3 }}
      />

      {/* VH Monogram */}
      <span
        className="font-bold text-sidebar-foreground"
        style={{ fontSize: size * 0.4 }}
      >
        VH
      </span>
    </div>
  )
}
