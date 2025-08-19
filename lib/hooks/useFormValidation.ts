'use client'

import { useState, useCallback, useMemo } from 'react'

export interface ValidationRule<T> {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: T) => string | null
  asyncValidator?: (value: T) => Promise<string | null>
}

export interface UseFormValidation<T extends Record<string, any>> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isValid: boolean
  hasUnsavedChanges: boolean
  setValue: (field: keyof T, value: any) => void
  setError: (field: keyof T, error: string | null) => void
  validateField: (field: keyof T) => Promise<boolean>
  validateAll: () => Promise<boolean>
  reset: (newValues?: Partial<T>) => void
  markFieldTouched: (field: keyof T) => void
}

/**
 * Custom hook for form validation with real-time feedback
 * Supports synchronous and asynchronous validation rules
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule<any>>> = {}
): UseFormValidation<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [initialState] = useState<T>(initialValues)

  // Check if form has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return Object.keys(values).some(key => 
      values[key] !== initialState[key]
    )
  }, [values, initialState])

  // Check if form is valid (no errors and all required fields filled)
  const isValid = useMemo(() => {
    const hasErrors = Object.values(errors).some(error => error !== null && error !== '')
    const requiredFieldsValid = Object.entries(validationRules).every(([field, rule]) => {
      if (rule?.required) {
        const value = values[field as keyof T]
        return value !== null && value !== undefined && value !== ''
      }
      return true
    })
    return !hasErrors && requiredFieldsValid
  }, [errors, values, validationRules])

  const validateValue = useCallback(async (field: keyof T, value: any): Promise<string | null> => {
    const rule = validationRules[field]
    if (!rule) return null

    // Required validation
    if (rule.required && (value === null || value === undefined || value === '')) {
      return 'This field is required'
    }

    // Skip other validations if field is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return null
    }

    // String length validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `Must be at least ${rule.minLength} characters`
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Must be no more than ${rule.maxLength} characters`
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return 'Invalid format'
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value)
      if (customError) return customError
    }

    // Async validation
    if (rule.asyncValidator) {
      try {
        const asyncError = await rule.asyncValidator(value)
        if (asyncError) return asyncError
      } catch (error) {
        return 'Validation failed'
      }
    }

    return null
  }, [validationRules])

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing in a field that had an error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }, [errors])

  const setError = useCallback((field: keyof T, error: string | null) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const markFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const validateField = useCallback(async (field: keyof T): Promise<boolean> => {
    markFieldTouched(field)
    const error = await validateValue(field, values[field])
    setError(field, error)
    return error === null
  }, [validateValue, values, markFieldTouched, setError])

  const validateAll = useCallback(async (): Promise<boolean> => {
    const fields = Object.keys(validationRules) as (keyof T)[]
    const validationPromises = fields.map(async field => {
      const error = await validateValue(field, values[field])
      setError(field, error)
      markFieldTouched(field)
      return error === null
    })

    const results = await Promise.all(validationPromises)
    return results.every(result => result)
  }, [validationRules, validateValue, values, setError, markFieldTouched])

  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = newValues ? { ...initialValues, ...newValues } : initialValues
    setValues(resetValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isValid,
    hasUnsavedChanges,
    setValue,
    setError,
    validateField,
    validateAll,
    reset,
    markFieldTouched
  }
}