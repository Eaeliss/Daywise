import { createClient } from 'npm:@supabase/supabase-js@^2'
import {
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from 'npm:@simplewebauthn/server@13'
import { SignJWT } from 'npm:jose@5'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const RP_ID = 'localhost' // For development — replace with real domain in production
const ORIGIN = 'lifeplanapp://' // app scheme for React Native

// P-01: Deno-native base64url helpers — avoids Buffer dependency which is not guaranteed in all Deno runtimes
function toBase64url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

Deno.serve(async (req) => {
  // P-02: wrap req.json() to return 400 on malformed input instead of unhandled rejection
  let body: { type?: string; response?: any; userId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  const { type, response, userId } = body

  if (type === 'registration') {
    const { data: challengeRow } = await supabase
      .from('webauthn_challenges')
      .select('challenge')
      .eq('user_id', userId)
      .eq('type', 'registration')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!challengeRow) return new Response('Challenge expired', { status: 400 })

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return new Response('Verification failed', { status: 400 })
    }

    // P-01: use Deno-native base64url helpers instead of Buffer.from()
    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo
    const { error: credentialError } = await supabase.from('webauthn_credentials').insert({
      user_id: userId,
      credential_id: toBase64url(credentialID),
      public_key: toBase64url(credentialPublicKey),
      counter,
    })

    // P-03: surface DB insert failure rather than silently returning success
    if (credentialError) return new Response('Failed to store credential', { status: 500 })

    await supabase.from('webauthn_challenges').delete().eq('challenge', challengeRow.challenge)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (type === 'authentication') {
    const credentialId = response.id

    const { data: credentialRow } = await supabase
      .from('webauthn_credentials')
      .select('user_id, public_key, counter')
      .eq('credential_id', credentialId)
      .single()

    if (!credentialRow) return new Response('Credential not found', { status: 400 })

    // P-04: look up the challenge by its exact value from the authenticator response
    // rather than picking the most-recent null-user row (which could be from a different request)
    let challengeValue: string
    try {
      const clientData = JSON.parse(
        new TextDecoder().decode(fromBase64url(response.response.clientDataJSON)),
      )
      challengeValue = clientData.challenge
    } catch {
      return new Response('Invalid clientDataJSON', { status: 400 })
    }

    const { data: challengeRow } = await supabase
      .from('webauthn_challenges')
      .select('challenge')
      .eq('challenge', challengeValue)
      .eq('type', 'authentication')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!challengeRow) return new Response('Challenge expired', { status: 400 })

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credentialId,
        publicKey: fromBase64url(credentialRow.public_key), // P-01: Deno-native
        counter: credentialRow.counter,
      },
    })

    if (!verification.verified) return new Response('Verification failed', { status: 400 })

    // P-05: check counter update — don't issue a JWT if the anti-replay update fails
    const { error: counterError } = await supabase
      .from('webauthn_credentials')
      .update({ counter: verification.authenticationInfo.newCounter })
      .eq('credential_id', credentialId)

    if (counterError) return new Response('Counter update failed', { status: 500 })

    await supabase.from('webauthn_challenges').delete().eq('challenge', challengeRow.challenge)

    // Issue custom JWT signed with SUPABASE_JWT_SECRET
    // SUPABASE_JWT_SECRET is auto-injected in hosted Supabase Edge Functions
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET')!
    const access_token = await new SignJWT({
      sub: credentialRow.user_id,
      role: 'authenticated',
      aud: 'authenticated',
      iss: Deno.env.get('SUPABASE_URL')! + '/auth/v1', // P-07: required by Supabase RLS auth.uid() resolution
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(jwtSecret))

    return new Response(JSON.stringify({ access_token }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response('Bad request', { status: 400 })
})
