export interface GuestProgressItem {
  anilistId: number;
  episodeNumber: number;
  position: number;
  duration: number;
  percentage: number;
  completed: boolean;
  server?: string;
  lastWatchedAt: number;
}

const STORAGE_KEY = "vanime_guest_progress_v1";

export function getGuestProgress(
  anilistId: number,
  episodeNumber: number
): GuestProgressItem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const items: GuestProgressItem[] = JSON.parse(raw);
    return (
      items.find(
        (i) => i.anilistId === anilistId && i.episodeNumber === episodeNumber
      ) || null
    );
  } catch (e) {
    console.error("Failed to read guest progress from localStorage", e);
    return null;
  }
}

export function saveGuestProgress(
  item: Omit<GuestProgressItem, "lastWatchedAt">
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let items: GuestProgressItem[] = raw ? JSON.parse(raw) : [];

    const now = Date.now();
    const existingIndex = items.findIndex(
      (i) =>
        i.anilistId === item.anilistId && i.episodeNumber === item.episodeNumber
    );

    const fullItem: GuestProgressItem = {
      ...item,
      lastWatchedAt: now,
    };

    if (existingIndex >= 0) {
      items[existingIndex] = fullItem;
    } else {
      items.push(fullItem);
    }

    // Keep max 50 items in local storage
    if (items.length > 50) {
      items = items.slice(-50);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save guest progress to localStorage", e);
  }
}

export function getAllGuestProgress(): GuestProgressItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearGuestProgress(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear guest progress", e);
  }
}
