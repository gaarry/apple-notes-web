import { shareTokenManager } from '../src/lib/shareToken.js'

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
      const result = await shareTokenManager.validateToken(token)
      if (result.valid) {
        await shareTokenManager.incrementViewCount(token)
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
      const result = await shareTokenManager.createShareToken(body.noteId, body.noteTitle)
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
    const result = await shareTokenManager.revokeShareToken(noteId)
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
