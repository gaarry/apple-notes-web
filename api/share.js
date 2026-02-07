/**
 * Share Token API Handler for Vercel Serverless Functions
 * Simplified version - no client-side dependencies
 */

const SHARE_TOKENS_GIST_ID = process.env.SHARE_TOKENS_GIST_ID || process.env.GIST_ID
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

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

// Fetch share tokens from Gist
async function fetchShareTokens() {
  if (!SHARE_TOKENS_GIST_ID) {
    console.log('SHARE_TOKENS_GIST_ID not configured')
    return { tokens: [] }
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
      return { tokens: [] }
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
    return { tokens: [] }
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

// Get share tokens (cached for this invocation)
let cachedTokens = null
async function getTokens() {
  if (cachedTokens !== null) return cachedTokens
  const data = await fetchShareTokens()
  cachedTokens = data.tokens || []
  return cachedTokens
}

// Create share token
async function createShareToken(noteId, noteTitle) {
  const tokens = await getTokens()
  const token = generateToken()
  
  const existingIndex = tokens.findIndex(t => t.noteId === noteId)
  const newToken = {
    token,
    noteId,
    noteTitle: noteTitle || 'Untitled Note',
    createdAt: Date.now(),
    expiresAt: null,
    revoked: false,
    viewCount: 0
  }

  if (existingIndex >= 0) {
    tokens[existingIndex] = { ...tokens[existingIndex], ...newToken }
  } else {
    tokens.push(newToken)
  }

  const saved = await saveShareTokens(tokens)
  if (saved) {
    cachedTokens = tokens
  }

  return newToken
}

// Validate share token
async function validateToken(token) {
  const tokens = await getTokens()
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

// Revoke share token
async function revokeShareToken(noteId) {
  const tokens = await getTokens()
  const index = tokens.findIndex(t => t.noteId === noteId)
  
  if (index === -1) {
    return { success: false, error: 'Token not found' }
  }

  tokens[index].revoked = true
  const saved = await saveShareTokens(tokens)
  
  if (saved) {
    cachedTokens = tokens
  }

  return { success: true }
}

// Increment view count
async function incrementViewCount(token) {
  const tokens = await getTokens()
  const index = tokens.findIndex(t => t.token === token)
  
  if (index !== -1) {
    tokens[index].viewCount = (tokens[index].viewCount || 0) + 1
    await saveShareTokens(tokens)
    cachedTokens = tokens
  }
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
      if (result.valid) {
        await incrementViewCount(token)
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
