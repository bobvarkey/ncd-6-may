import { useLocalStorage } from "@/hooks/useLocalStorage";

/**
 * Persist which disclosure sections are open.
 * Missing keys default to open so newly added sections stay visible.
 */
export function useOpenSections(storageKey: string, ids: readonly string[]) {
  const [openMap, setOpenMap] = useLocalStorage<Record<string, boolean>>(
    storageKey,
    Object.fromEntries(ids.map((id) => [id, true])),
  );

  const value = ids.filter((id) => openMap[id] !== false);

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
