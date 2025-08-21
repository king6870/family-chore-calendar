# Foundation UI Components

This directory contains the foundation UI components and hooks created for the UI/UX improvements project. These components provide consistent, reusable functionality across the application.

## Components

### ResponsiveModal
A mobile-first modal component that automatically adjusts to screen size.

```tsx
import { ResponsiveModal } from './ui'

<ResponsiveModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="My Modal"
  size="md"
  hasUnsavedChanges={hasChanges}
>
  <div className="p-6">Modal content here</div>
</ResponsiveModal>
```

**Features:**
- Mobile-first responsive design
- Keyboard navigation (Escape to close)
- Focus management
- Unsaved changes warning
- Backdrop click to close

### EnhancedMessage & MessageProvider
Message queue system with auto-dismiss and action buttons.

```tsx
// Wrap your app with MessageProvider
import { MessageProvider } from './ui'

<MessageProvider maxMessages={5} position="top-right">
  <App />
</MessageProvider>

// Use messages in components
import { useSuccessMessage, useErrorMessage } from './ui'

const showSuccess = useSuccessMessage()
const showError = useErrorMessage()

showSuccess('Operation completed!', 'Success', [
  { label: 'View Details', action: () => {}, variant: 'primary' }
])
```

**Features:**
- Auto-dismiss with configurable timing
- Pause on hover
- Action buttons for retry/next steps
- Queue management (max messages)
- Different message types (success, error, warning, info)

### SkeletonLoader
Loading placeholder components that match content layout.

```tsx
import { SkeletonLoader, ChoreCardSkeleton } from './ui'

// Generic skeleton
<SkeletonLoader width="60%" height="1.25rem" variant="text" />

// Pre-built patterns
<ChoreCardSkeleton />
<UserCardSkeleton />
<CalendarDaySkeleton />
```

### LoadingButton & LoadingSpinner
Button with built-in loading states and standalone spinner.

```tsx
import { LoadingButton, LoadingSpinner, ProgressBar } from './ui'

<LoadingButton
  isLoading={isSubmitting}
  loadingText="Saving..."
  onClick={handleSubmit}
  variant="primary"
>
  Save Changes
</LoadingButton>

<ProgressBar progress={75} label="Processing..." />
```

## Hooks

### useLoadingState
Manages loading states and async operations.

```tsx
import { useLoadingState } from './ui'

const { isLoading, error, executeAsync } = useLoadingState()

const handleSubmit = async () => {
  try {
    await executeAsync(async () => {
      // Your async operation
      await api.submitForm(data)
    })
  } catch (error) {
    // Error is automatically set in the hook
    console.log('Error:', error)
  }
}
```

### useFormValidation
Real-time form validation with custom rules.

```tsx
import { useFormValidation } from './ui'

const {
  values,
  errors,
  touched,
  isValid,
  hasUnsavedChanges,
  setValue,
  validateField,
  validateAll
} = useFormValidation(
  { email: '', name: '' },
  {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    name: {
      required: true,
      minLength: 2,
      custom: (value) => value.includes('admin') ? 'Invalid name' : null
    }
  }
)
```

## Requirements Addressed

This implementation addresses the following requirements from the spec:

- **Requirement 2.1 & 2.2**: ResponsiveModal provides mobile-optimized modal design
- **Requirement 3.1 & 3.2**: EnhancedMessage provides persistent feedback with dismiss buttons
- **Requirement 4.1 & 4.2**: Loading components provide comprehensive loading states
- **Requirement 5.1 & 5.2**: Form validation hook provides real-time validation feedback

## Usage Examples

See `ExampleUsage.tsx` for a complete example showing how to integrate all components together.

## Next Steps

These foundation components are ready to be used in:
1. RecurringChoreManager enhancement (Task 2)
2. Mobile optimization across existing components (Task 6)
3. Form validation implementation (Task 10)
4. Loading state additions (Task 12)