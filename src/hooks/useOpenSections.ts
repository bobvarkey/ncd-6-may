import { useLocalStorage } from "@/hooks/useLocalStorage";

/**
 * Persist which disclosure sections are open.
 * Missing keys default to closed so first visit and newly added sections start collapsed.
 * Saved true/false values in localStorage are respected.
 */
export function useOpenSections(storageKey: string, ids: readonly string[]) {
  const [openMap, setOpenMap] = useLocalStorage<Record<string, boolean>>(
    storageKey,
    {},
  );

  const value = ids.filter((id) => openMap[id] === true);

  const onValueChange = (next: string[]) => {
    const open = new Set(next);
    setOpenMap((prev) => {
      const merged: Record<string, boolean> = { ...prev };
      for (const id of ids) {
        merged[id] = open.has(id);
      }
      return merged;
    });
  };

  return { value, onValueChange };
}
