// Share Token API - Minimal working version
const tokens = []

export default function handler(req) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const method = req.method
  const token = url.searchParams.get('token')
  const noteId = url.searchParams.get('noteId')

  // CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // GET ?token=xxx
  if (method === 'GET' && token) {
    const found = tokens.find(t => t.token === token && !t.revoked)
    if (found) {
      return new Response(JSON.stringify({ valid: true, noteId: found.noteId, noteTitle: found.noteTitle }), { headers })
    }
    return new Response(JSON.stringify({ valid: false, error: 'Invalid token' }), { status: 404, headers })
  }

  // POST
  if (method === 'POST') {
    try {
      const body = JSON.parse(req.body || '{}')
      if (!body.noteId) {
        return new Response(JSON.stringify({ success: false, error: 'noteId required' }), { status: 400, headers })
      }
      const newToken = {
        token: Math.random().toString(36).substring(2, 34) + Math.random().toString(36).substring(2, 34),
        noteId: body.noteId,
        noteTitle: body.noteTitle || 'Untitled',
        createdAt: Date.now(),
        revoked: false
      }
      const idx = tokens.findIndex(t => t.noteId === body.noteId)
      if (idx >= 0) tokens[idx] = newToken
      else tokens.push(newToken)
      return new Response(JSON.stringify({ success: true, data: newToken }), { status: 201, headers })
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { status: 400, headers })
    }
  }

  // DELETE
  if (method === 'DELETE') {
    const idx = tokens.findIndex(t => t.noteId === noteId)
    if (idx >= 0) {
      tokens[idx].revoked = true
      return new Response(JSON.stringify({ success: true }), { headers })
    }
    return new Response(JSON.stringify({ success: false, error: 'Not found' }), { status: 404, headers })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers })
}
