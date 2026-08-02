/**
 * Synchronous check for a persisted auth session, readable before React or the
 * auth client boots. Used by the startup flow (splash / language gate) so
 * returning signed-in users land on the dashboard instantly.
 */
export function hasStoredSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const raw = localStorage.getItem(key);
        if (raw && raw.length > 20) return true;
      }
    }
  } catch {
    /* storage blocked — treat as guest */
  }
  return false;
}
