import { createClient } from 'npm:@supabase/supabase-js@^2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const jwt = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(jwt)
  if (userError || !user) return new Response('Unauthorized', { status: 401 })

  // Delete user — cascades: user_profiles, webauthn_credentials, webauthn_challenges (ON DELETE CASCADE)
  // Future tables from epics 2–4 must also have ON DELETE CASCADE to auth.users
  const { error } = await supabase.auth.admin.deleteUser(user.id)
  if (error) return new Response('Deletion failed', { status: 500 })

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
