// Share Token API - Minimal version
// GET ?token=xxx - Validate token
// POST - Create token  
// DELETE ?noteId=xxx - Revoke token

export default async function handler(req) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const method = req.method
  const token = url.searchParams.get('token')

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // Simple in-memory token store
  const tokens = []

  if (method === 'GET' && token) {
    const found = tokens.find(t => t.token === token && !t.revoked)
    if (found) {
      return new Response(JSON.stringify({ valid: true, noteId: found.noteId, noteTitle: found.noteTitle }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify({ valid: false, error: 'Invalid token' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (method === 'POST') {
    try {
      const body = await req.json()
      const newToken = {
        token: Math.random().toString(36).substring(2, 34) + Math.random().toString(36).substring(2, 34),
        noteId: body.noteId,
        noteTitle: body.noteTitle || 'Untitled',
        createdAt: Date.now(),
        revoked: false
      }
      // Remove existing for same note
      const idx = tokens.findIndex(t => t.noteId === body.noteId)
      if (idx >= 0) tokens[idx] = newToken
      else tokens.push(newToken)
      
      return new Response(JSON.stringify({ success: true, data: newToken }), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }

  if (method === 'DELETE') {
    const noteId = url.searchParams.get('noteId')
    const idx = tokens.findIndex(t => t.noteId === noteId)
    if (idx >= 0) {
      tokens[idx].revoked = true
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
