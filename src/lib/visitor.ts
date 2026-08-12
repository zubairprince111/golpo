/**
 * Persistent anonymous visitor token for guest interactions (reactions, views).
 * Stored in localStorage so anonymous users can react to memories with 1-reaction-per-post enforcement.
 */
export function getVisitorToken(): string {
  if (typeof window === "undefined") {
    return "server_token";
  }

  const STORAGE_KEY = "golpo_visitor_token";
  let token = localStorage.getItem(STORAGE_KEY);

  if (!token) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      token = `v_${crypto.randomUUID()}`;
    } else {
      token = `v_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
    }
    try {
      localStorage.setItem(STORAGE_KEY, token);
    } catch {
      // Ignore in private browsing mode if quota exceeded
    }
  }

  return token;
}
