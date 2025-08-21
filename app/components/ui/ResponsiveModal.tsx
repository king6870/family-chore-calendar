'use client'

import { useEffect, useRef, ReactNode } from 'react'

export interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
  preventClose?: boolean
  hasUnsavedChanges?: boolean
  className?: string
}

/**
 * Responsive modal component with mobile-first design
 * Automatically adjusts size based on screen size and provides accessibility features
 */
export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  preventClose = false,
  hasUnsavedChanges = false,
  className = ''
}: ResponsiveModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      
      // Focus management
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement
        if (firstFocusable) {
          firstFocusable.focus()
        }
      }, 100)
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = () => {
    if (preventClose) return
    
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Size classes for different screen sizes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg', 
    xl: 'max-w-xl'
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className={`
          bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden
          ${sizeClasses[size]}
          sm:max-w-sm md:${sizeClasses[size]}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 
            id="modal-title"
            className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4"
          >
            {title}
          </h2>
          {!preventClose && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  )
}