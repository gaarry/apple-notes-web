/**
 * Share Token API Handler - Optimized for speed
 * Uses in-memory cache + localStorage fallback
 */

const SHARE_TOKENS_GIST_ID = process.env.SHARE_TOKENS_GIST_ID || process.env.GIST_ID
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

// In-memory cache for this invocation
let memoryCache = null

// Build share tokens payload
function buildPayload(tokens = []) {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    tokens: Array.isArray(tokens) ? tokens : []
  }
}

// Generate a secure random token
function generateToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Get tokens from cache (memory + localStorage)
async function getCachedTokens() {
  if (memoryCache !== null) return memoryCache
  
  // Try localStorage first (fast)
  try {
    const raw = localStorage?.getItem('share_tokens_cache')
    if (raw) {
      const parsed = JSON.parse(raw)
      // Cache valid for 5 minutes
      if (parsed && parsed.cachedAt && (Date.now() - parsed.cachedAt < 5 * 60 * 1000)) {
        memoryCache = parsed.tokens || []
        return memoryCache
      }
    }
  } catch (e) {
    // localStorage not available or parse failed
  }
  
  memoryCache = []
  return memoryCache
}

// Save to localStorage (async, non-blocking)
async function saveToCache(tokens) {
  memoryCache = tokens
  try {
    localStorage?.setItem('share_tokens_cache', JSON.stringify({
      tokens,
      cachedAt: Date.now()
    }))
  } catch (e) {
    // localStorage not available
  }
}

// Validate a share token
async function validateToken(token) {
  const tokens = await getCachedTokens()
  const shareToken = tokens.find(t => t.token === token && !t.revoked)
  
  if (!shareToken) {
    return { valid: false, error: 'Invalid or revoked token' }
  }

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

// Create a new share token
async function createShareToken(noteId, noteTitle) {
  const tokens = await getCachedTokens()
  const token = generateToken()
  
  const newToken = {
    token,
    noteId,
    noteTitle: noteTitle || 'Untitled Note',
    createdAt: Date.now(),
    expiresAt: null,
    revoked: false,
    viewCount: 0
  }

  // Update or add token
  const existingIndex = tokens.findIndex(t => t.noteId === noteId)
  if (existingIndex >= 0) {
    tokens[existingIndex] = { ...tokens[existingIndex], ...newToken }
  } else {
    tokens.push(newToken)
  }

  await saveToCache(tokens)
  
  // Background sync to Gist (don't wait)
  syncToGist(tokens).catch(() => {})
  
  return newToken
}

// Revoke a share token
async function revokeShareToken(noteId) {
  const tokens = await getCachedTokens()
  const index = tokens.findIndex(t => t.noteId === noteId)
  
  if (index === -1) {
    return { success: false, error: 'Token not found' }
  }

  tokens[index].revoked = true
  await saveToCache(tokens)
  
  // Background sync to Gist (don't wait)
  syncToGist(tokens).catch(() => {})
  
  return { success: true }
}

// Background sync to Gist (fire and forget)
async function syncToGist(tokens) {
  if (!SHARE_TOKENS_GIST_ID || !GITHUB_TOKEN) return false
  
  try {
    const url = `https://api.github.com/gists/${SHARE_TOKENS_GIST_ID}`
    const body = JSON.stringify({
      description: 'Apple Notes Web - Share Tokens',
      files: {
        'share-tokens.json': {
          content: JSON.stringify(buildPayload(tokens), null, 2)
        }
      }
    })
    
    await fetch(url, {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body
    })
    return true
  } catch (error) {
    console.error('Background sync failed:', error)
    return false
  }
}

// Clear cache (for testing)
function clearCache() {
  memoryCache = null
  localStorage?.removeItem('share_tokens_cache')
}

export default async function handler(req) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const method = req.method
  const token = url.searchParams.get('token')

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // Clear cache endpoint (for testing)
  if (method === 'POST' && url.pathname === '/api/share/clear') {
    clearCache()
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // GET /api/share?token=xxx - Validate token (FAST - uses cache)
  if (method === 'GET' && token) {
    try {
      const result = await validateToken(token)
      if (result.valid) {
        // Background increment view count
        incrementViewCount(token).catch(() => {})
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify(result), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (error) {
      return new Response(JSON.stringify({ valid: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }

  // POST /api/share - Create token (FAST - uses cache)
  if (method === 'POST') {
    try {
      const body = await req.json()
      if (!body.noteId) {
        return new Response(JSON.stringify({ success: false, error: 'noteId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      const result = await createShareToken(body.noteId, body.noteTitle)
      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }

  // DELETE /api/share?noteId=xxx - Revoke token (FAST - uses cache)
  if (method === 'DELETE') {
    const noteId = url.searchParams.get('noteId')
    if (!noteId) {
      return new Response(JSON.stringify({ success: false, error: 'noteId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const result = await revokeShareToken(noteId)
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Background increment view count
async function incrementViewCount(token) {
  const tokens = await getCachedTokens()
  const index = tokens.findIndex(t => t.token === token)
  if (index !== -1) {
    tokens[index].viewCount = (tokens[index].viewCount || 0) + 1
    await saveToCache(tokens)
  }
}
