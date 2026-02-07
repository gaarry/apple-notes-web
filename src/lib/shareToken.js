/**
 * Share Token Management
 * Handles generating, validating, and revoking share tokens for notes
 */

import { parseNotesPayload, serializeNotesPayload } from '../utils'

const SHARE_TOKENS_GIST_ID = process.env.SHARE_TOKENS_GIST_ID || process.env.GIST_ID
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const CACHE_KEY = 'share_tokens_cache'

// Build share tokens payload
function buildPayload(tokens = []) {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    tokens: Array.isArray(tokens) ? tokens : []
  }
}

// Fetch share tokens from Gist
async function fetchShareTokens() {
  if (!SHARE_TOKENS_GIST_ID) {
    console.log('SHARE_TOKENS_GIST_ID not configured')
    return null
  }

  try {
    const url = `https://api.github.com/gists/${SHARE_TOKENS_GIST_ID}`
    const headers = {
      Accept: 'application/vnd.github.v3+json',
      ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {})
    }

    const res = await fetch(url, { headers })
    if (!res.ok) {
      console.error('Failed to fetch share tokens gist:', res.status)
      return null
    }

    const data = await res.json()
    const content = data.files?.['share-tokens.json']?.content
    if (!content) return { tokens: [] }

    const parsed = JSON.parse(content)
    return {
      tokens: Array.isArray(parsed?.tokens) ? parsed.tokens : []
    }
  } catch (error) {
    console.error('Error fetching share tokens:', error)
    return null
  }
}

// Save share tokens to Gist
async function saveShareTokens(tokens) {
  if (!SHARE_TOKENS_GIST_ID) {
    console.log('SHARE_TOKENS_GIST_ID not configured')
    return false
  }

  if (!GITHUB_TOKEN) {
    console.log('GITHUB_TOKEN not configured for writing')
    return false
  }

  try {
    const url = `https://api.github.com/gists/${SHARE_TOKENS_GIST_ID}`
    const headers = {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    }

    const body = JSON.stringify({
      description: 'Apple Notes Web - Share Tokens',
      files: {
        'share-tokens.json': {
          content: JSON.stringify(buildPayload(tokens), null, 2)
        }
      }
    })

    const res = await fetch(url, { method: 'PATCH', headers, body })
    return res.ok
  } catch (error) {
    console.error('Error saving share tokens:', error)
    return false
  }
}

// Generate a secure random token
function generateToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Get share token cache from localStorage
function getLocalCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Set share token cache
function setLocalCache(tokens) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    tokens,
    cachedAt: Date.now()
  }))
}

class ShareTokenManager {
  constructor() {
    this.tokens = []
    this.initialized = false
  }

  // Initialize tokens from Gist or local cache
  async initialize() {
    if (this.initialized) return this.tokens

    // Try Gist first
    const gistData = await fetchShareTokens()
    if (gistData && gistData.tokens) {
      this.tokens = gistData.tokens
      setLocalCache(this.tokens)
      this.initialized = true
      return this.tokens
    }

    // Fallback to local cache
    const cached = getLocalCache()
    if (cached && cached.tokens) {
      this.tokens = cached.tokens
      this.initialized = true
      return this.tokens
    }

    this.tokens = []
    this.initialized = true
    return this.tokens
  }

  // Create a new share token for a note
  async createShareToken(noteId, noteTitle) {
    await this.initialize()

    // Check if token already exists for this note
    const existingIndex = this.tokens.findIndex(t => t.noteId === noteId)
    const token = generateToken()

    const newToken = {
      token,
      noteId,
      noteTitle: noteTitle || 'Untitled Note',
      createdAt: Date.now(),
      expiresAt: null, // null = never expires
      revoked: false,
      viewCount: 0
    }

    if (existingIndex >= 0) {
      // Update existing token
      this.tokens[existingIndex] = {
        ...this.tokens[existingIndex],
        token, // Generate new token
        createdAt: Date.now(),
        revoked: false
      }
    } else {
      // Add new token
      this.tokens.push(newToken)
    }

    // Save to Gist
    const saved = await saveShareTokens(this.tokens)
    if (saved) {
      setLocalCache(this.tokens)
    }

    return newToken
  }

  // Validate a share token
  async validateToken(token) {
    await this.initialize()

    const shareToken = this.tokens.find(t => t.token === token && !t.revoked)
    if (!shareToken) {
      return { valid: false, error: 'Invalid or revoked token' }
    }

    // Check expiration
    if (shareToken.expiresAt && shareToken.expiresAt < Date.now()) {
      return { valid: false, error: 'Token has expired' }
    }

    return {
      valid: true,
      noteId: shareToken.noteId,
      noteTitle: shareToken.noteTitle,
      createdAt: shareToken.createdAt
    }
  }

  // Revoke a share token
  async revokeShareToken(noteId) {
    await this.initialize()

    const index = this.tokens.findIndex(t => t.noteId === noteId)
    if (index === -1) {
      return { success: false, error: 'Token not found' }
    }

    this.tokens[index].revoked = true

    const saved = await saveShareTokens(this.tokens)
    if (saved) {
      setLocalCache(this.tokens)
    }

    return { success: true }
  }

  // Get share token for a note
  getShareToken(noteId) {
    return this.tokens.find(t => t.noteId === noteId && !t.revoked)
  }

  // Get all share tokens
  getAllTokens() {
    return this.tokens
  }

  // Increment view count
  async incrementViewCount(token) {
    const index = this.tokens.findIndex(t => t.token === token)
    if (index !== -1) {
      this.tokens[index].viewCount = (this.tokens[index].viewCount || 0) + 1
      await saveShareTokens(this.tokens)
      setLocalCache(this.tokens)
    }
  }
}

export const shareTokenManager = new ShareTokenManager()

// API handler for share tokens
export default async function handler(req) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const method = req.method
  const token = url.searchParams.get('token')

  // GET /api/share?token=xxx - Validate token
  if (method === 'GET' && token) {
    const result = await shareTokenManager.validateToken(token)
    if (result.valid) {
      await shareTokenManager.incrementViewCount(token)
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify(result), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // POST /api/share - Create token
  if (method === 'POST') {
    try {
      const body = await req.json()
      if (!body.noteId) {
        return new Response(JSON.stringify({ success: false, error: 'noteId required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      }
      const result = await shareTokenManager.createShareToken(body.noteId, body.noteTitle)
      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    }
  }

  // DELETE /api/share?noteId=xxx - Revoke token
  if (method === 'DELETE') {
    const noteId = url.searchParams.get('noteId')
    if (!noteId) {
      return new Response(JSON.stringify({ success: false, error: 'noteId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    const result = await shareTokenManager.revokeShareToken(noteId)
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  })
}
