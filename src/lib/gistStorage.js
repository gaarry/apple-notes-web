/**
 * GitHub Gist Storage
 * Simpler alternative to full GitHub repo storage
 * 
 * Usage:
 * 1. Create a secret Gist at https://gist.github.com
 * 2. Copy the Gist ID (from URL)
 * 3. Paste ID in settings - no token needed for reading!
 */

const GITHUB_API_BASE = 'https://api.github.com/gists';

class GistStorage {
  constructor() {
    this.gistId = localStorage.getItem('gist_id');
    this.token = localStorage.getItem('gist_token'); // Optional, for writing
  }

  isConfigured() {
    return !!this.gistId;
  }

  configure(gistId, token = null) {
    this.gistId = gistId;
    this.token = token;
    localStorage.setItem('gist_id', gistId);
    if (token) {
      localStorage.setItem('gist_token', token);
    }
  }

  // Public: anyone can read a public gist
  async fetchNotes() {
    if (!this.gistId) {
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

      const notes = JSON.parse(content);
      return { success: true, data: notes };
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      return { success: false, error: error.message };
    }
  }

  // Private: need token to write
  async saveNotes(notes) {
    if (!this.gistId) {
      return { success: false, error: 'Gist ID not configured' };
    }

    if (!this.token) {
      return { 
        success: false, 
        error: 'Token required for saving. Please configure in settings.',
        readOnly: true 
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
              content: JSON.stringify(notes, null, 2)
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
      return { success: false, error: error.message };
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
              content: '[]'
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
