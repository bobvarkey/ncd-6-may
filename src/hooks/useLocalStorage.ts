import { createContext, useCallback, useContext, useEffect, useState } from "react";

/** Set by a page-level reset scope; collects the saved-input keys used by that page so Reset can clear them. */
export const ResetKeyRegistryContext = createContext<Set<string> | null>(null);

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const registry = useContext(ResetKeyRegistryContext);
  useEffect(() => { registry?.add(key); }, [registry, key]);
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const nextValue = value instanceof Function ? value(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(nextValue));
      } catch { /* quota exceeded etc */ }
      return nextValue;
    });
  }, [key]);

  return [storedValue, setValue];
}
