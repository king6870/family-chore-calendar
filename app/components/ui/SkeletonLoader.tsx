'use client'

export interface SkeletonLoaderProps {
  className?: string
  width?: string | number
  height?: string | number
  variant?: 'text' | 'rectangular' | 'circular'
  animation?: 'pulse' | 'wave' | 'none'
}

/**
 * Skeleton loader component for showing loading placeholders
 * Matches content layout for better perceived performance
 */
export function SkeletonLoader({
  className = '',
  width = '100%',
  height = '1rem',
  variant = 'rectangular',
  animation = 'pulse'
}: SkeletonLoaderProps) {
  const baseClasses = 'bg-gray-200'
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full'
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Could be enhanced with custom wave animation
    none: ''
  }

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  )
}

/**
 * Pre-built skeleton patterns for common layouts
 */
export function ChoreCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonLoader width="60%" height="1.25rem" />
        <SkeletonLoader width="3rem" height="1.5rem" variant="rectangular" />
      </div>
      <SkeletonLoader width="80%" height="0.875rem" />
      <div className="flex items-center justify-between">
        <SkeletonLoader width="4rem" height="1rem" />
        <SkeletonLoader width="2rem" height="2rem" variant="circular" />
      </div>
    </div>
  )
}

export function UserCardSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-3">
      <SkeletonLoader width="2.5rem" height="2.5rem" variant="circular" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader width="40%" height="1rem" />
        <SkeletonLoader width="60%" height="0.875rem" />
      </div>
      <SkeletonLoader width="3rem" height="1.5rem" />
    </div>
  )
}

export function CalendarDaySkeleton() {
  return (
    <div className="p-2 space-y-2">
      <SkeletonLoader width="2rem" height="1.25rem" />
      <div className="space-y-1">
        <SkeletonLoader width="100%" height="2rem" />
        <SkeletonLoader width="80%" height="2rem" />
        <SkeletonLoader width="60%" height="2rem" />
      </div>
    </div>
  )
}