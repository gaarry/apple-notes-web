/**
 * Share Token API Handler - Optimized for speed
 * Uses in-memory cache only (no localStorage in serverless)
 */

const SHARE_TOKENS_GIST_ID = process.env.SHARE_TOKENS_GIST_ID || process.env.GIST_ID
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

// In-memory cache for this invocation only
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

// Get tokens from memory cache only (fast)
async function getCachedTokens() {
  if (memoryCache !== null) return memoryCache
  memoryCache = []
  return memoryCache
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

  const existingIndex = tokens.findIndex(t => t.noteId === noteId)
  if (existingIndex >= 0) {
    tokens[existingIndex] = { ...tokens[existingIndex], ...newToken }
  } else {
    tokens.push(newToken)
  }

  memoryCache = tokens
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
  memoryCache = tokens
  return { success: true }
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

  // GET /api/share?token=xxx - Validate token
  if (method === 'GET' && token) {
    try {
      const result = await validateToken(token)
      return new Response(JSON.stringify(result), {
        status: result.valid ? 200 : 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (error) {
      return new Response(JSON.stringify({ valid: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }

  // POST /api/share - Create token
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

  // DELETE /api/share?noteId=xxx - Revoke token
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
