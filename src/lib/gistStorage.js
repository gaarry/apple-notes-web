/**
 * GitHub Gist Storage
 * Simpler alternative to full GitHub repo storage
 * 
 * Usage:
 * 1. Create a secret Gist at https://gist.github.com
 * 2. Copy the Gist ID (from URL)
 * 3. Paste ID in settings - no token needed for reading!
 */

import { parseNotesPayload, serializeNotesPayload } from '../utils';

const GITHUB_API_BASE = 'https://api.github.com/gists';
const FALLBACK_CACHE_KEY = 'gist_notes_cache';

class GistStorage {
  constructor() {
    this.gistId = localStorage.getItem('gist_id');
    this.token = localStorage.getItem('gist_token'); // Optional, for writing
    this.fallbackCache = this.getFallbackCache();
  }

  isConfigured() {
    return !!this.gistId;
  }

  configure(gistId, token = null) {
    this.gistId = gistId;
    this.token = token || null;
    localStorage.setItem('gist_id', gistId);
    if (token) {
      localStorage.setItem('gist_token', token);
    } else {
      localStorage.removeItem('gist_token');
    }
  }

  getFallbackCache() {
    try {
      const raw = localStorage.getItem(FALLBACK_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Failed to read fallback cache:', error);
      return null;
    }
  }

  setFallbackCache(notes) {
    const payload = serializeNotesPayload({ notes });
    this.fallbackCache = payload;
    localStorage.setItem(FALLBACK_CACHE_KEY, JSON.stringify(payload));
  }

  // Public: anyone can read a public gist
  async fetchNotes() {
    if (!this.gistId) {
      if (this.fallbackCache?.notes?.length) {
        return { success: true, data: this.fallbackCache.notes, fallback: true };
      }
      return { success: false, error: 'Gist ID not configured' };
    }

    try {
      const url = `${GITHUB_API_BASE}/${this.gistId}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (!res.ok) {
        if (res.status === 404) {
          return { success: false, error: 'Gist not found' };
        }
        if (res.status === 403) {
          return { success: false, error: 'API rate limit exceeded' };
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const content = data.files?.['notes.json']?.content;
      
      if (!content) {
        return { success: true, data: [] }; // Empty notes
      }

      const parsed = JSON.parse(content);
      const normalized = parseNotesPayload(parsed);
      return { success: true, data: normalized.notes, meta: normalized };
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      if (this.fallbackCache?.notes?.length) {
        return { success: true, data: this.fallbackCache.notes, fallback: true };
      }
      return { success: false, error: error.message };
    }
  }

  // Private: need token to write
  async saveNotes(notes) {
    if (!this.gistId) {
      this.setFallbackCache(notes);
      return { success: true, readOnly: true, fallback: true };
    }

    if (!this.token) {
      this.setFallbackCache(notes);
      return {
        success: true,
        readOnly: true,
        fallback: true
      };
    }

    try {
      const url = `${GITHUB_API_BASE}/${this.gistId}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: 'My Notes - synced from Apple Notes Web',
          files: {
            'notes.json': {
              content: JSON.stringify(serializeNotesPayload({ notes }), null, 2)
            }
          }
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          return { success: false, error: 'Invalid token' };
        }
        if (res.status === 403) {
          return { success: false, error: 'Token has no write permission' };
        }
        throw new Error(`HTTP ${res.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to save notes:', error);
      this.setFallbackCache(notes);
      return { success: true, readOnly: true, fallback: true };
    }
  }

  // Create a new gist (for first-time setup)
  async createGist(token) {
    try {
      const res = await fetch(GITHUB_API_BASE, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: 'My Notes - synced from Apple Notes Web',
          public: false, // Secret gist
          files: {
            'notes.json': {
              content: JSON.stringify(serializeNotesPayload({ notes: [] }), null, 2)
            }
          }
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      return { 
        success: true, 
        gistId: data.id,
        url: data.html_url 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  clearConfig() {
    localStorage.removeItem('gist_id');
    localStorage.removeItem('gist_token');
    this.gistId = null;
    this.token = null;
  }
}

export const gistStorage = new GistStorage();
