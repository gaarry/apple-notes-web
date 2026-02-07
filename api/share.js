// Share Token API - Zero imports version
export default function handler(req) {
  return new Response(JSON.stringify({ error: 'API disabled during fix' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  })
}
