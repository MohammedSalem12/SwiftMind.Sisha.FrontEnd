import { Injectable } from '@angular/core';

const CACHE_PREFIX = 'swiftmind_cache_';
const CACHE_TS_SUFFIX = '_ts';

@Injectable({ providedIn: 'root' })
export class OfflineCacheService {

  /** Save data to localStorage with a timestamp */
  set<T>(key: string, data: T): void {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
      localStorage.setItem(CACHE_PREFIX + key + CACHE_TS_SUFFIX, Date.now().toString());
    } catch {
      // quota exceeded or private browsing — ignore
    }
  }

  /** Retrieve cached data (returns null if not found) */
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  /** Get the timestamp when this key was last cached */
  getTimestamp(key: string): number | null {
    const ts = localStorage.getItem(CACHE_PREFIX + key + CACHE_TS_SUFFIX);
    return ts ? Number(ts) : null;
  }

  /** Human-readable "last updated" label */
  getLastUpdatedLabel(key: string): string {
    const ts = this.getTimestamp(key);
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن · just now';
    if (mins < 60) return `منذ ${mins} دقيقة · ${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `منذ ${hrs} ساعة · ${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `منذ ${days} يوم · ${days}d ago`;
  }

  /** Remove a specific cached key */
  remove(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key);
    localStorage.removeItem(CACHE_PREFIX + key + CACHE_TS_SUFFIX);
  }
}
