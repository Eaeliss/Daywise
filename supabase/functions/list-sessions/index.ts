import { createClient } from 'npm:@supabase/supabase-js@^2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  let body: { action?: string; sessionId?: string } = {}
  try {
    body = await req.json()
  } catch {
    /* GET or empty body is ok */
  }

  // Extract user ID from JWT in Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const jwt = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(jwt)
  if (userError || !user) return new Response('Unauthorized', { status: 401 })

  // Revoke individual session
  if (body.action === 'revoke' && body.sessionId) {
    const { error } = await supabase
      .from('auth.sessions')
      .delete()
      .eq('id', body.sessionId)
      .eq('user_id', user.id) // guard: only delete own sessions
    if (error) return new Response('Failed to revoke session', { status: 500 })
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // List sessions
  const { data: sessions, error } = await supabase
    .from('auth.sessions')
    .select('id, user_agent, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return new Response('Failed to list sessions', { status: 500 })

  return new Response(JSON.stringify(sessions ?? []), {
    headers: { 'Content-Type': 'application/json' },
  })
})
