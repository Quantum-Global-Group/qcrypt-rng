/**
 * User Preferences & History Management
 * 
 * Utilities for persisting user data in localStorage
 */

export type UserPreferences = {
  mode: 'simple' | 'developer';
  theme?: 'dark' | 'light';
  language?: string;
  onboardingComplete: boolean;
  hasVisited: boolean;
  lastVisited: string;
};

export type HistoryEntry = {
  id: string;
  action: string;
  timestamp: string;
  details?: any;
};

const STORAGE_KEYS = {
  PREFERENCES: 'qcrypt_preferences',
  HISTORY: 'qcrypt_history',
  RECENT_ACTIONS: 'qcrypt_recent_actions',
  USER_MODE: 'qcrypt_user_mode',
  ONBOARDING_COMPLETE: 'qcrypt_onboarding_complete',
  HAS_VISITED: 'qcrypt_has_visited',
};

/**
 * Get user preferences from localStorage
 */
export function getPreferences(): UserPreferences {
  const defaultPrefs: UserPreferences = {
    mode: 'developer',
    theme: 'dark',
    language: 'en',
    onboardingComplete: false,
    hasVisited: false,
    lastVisited: new Date().toISOString(),
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (stored) {
      return { ...defaultPrefs, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load preferences:', error);
  }

  return defaultPrefs;
}

/**
 * Save user preferences to localStorage
 */
export function savePreferences(prefs: Partial<UserPreferences>): void {
  try {
    const current = getPreferences();
    const updated = { ...current, ...prefs, lastVisited: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save preferences:', error);
  }
}

/**
 * Add entry to action history
 */
export function addToHistory(action: string, details?: any): void {
  try {
    const history = getHistory();
    const entry: HistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      timestamp: new Date().toISOString(),
      details,
    };
    
    // Keep only last 50 entries
    const updated = [entry, ...history].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    
    // Also update recent actions (last 5)
    const recent = updated.slice(0, 5).map(h => ({
      action: h.action,
      timestamp: h.timestamp,
    }));
    localStorage.setItem(STORAGE_KEYS.RECENT_ACTIONS, JSON.stringify(recent));
  } catch (error) {
    console.warn('Failed to add to history:', error);
  }
}

/**
 * Get action history from localStorage
 */
export function getHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load history:', error);
    return [];
  }
}

/**
 * Clear action history
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.RECENT_ACTIONS);
  } catch (error) {
    console.warn('Failed to clear history:', error);
  }
}

/**
 * Get user mode from localStorage
 */
export function getUserMode(): 'simple' | 'developer' {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_MODE);
    return (stored as 'simple' | 'developer') || 'developer';
  } catch (error) {
    return 'developer';
  }
}

/**
 * Set user mode in localStorage
 */
export function setUserMode(mode: 'simple' | 'developer'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_MODE, mode);
  } catch (error) {
    console.warn('Failed to set user mode:', error);
  }
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Mark onboarding as complete
 */
export function completeOnboarding(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  } catch (error) {
    console.warn('Failed to complete onboarding:', error);
  }
}

/**
 * Mark that user has visited
 */
export function markVisited(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HAS_VISITED, 'true');
  } catch (error) {
    console.warn('Failed to mark visited:', error);
  }
}

/**
 * Check if user has visited before
 */
export function hasVisited(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.HAS_VISITED) === 'true';
  } catch (error) {
    return false;
  }
}
