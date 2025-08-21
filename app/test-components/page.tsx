'use client'

import { useState } from 'react'
import { 
  ResponsiveModal, 
  MessageProvider, 
  useSuccessMessage, 
  useErrorMessage,
  LoadingButton,
  SkeletonLoader,
  ChoreCardSkeleton,
  UserCardSkeleton,
  ProgressBar,
  useLoadingState,
  useFormValidation
} from '../components/ui'

function TestComponentsContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showSkeletons, setShowSkeletons] = useState(false)
  const { isLoading, executeAsync } = useLoadingState()
  const showSuccess = useSuccessMessage()
  const showError = useErrorMessage()

  // Form validation example
  const {
    values,
    errors,
    touched,
    isValid,
    setValue,
    validateField,
    validateAll
  } = useFormValidation(
    { name: '', email: '' },
    {
      name: {
        required: true,
        minLength: 2
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }
    }
  )

  const handleTestAsync = async () => {
    try {
      await executeAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        if (Math.random() > 0.5) {
          throw new Error('Random test error')
        }
      })
      showSuccess('Operation completed successfully!', 'Success')
    } catch (error) {
      showError('Something went wrong. Please try again.', 'Error')
    }
  }

  const handleFormSubmit = async () => {
    const isFormValid = await validateAll()
    if (isFormValid) {
      showSuccess('Form is valid and ready to submit!', 'Validation Success')
    } else {
      showError('Please fix the form errors', 'Validation Error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Foundation UI Components Test</h1>
        
        {/* Modal Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">ResponsiveModal Test</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Open Modal
          </button>
        </div>

        {/* Loading States Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Loading States Test</h2>
          <div className="space-y-4">
            <LoadingButton
              onClick={handleTestAsync}
              isLoading={isLoading}
              loadingText="Processing..."
              variant="primary"
            >
              Test Async Operation
            </LoadingButton>
            
            <ProgressBar progress={65} label="Sample Progress" />
          </div>
        </div>

        {/* Form Validation Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Form Validation Test</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={values.name}
                onChange={(e) => setValue('name', e.target.value)}
                onBlur={() => validateField('name')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name && touched.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your name"
              />
              {errors.name && touched.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={values.email}
                onChange={(e) => setValue('email', e.target.value)}
                onBlur={() => validateField('email')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email && touched.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleFormSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Validate Form
              </button>
              <span className={`text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                Form is {isValid ? 'valid' : 'invalid'}
              </span>
            </div>
          </div>
        </div>

        {/* Skeleton Loaders Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Skeleton Loaders Test</h2>
          <div className="space-y-4">
            <button
              onClick={() => setShowSkeletons(!showSkeletons)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              {showSkeletons ? 'Hide' : 'Show'} Skeletons
            </button>
            
            {showSkeletons && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Generic Skeletons</h3>
                  <SkeletonLoader width="60%" height="1.5rem" className="mb-2" />
                  <SkeletonLoader width="80%" height="1rem" className="mb-2" />
                  <SkeletonLoader width="40%" height="2rem" variant="circular" />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Pre-built Patterns</h3>
                  <ChoreCardSkeleton />
                  <UserCardSkeleton />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Message System Test</h2>
          <div className="space-x-4">
            <button
              onClick={() => showSuccess('This is a success message!', 'Success')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Show Success
            </button>
            <button
              onClick={() => showError('This is an error message!', 'Error')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Show Error
            </button>
          </div>
        </div>

        {/* Modal */}
        <ResponsiveModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Test Modal"
          size="md"
        >
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              This is a test modal demonstrating the ResponsiveModal component. 
              It includes proper focus management, keyboard navigation, and responsive design.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showSuccess('Modal action completed!', 'Success')
                  setIsModalOpen(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </ResponsiveModal>
      </div>
    </div>
  )
}

export default function TestComponentsPage() {
  return (
    <MessageProvider maxMessages={5} position="top-right">
      <TestComponentsContent />
    </MessageProvider>
  )
}