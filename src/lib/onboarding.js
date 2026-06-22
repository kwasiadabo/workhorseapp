const storageKey = (userId) => `onboarding-seen-${userId}`;

export const hasSeenOnboarding = (userId) => {
  if (!userId) return true;
  try {
    return localStorage.getItem(storageKey(userId)) === '1';
  } catch {
    return true;
  }
};

export const markOnboardingSeen = (userId) => {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId), '1');
  } catch {
    // localStorage may be unavailable (e.g. private browsing) — not critical.
  }
};
