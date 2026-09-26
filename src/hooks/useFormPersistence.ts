import { useState, useEffect } from "react";

/**
 * Hook: auto-save form inputs to localStorage
 * Saves on every change, loads on mount
 */
export function useFormPersistence(key: string, initialValues: Record<string, string>) {
  const storageKey = `ncd_inputs_${key}`;
  
  const [values, setValues] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : initialValues;
    } catch {
      return initialValues;
    }
  });

  // Auto-save on any change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(values));
    } catch { /* quota exceeded or other error */ }
  }, [storageKey, values]);

  const updateValue = (field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const clearValues = () => {
    setValues(initialValues);
    localStorage.removeItem(storageKey);
  };

  return { values, updateValue, clearValues, hasChanges: JSON.stringify(values) !== JSON.stringify(initialValues) };
}