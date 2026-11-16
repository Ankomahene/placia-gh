import type { EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { safeNext, siteOrigin } from '../../_lib/safe-next';
import { supabaseServer } from '../../_lib/supabase/server';

/** Where the email link lands: either a PKCE code or a token hash, both become a session. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = safeNext(url.searchParams.get('next'));
  const sb = await supabaseServer();
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const { error } = code
    ? await sb.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await sb.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error('missing code') };
  return NextResponse.redirect(
    new URL(
      error ? `/signin?next=${encodeURIComponent(next)}&failed=1` : next,
      siteOrigin(req) ?? url.origin,
    ),
  );
}
