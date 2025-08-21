'use client'

import { useState } from 'react'
import ResponsiveModal from './ResponsiveModal'
import { LoadingButton, ProgressBar } from './LoadingButton'
import { useLoadingState } from '../../../lib/hooks/useLoadingState'
import { useFormValidation } from '../../../lib/hooks/useFormValidation'
import { useSuccessMessage, useErrorMessage } from './MessageProvider'

/**
 * Example component demonstrating the usage of foundation UI components
 * This shows how to integrate ResponsiveModal, form validation, loading states, and messages
 */
export function ExampleUsage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { isLoading, executeAsync } = useLoadingState()
    const showSuccess = useSuccessMessage()
    const showError = useErrorMessage()

    // Form validation example
    const {
        values,
        errors,
        touched,
        isValid,
        hasUnsavedChanges,
        setValue,
        validateField,
        validateAll,
        reset
    } = useFormValidation(
        { name: '', email: '', age: '' },
        {
            name: {
                required: true,
                minLength: 2,
                maxLength: 50
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                custom: (value: string) => {
                    if (value && !value.includes('@')) {
                        return 'Please enter a valid email address'
                    }
                    return null
                }
            },
            age: {
                required: true,
                custom: (value: string) => {
                    const num = parseInt(value)
                    if (isNaN(num) || num < 1 || num > 120) {
                        return 'Age must be between 1 and 120'
                    }
                    return null
                }
            }
        }
    )

    const handleSubmit = async () => {
        const isFormValid = await validateAll()
        if (!isFormValid) {
            showError('Please fix the form errors before submitting')
            return
        }

        try {
            await executeAsync(async () => {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 2000))

                // Simulate random success/failure
                if (Math.random() > 0.3) {
                    throw new Error('Simulated server error')
                }
            })

            showSuccess('Form submitted successfully!', 'Success', [
                {
                    label: 'View Details',
                    action: () => console.log('View details clicked'),
                    variant: 'primary'
                }
            ])

            reset()
            setIsModalOpen(false)
        } catch (error) {
            showError(
                'Failed to submit form. Please try again.',
                'Submission Error',
                [
                    {
                        label: 'Retry',
                        action: handleSubmit,
                        variant: 'primary'
                    }
                ]
            )
        }
    }

    const handleClose = () => {
        if (hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Are you sure you want to close?')) {
                reset()
                setIsModalOpen(false)
            }
        } else {
            setIsModalOpen(false)
        }
    }

    return (
        <div className="p-4">
            <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Open Example Modal
            </button>

            <ResponsiveModal
                isOpen={isModalOpen}
                onClose={handleClose}
                title="Example Form with Validation"
                size="md"
                hasUnsavedChanges={hasUnsavedChanges}
            >
                <div className="p-6 space-y-4">
                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name *
                        </label>
                        <input
                            type="text"
                            value={values.name}
                            onChange={(e) => setValue('name', e.target.value)}
                            onBlur={() => validateField('name')}
                            className={`
                w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.name && touched.name ? 'border-red-300' : 'border-gray-300'}
              `}
                            placeholder="Enter your name"
                        />
                        {errors.name && touched.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={values.email}
                            onChange={(e) => setValue('email', e.target.value)}
                            onBlur={() => validateField('email')}
                            className={`
                w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.email && touched.email ? 'border-red-300' : 'border-gray-300'}
              `}
                            placeholder="Enter your email"
                        />
                        {errors.email && touched.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>

                    {/* Age Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Age *
                        </label>
                        <input
                            type="number"
                            value={values.age}
                            onChange={(e) => setValue('age', e.target.value)}
                            onBlur={() => validateField('age')}
                            className={`
                w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.age && touched.age ? 'border-red-300' : 'border-gray-300'}
              `}
                            placeholder="Enter your age"
                            min="1"
                            max="120"
                        />
                        {errors.age && touched.age && (
                            <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                        )}
                    </div>

                    {/* Progress Bar Example */}
                    {isLoading && (
                        <div className="mt-4">
                            <ProgressBar
                                progress={66}
                                label="Processing form..."
                                variant="primary"
                            />
                        </div>
                    )}

                    {/* Form Status */}
                    <div className="text-sm text-gray-600">
                        <p>Form valid: {isValid ? '✅' : '❌'}</p>
                        <p>Has changes: {hasUnsavedChanges ? '✅' : '❌'}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <LoadingButton
                            onClick={handleSubmit}
                            isLoading={isLoading}
                            loadingText="Submitting..."
                            disabled={!isValid}
                            variant="primary"
                        >
                            Submit Form
                        </LoadingButton>
                    </div>
                </div>
            </ResponsiveModal>
        </div>
    )
}