/**
 * Local storage utilities with error handling and JSON support
 */

const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  AUTH_STATE: 'auth_state',
  RECENT_SEARCHES: 'recent_searches',
  RECENT_COMPETITORS: 'recent_competitors',
  TEMP_DATA: 'temp_data'
} as const;

/**
 * Safely get item from storage with JSON parsing
 */
export function getFromStorage<T>(key: string, defaultValue?: T): T | null {
  if (typeof window === 'undefined') {
    return defaultValue || null;
  }
  
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue || null;
    }
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Error reading from storage (${key}):`, error);
    return defaultValue || null;
  }
}

/**
 * Safely set item in storage with JSON serialization
 */
export function setInStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error writing to storage (${key}):`, error);
    return false;
  }
}

/**
 * Remove item from storage
 */
export function removeFromStorage(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing from storage (${key}):`, error);
    return false;
  }
}

/**
 * Store user preferences
 */
export function storeUserPreferences(preferences: any): void {
  setInStorage(STORAGE_KEYS.USER_PREFERENCES, preferences);
}

/**
 * Get user preferences
 */
export function getUserPreferences<T>(): T | null {
  return getFromStorage<T>(STORAGE_KEYS.USER_PREFERENCES);
}

/**
 * Store temporary data
 */
export function storeTempData(data: any): void {
  setInStorage(STORAGE_KEYS.TEMP_DATA, data);
}

/**
 * Get temporary data
 */
export function getTempData<T>(): T | null {
  return getFromStorage<T>(STORAGE_KEYS.TEMP_DATA);
}

/**
 * Clear all temporary data
 */
export function clearTempData(): void {
  removeFromStorage(STORAGE_KEYS.TEMP_DATA);
}

/**
 * Check for recent competitors in storage
 */
export function checkRecentCompetitors(): any[] {
  return getFromStorage<any[]>(STORAGE_KEYS.RECENT_COMPETITORS) || [];
}

/**
 * Clear recent competitors from storage
 */
export function clearRecentCompetitors(): void {
  removeFromStorage(STORAGE_KEYS.RECENT_COMPETITORS);
}

/**
 * Browser session storage utilities with type safety and error handling
 */

/**
 * Safely get item from session storage with JSON parsing
 */
export function getSessionStorageItem<T>(key: string, defaultValue?: T): T | null {
  if (typeof window === 'undefined') {
    return defaultValue || null;
  }
  
  try {
    const item = sessionStorage.getItem(key);
    if (item === null) {
      return defaultValue || null;
    }
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Error reading from session storage (${key}):`, error);
    return defaultValue || null;
  }
}

/**
 * Safely set item in session storage with JSON serialization
 */
export function setSessionStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error writing to session storage (${key}):`, error);
    return false;
  }
}

/**
 * Remove item from session storage
 */
export function removeSessionStorageItem(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing from session storage (${key}):`, error);
    return false;
  }
}

/**
 * Clear all session storage
 */
export function clearSessionStorage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    sessionStorage.clear();
    return true;
  } catch (error) {
    console.warn('Error clearing session storage:', error);
    return false;
  }
}

/**
 * Check if session storage is available
 */
export function isSessionStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const testKey = '__test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}