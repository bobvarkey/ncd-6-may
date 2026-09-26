import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ── Context shape ──
interface LabContextType {
  /** Latest parsed lab values from global upload */
  parsedValues: Record<string, string>;
  /** Push values into context — pages listen to this */
  setParsedValues: (values: Record<string, string>) => void;
  /** Clear consumed values */
  consumeValues: () => void;
}

const LabContext = createContext<LabContextType>({
  parsedValues: {},
  setParsedValues: () => {},
  consumeValues: () => {},
});

// ── Provider ──
export function LabProvider({ children }: { children: ReactNode }) {
  const [parsedValues, setValues] = useState<Record<string, string>>({});

  const setParsedValues = useCallback((values: Record<string, string>) => {
    setValues(values);
  }, []);

  const consumeValues = useCallback(() => {
    setValues({});
  }, []);

  return (
    <LabContext.Provider value={{ parsedValues, setParsedValues, consumeValues }}>
      {children}
    </LabContext.Provider>
  );
}

// ── Hook for pages ──
export function useLabContext() {
  return useContext(LabContext);
}
