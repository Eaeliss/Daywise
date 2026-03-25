-- webauthn_challenges: single-use server challenges for WebAuthn registration + authentication
CREATE TABLE public.webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for authentication (pre-auth)
  challenge TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS — only accessed via service role in Edge Functions
-- Cleanup: challenges are deleted after use; expired ones are harmless
CREATE INDEX idx_webauthn_challenges_challenge ON public.webauthn_challenges(challenge);
