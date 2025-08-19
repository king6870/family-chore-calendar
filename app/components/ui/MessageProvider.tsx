'use client'

import { createContext, useContext, ReactNode, useRef, useEffect } from 'react'
import { MessageQueue, MessageProps, useMessageQueue } from './EnhancedMessage'

const MessageContext = createContext<{
  addMessage: (message: Omit<MessageProps, 'id' | 'onDismiss'>) => string
  removeMessage: (id: string) => void
  clearAll: () => void
} | null>(null)

export interface MessageProviderProps {
  children: ReactNode
  maxMessages?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'
}

/**
 * Provider component that manages global message queue
 * Should be placed at the root of the application
 */
export function MessageProvider({ 
  children, 
  maxMessages = 5, 
  position = 'top-right' 
}: MessageProviderProps) {
  const { addMessage, removeMessage, clearAll, setMessageQueue } = useMessageQueue()

  const handleMethodsReady = (methods: any) => {
    setMessageQueue(methods)
  }

  return (
    <MessageContext.Provider value={{ addMessage, removeMessage, clearAll }}>
      {children}
      <MessageQueue 
        maxMessages={maxMessages} 
        position={position}
        onMethodsReady={handleMethodsReady}
      />
    </MessageContext.Provider>
  )
}

/**
 * Hook to access the global message queue
 * Must be used within a MessageProvider
 */
export function useMessages() {
  const context = useContext(MessageContext)
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider')
  }
  return context
}

/**
 * Convenience hooks for different message types
 */
export function useSuccessMessage() {
  const { addMessage } = useMessages()
  return (message: string, title?: string, actions?: any[]) => 
    addMessage({ type: 'success', message, title, actions })
}

export function useErrorMessage() {
  const { addMessage } = useMessages()
  return (message: string, title?: string, actions?: any[]) => 
    addMessage({ type: 'error', message, title, actions, duration: 10000 })
}

export function useWarningMessage() {
  const { addMessage } = useMessages()
  return (message: string, title?: string, actions?: any[]) => 
    addMessage({ type: 'warning', message, title, actions })
}

export function useInfoMessage() {
  const { addMessage } = useMessages()
  return (message: string, title?: string, actions?: any[]) => 
    addMessage({ type: 'info', message, title, actions })
}