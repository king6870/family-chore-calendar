'use client'

import { useState, useEffect, useRef } from 'react'

export interface MessageAction {
  label: string
  action: () => void
  variant?: 'primary' | 'secondary'
}

export interface MessageProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  actions?: MessageAction[]
  duration?: number
  dismissible?: boolean
  onDismiss?: () => void
}

/**
 * Individual message component with auto-dismiss and action support
 */
function Message({ 
  id, 
  type, 
  title, 
  message, 
  actions = [], 
  duration = 7000, 
  dismissible = true, 
  onDismiss 
}: MessageProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const startTimeRef = useRef<number>()
  const remainingTimeRef = useRef<number>(duration)

  useEffect(() => {
    if (duration > 0 && !isPaused) {
      startTimeRef.current = Date.now()
      timeoutRef.current = setTimeout(() => {
        handleDismiss()
      }, remainingTimeRef.current)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [duration, isPaused])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      onDismiss?.()
    }, 300) // Allow fade out animation
  }

  const handleMouseEnter = () => {
    if (duration > 0) {
      setIsPaused(true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        // Calculate remaining time
        const elapsed = Date.now() - (startTimeRef.current || 0)
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed)
      }
    }
  }

  const handleMouseLeave = () => {
    if (duration > 0) {
      setIsPaused(false)
    }
  }

  // Style configurations for different message types
  const typeStyles = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: '✅',
      iconBg: 'bg-green-100'
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: '❌',
      iconBg: 'bg-red-100'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: '⚠️',
      iconBg: 'bg-yellow-100'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'ℹ️',
      iconBg: 'bg-blue-100'
    }
  }

  const styles = typeStyles[type]

  return (
    <div
      className={`
        ${styles.container} border rounded-lg p-4 shadow-sm transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start">
        {/* Icon */}
        <div className={`${styles.iconBg} rounded-full p-1 mr-3 flex-shrink-0`}>
          <span className="text-sm">{styles.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-medium mb-1">{title}</h4>
          )}
          <p className="text-sm">{message}</p>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`
                    px-3 py-1 text-xs font-medium rounded-md transition-colors
                    ${action.variant === 'primary' 
                      ? 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-300' 
                      : 'text-current hover:bg-black hover:bg-opacity-10'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-2 text-current hover:bg-black hover:bg-opacity-10 rounded-full p-1 flex-shrink-0"
            aria-label="Dismiss message"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        )}
      </div>

      {/* Progress bar for auto-dismiss */}
      {duration > 0 && (
        <div className="mt-2 h-1 bg-black bg-opacity-10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-current transition-all ease-linear"
            style={{
              width: isPaused ? `${((duration - remainingTimeRef.current) / duration) * 100}%` : '0%',
              transitionDuration: isPaused ? '0ms' : `${remainingTimeRef.current}ms`
            }}
          />
        </div>
      )}
    </div>
  )
}

export interface MessageQueueContextType {
  addMessage: (message: Omit<MessageProps, 'id' | 'onDismiss'>) => string
  removeMessage: (id: string) => void
  clearAll: () => void
}

/**
 * Message queue container that manages multiple messages
 */
export interface MessageQueueProps {
  maxMessages?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'
  onMethodsReady?: (methods: MessageQueueContextType) => void
}

export function MessageQueue({ 
  maxMessages = 5, 
  position = 'top-right',
  onMethodsReady
}: MessageQueueProps) {
  const [messages, setMessages] = useState<MessageProps[]>([])

  const addMessage = (messageData: Omit<MessageProps, 'id' | 'onDismiss'>): string => {
    const id = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newMessage: MessageProps = {
      ...messageData,
      id,
      onDismiss: () => removeMessage(id)
    }

    setMessages(prev => {
      const updated = [newMessage, ...prev]
      // Remove oldest messages if exceeding max
      return updated.slice(0, maxMessages)
    })

    return id
  }

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id))
  }

  const clearAll = () => {
    setMessages([])
  }

  // Expose methods to parent
  useEffect(() => {
    if (onMethodsReady) {
      onMethodsReady({ addMessage, removeMessage, clearAll })
    }
  }, [onMethodsReady])

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
  }

  if (messages.length === 0) return null

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 w-full max-w-sm space-y-2`}
      aria-live="polite"
      aria-label="Notifications"
    >
      {messages.map(message => (
        <Message key={message.id} {...message} />
      ))}
    </div>
  )
}

// Hook for using the message queue
export function useMessageQueue() {
  const [messageQueue, setMessageQueue] = useState<{
    addMessage: (message: Omit<MessageProps, 'id' | 'onDismiss'>) => string
    removeMessage: (id: string) => void
    clearAll: () => void
  } | null>(null)

  const addMessage = (message: Omit<MessageProps, 'id' | 'onDismiss'>) => {
    return messageQueue?.addMessage(message) || ''
  }

  const removeMessage = (id: string) => {
    messageQueue?.removeMessage(id)
  }

  const clearAll = () => {
    messageQueue?.clearAll()
  }

  return {
    addMessage,
    removeMessage,
    clearAll,
    setMessageQueue
  }
}