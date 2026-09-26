import { useEffect, useRef } from "react";
import { useLabContext } from "@/components/SmartLabelUpload/GlobalLabContext";

/**
 * Hook for individual input fields to auto-fill from global lab upload.
 *
 * Usage:
 *   const [hba1c, setHba1c] = useState("");
 *   useGlobalLabFill("hba1c", setHba1c);
 *
 * This will automatically set hba1c to the parsed value
 * whenever the user applies values from the global Smart Lab Upload.
 */
export function useGlobalLabFill(
  labKey: string,
  setter: (value: string) => void,
  /** Optional: only fill if current value is empty */
  onlyIfEmpty: boolean = true
) {
  const { parsedValues, consumeValues } = useLabContext();
  const prevKey = useRef<string | undefined>();

  useEffect(() => {
    const value = parsedValues[labKey];
    if (value !== undefined && value !== "") {
      // Prevent re-fill on subsequent renders
      if (prevKey.current === labKey) return;
      prevKey.current = labKey;

      setter(value);
    }
  }, [parsedValues, labKey, setter]);

  // Clear consumed values after a brief delay
  useEffect(() => {
    if (Object.keys(parsedValues).length > 0) {
      const timer = setTimeout(() => consumeValues(), 2000);
      return () => clearTimeout(timer);
    }
  }, [parsedValues, consumeValues]);
}

/**
 * Convenience: apply multiple lab keys at once.
 *
 * Usage:
 *   useGlobalLabFillAll({
 *     hba1c: setHba1c,
 *     weight: setWeight,
 *     ldl: setLdl,
 *   });
 */
export function useGlobalLabFillAll(
  setters: Record<string, (value: string) => void>,
  onlyIfEmpty: boolean = true
) {
  const { parsedValues, consumeValues } = useLabContext();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current || Object.keys(parsedValues).length === 0) return;

    let applied = false;
    for (const [key, setter] of Object.entries(setters)) {
      const value = parsedValues[key];
      if (value !== undefined && value !== "") {
        setter(value);
        applied = true;
      }
    }

    if (applied) {
      appliedRef.current = true;
      setTimeout(() => {
        appliedRef.current = false;
        consumeValues();
      }, 2000);
    }
  }, [parsedValues, setters, consumeValues]);
}
