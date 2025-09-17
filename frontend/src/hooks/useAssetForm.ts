/**
 * useAssetForm Hook
 * Custom hook for managing asset form state and validation
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  AssetFormData, 
  AssetFormErrors, 
  AssetType, 
  AssetValidationRules,
} from '../types/asset.types';

export interface UseAssetFormOptions {
  initialData?: Partial<AssetFormData>;
  mode?: 'create' | 'edit';
  onSubmit?: (data: AssetFormData) => Promise<void>;
}

export interface UseAssetFormReturn {
  // Form data
  data: AssetFormData;
  errors: AssetFormErrors;
  
  // State
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  
  // Actions
  setField: (field: keyof AssetFormData, value: any) => void;
  setFields: (fields: Partial<AssetFormData>) => void;
  validateField: (field: keyof AssetFormData) => boolean;
  validateForm: () => boolean;
  reset: () => void;
  submit: () => Promise<void>;
  
  // Error handling
  setError: (field: keyof AssetFormErrors, message: string) => void;
  clearError: (field: keyof AssetFormErrors) => void;
  clearAllErrors: () => void;
}

const initialFormData: AssetFormData = {
  name: '',
  symbol: '',
  type: AssetType.STOCK,
  description: '',
  initialValue: 0,
  initialQuantity: 0,
  currentValue: undefined,
  currentQuantity: undefined,
};

export const useAssetForm = (options: UseAssetFormOptions = {}): UseAssetFormReturn => {
  const { initialData = {}, onSubmit } = options;

  // State
  const [data, setData] = useState<AssetFormData>({
    ...initialFormData,
    ...initialData,
  });
  const [errors, setErrors] = useState<AssetFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0 && 
    data.name.trim() !== '' && 
    data.initialValue > 0 && 
    data.initialQuantity > 0;

  // Set single field
  const setField = useCallback((field: keyof AssetFormData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear error for this field when user starts typing
    if (errors[field as keyof AssetFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Set multiple fields
  const setFields = useCallback((fields: Partial<AssetFormData>) => {
    setData(prev => ({ ...prev, ...fields }));
    setIsDirty(true);
  }, []);

  // Validate single field
  const validateField = useCallback((field: keyof AssetFormData): boolean => {
    const value = data[field];
    const rules = AssetValidationRules[field as keyof typeof AssetValidationRules];
    
    if (!rules) return true;

    let isValid = true;
    let errorMessage = '';

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      isValid = false;
      errorMessage = `${field} is required`;
    }
    
    // String length validation
    if (isValid && typeof value === 'string' && 'minLength' in rules && rules.minLength && value.length < rules.minLength) {
      isValid = false;
      errorMessage = `${field} must be at least ${rules.minLength} characters`;
    }
    
    if (isValid && typeof value === 'string' && 'maxLength' in rules && rules.maxLength && value.length > rules.maxLength) {
      isValid = false;
      errorMessage = `${field} must not exceed ${rules.maxLength} characters`;
    }
    
    // Number validation
    if (isValid && typeof value === 'number') {
      if ('min' in rules && rules.min !== undefined && value < rules.min) {
        isValid = false;
        errorMessage = `${field} must be at least ${rules.min}`;
      }
      
      if ('max' in rules && rules.max !== undefined && value > rules.max) {
        isValid = false;
        errorMessage = `${field} must not exceed ${rules.max}`;
      }
    }

    // Update errors
    setErrors(prev => ({
      ...prev,
      [field]: isValid ? undefined : errorMessage,
    }));

    return isValid;
  }, [data]);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const fieldsToValidate: (keyof AssetFormData)[] = [
      'name', 'symbol', 'description', 'initialValue', 'initialQuantity', 
      'currentValue', 'currentQuantity'
    ];
    
    let isFormValid = true;
    
    fieldsToValidate.forEach(field => {
      const isFieldValid = validateField(field);
      if (!isFieldValid) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }, [validateField]);

  // Set error for specific field
  const setError = useCallback((field: keyof AssetFormErrors, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  // Clear error for specific field
  const clearError = useCallback((field: keyof AssetFormErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Reset form
  const reset = useCallback(() => {
    setData({ ...initialFormData, ...initialData });
    setErrors({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialData]);

  // Submit form
  const submit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (!onSubmit) {
      console.warn('No onSubmit handler provided');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [data, validateForm, onSubmit]);

  // Auto-validate on field change
  useEffect(() => {
    if (isDirty) {
      // Debounce validation to avoid excessive calls
      const timeoutId = setTimeout(() => {
        validateForm();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [data, isDirty, validateForm]);

  return {
    // Form data
    data,
    errors,
    
    // State
    isSubmitting,
    isDirty,
    isValid,
    
    // Actions
    setField,
    setFields,
    validateField,
    validateForm,
    reset,
    submit,
    
    // Error handling
    setError,
    clearError,
    clearAllErrors,
  };
};
