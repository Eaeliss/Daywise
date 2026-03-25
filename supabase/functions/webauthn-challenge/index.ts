import { createClient } from 'npm:@supabase/supabase-js@^2'
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
} from 'npm:@simplewebauthn/server@13'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const RP_ID = 'localhost' // For development — replace with real domain in production
const RP_NAME = 'LifePlan App'

Deno.serve(async (req) => {
  // P-02: wrap req.json() to return 400 on malformed input instead of unhandled rejection
  let body: { type?: string; userId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  const { type, userId } = body

  if (type === 'registration') {
    // v13: userID must be Uint8Array
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(userId),
      userName: userId,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    })

    // P-03: check DB insert error — if challenge storage fails, don't return options to client
    const { error } = await supabase.from('webauthn_challenges').insert({
      user_id: userId,
      challenge: options.challenge,
      type: 'registration',
    })
    if (error) return new Response('Failed to store challenge', { status: 500 })

    return new Response(JSON.stringify(options), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (type === 'authentication') {
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'required',
    })

    // P-03: check DB insert error
    const { error } = await supabase.from('webauthn_challenges').insert({
      user_id: null,
      challenge: options.challenge,
      type: 'authentication',
    })
    if (error) return new Response('Failed to store challenge', { status: 500 })

    return new Response(JSON.stringify(options), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response('Bad request', { status: 400 })
})
