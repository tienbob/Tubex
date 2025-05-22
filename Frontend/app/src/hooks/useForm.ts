import { useReducer, useCallback } from 'react';

// Generic interface for form values
export interface FormState<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// Generic action types
export type FormAction<T extends Record<string, any>> =
  | { type: 'SET_FIELD_VALUE'; field: keyof T; value: any }
  | { type: 'SET_FIELD_ERROR'; field: keyof T; error: string | null }
  | { type: 'SET_FIELD_TOUCHED'; field: keyof T; touched: boolean }
  | { type: 'SET_MULTIPLE_FIELDS'; values: Partial<T> }
  | { type: 'SET_ERRORS'; errors: Partial<Record<keyof T, string>> }
  | { type: 'RESET_FORM'; values?: T }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'TOUCH_ALL_FIELDS' }
  | { type: 'VALIDATE_FORM' };

// Validation function type
export type FormValidationFunction<T> = (values: T) => Partial<Record<keyof T, string>>;

// Create a form reducer
const createFormReducer = <T extends Record<string, any>>(
  validate?: FormValidationFunction<T>
) => {
  return (state: FormState<T>, action: FormAction<T>): FormState<T> => {
    switch (action.type) {
      case 'SET_FIELD_VALUE': {
        const newValues = {
          ...state.values,
          [action.field]: action.value
        };
        
        // Validate if needed
        let newErrors = state.errors;
        if (validate) {
          newErrors = {
            ...state.errors,
            [action.field]: validate(newValues)[action.field] || ''
          };
        }
        
        return {
          ...state,
          values: newValues,
          errors: newErrors,
          isDirty: true,
          isValid: Object.values(newErrors).every(error => !error)
        };
      }
      
      case 'SET_FIELD_ERROR':
        return {
          ...state,
          errors: {
            ...state.errors,
            [action.field]: action.error || ''
          },
          isValid: !action.error && Object.entries(state.errors)
            .filter(([key]) => key !== action.field)
            .every(([_, value]) => !value)
        };
      
      case 'SET_FIELD_TOUCHED':
        return {
          ...state,
          touched: {
            ...state.touched,
            [action.field]: action.touched
          }
        };
      
      case 'SET_MULTIPLE_FIELDS': {
        const newValues = {
          ...state.values,
          ...action.values
        };
        
        // Validate if needed
        let newErrors = state.errors;
        if (validate) {
          newErrors = validate(newValues);
        }
        
        return {
          ...state,
          values: newValues,
          errors: newErrors,
          isDirty: true,
          isValid: Object.values(newErrors).every(error => !error)
        };
      }
      
      case 'SET_ERRORS':
        return {
          ...state,
          errors: action.errors,
          isValid: Object.values(action.errors).every(error => !error)
        };
      
      case 'RESET_FORM':
        return {
          values: action.values || state.values,
          errors: {},
          touched: {},
          isSubmitting: false,
          isValid: true,
          isDirty: false
        };
      
      case 'SET_SUBMITTING':
        return {
          ...state,
          isSubmitting: action.isSubmitting
        };
      
      case 'TOUCH_ALL_FIELDS': {
        const touchedFields: Partial<Record<keyof T, boolean>> = {};
        
        // Set all fields as touched
        Object.keys(state.values).forEach(key => {
          touchedFields[key as keyof T] = true;
        });
        
        return {
          ...state,
          touched: touchedFields
        };
      }
      
      case 'VALIDATE_FORM': {
        if (!validate) return state;
        
        const errors = validate(state.values);
        
        return {
          ...state,
          errors,
          isValid: Object.values(errors).every(error => !error)
        };
      }
      
      default:
        return state;
    }
  };
};

// Interface for hook options
interface UseFormOptions<T extends Record<string, any>> {
  initialValues: T;
  validate?: FormValidationFunction<T>;
  onSubmit?: (values: T) => Promise<any> | void;
}

// Custom hook for form state management
export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit
}: UseFormOptions<T>) {
  // Create initial state
  const initialState: FormState<T> = {
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false
  };

  // Create reducer
  const [state, dispatch] = useReducer(
    createFormReducer<T>(validate),
    initialState
  );

  // Handle field change
  const handleChange = useCallback((field: keyof T, value: any) => {
    dispatch({ type: 'SET_FIELD_VALUE', field, value });
  }, []);

  // Handle blur (field touched)
  const handleBlur = useCallback((field: keyof T) => {
    dispatch({ type: 'SET_FIELD_TOUCHED', field, touched: true });
    
    // Validate field on blur
    if (validate) {
      const fieldError = validate(state.values)[field];
      if (fieldError) {
        dispatch({ type: 'SET_FIELD_ERROR', field, error: fieldError });
      }
    }
  }, [state.values, validate]);

  // Set multiple fields at once
  const setValues = useCallback((values: Partial<T>) => {
    dispatch({ type: 'SET_MULTIPLE_FIELDS', values });
  }, []);

  // Set errors manually
  const setErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    dispatch({ type: 'SET_ERRORS', errors });
  }, []);

  // Reset form
  const resetForm = useCallback((newValues?: T) => {
    dispatch({ type: 'RESET_FORM', values: newValues });
  }, []);

  // Validate whole form
  const validateForm = useCallback(() => {
    dispatch({ type: 'VALIDATE_FORM' });
    return state.isValid;
  }, [state.isValid]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Touch all fields to show validation errors
      dispatch({ type: 'TOUCH_ALL_FIELDS' });
      
      // Validate form
      dispatch({ type: 'VALIDATE_FORM' });
      
      // If form is valid, submit
      if (state.isValid && onSubmit) {
        dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
        
        try {
          await onSubmit(state.values);
        } catch (error) {
          console.error('Form submission error:', error);
          
          // If error has validation errors format, set them
          if (typeof error === 'object' && error !== null && 'validationErrors' in error) {
            const validationErrors = (error as any).validationErrors;
            if (validationErrors && typeof validationErrors === 'object') {
              setErrors(validationErrors as Partial<Record<keyof T, string>>);
            }
          }
        } finally {
          dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        }
      }
    },
    [state.isValid, state.values, onSubmit, setErrors]
  );

  // Create getter helpers for field props
  const getFieldProps = useCallback(
    (field: keyof T) => ({
      name: field,
      value: state.values[field],
      onChange: (e: React.ChangeEvent<any>) => handleChange(field, e.target.value),
      onBlur: () => handleBlur(field),
      error: !!state.touched[field] && !!state.errors[field],
      helperText: state.touched[field] ? state.errors[field] : undefined
    }),
    [state.values, state.errors, state.touched, handleChange, handleBlur]
  );

  return {
    // State
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    isDirty: state.isDirty,
    
    // Actions
    handleChange,
    handleBlur,
    setValues,
    setErrors,
    resetForm,
    validateForm,
    handleSubmit,
    
    // Helper
    getFieldProps
  };
}

export default useForm;
