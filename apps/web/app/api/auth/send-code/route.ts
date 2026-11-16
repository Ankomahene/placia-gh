import { Resend } from 'resend';
import { z } from 'zod';
import { SignInCodeEmail } from '../../../../emails/sign-in-code';
import { db } from '../../../_lib/db';
import { limitHit, rateLimited } from '../../../_lib/rate-limit';
import { safeNext, siteOrigin } from '../../../_lib/safe-next';

/**
 * POST /api/auth/send-code { email, next? }
 *
 * Our own sign-in email instead of Supabase's: generateLink gives us the 6-digit code and a
 * token hash without Supabase sending anything, and we send a branded email through Resend.
 * The code is checked by Supabase (verifyOtp) in the browser; the link lands on /auth/callback.
 */

const Body = z.object({ email: z.email().max(200), next: z.string().max(200).optional() });
let resend: Resend | null = null;

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid_email' }, { status: 400 });
  const email = parsed.data.email.trim().toLowerCase();
  // Per device and per address, so nobody can flood someone's inbox.
  if (
    rateLimited(req, 'send-code', 8, 10 * 60_000) ||
    limitHit(`send-code-to:${email}`, 4, 10 * 60_000)
  ) {
    return Response.json({ error: 'too_many_requests' }, { status: 429 });
  }
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const origin = siteOrigin(req);
  if (!key || !from || !origin) return Response.json({ error: 'not_configured' }, { status: 503 });

  const sb = db();
  let link = await sb.auth.admin.generateLink({ type: 'magiclink', email });
  if (link.error?.code === 'user_not_found' || link.error?.status === 404) {
    // First sign-in: create the account (confirmed, since proving the code proves the address).
    const created = await sb.auth.admin.createUser({ email, email_confirm: true });
    if (created.error) {
      console.error('createUser failed', created.error.message);
      return Response.json({ error: 'send_failed' }, { status: 500 });
    }
    link = await sb.auth.admin.generateLink({ type: 'magiclink', email });
  }
  if (link.error || !link.data.properties) {
    console.error('generateLink failed', link.error?.message);
    return Response.json({ error: 'send_failed' }, { status: 500 });
  }

  const { email_otp: code, hashed_token: hash } = link.data.properties;
  const next = safeNext(parsed.data.next);
  const url = `${origin}/auth/callback?token_hash=${hash}&type=magiclink&next=${encodeURIComponent(next)}`;

  resend ??= new Resend(key);
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `${code} is your Placia code`,
    react: SignInCodeEmail({ code, link: url }),
  });
  if (error) {
    console.error('resend failed', error.message);
    return Response.json({ error: 'send_failed' }, { status: 502 });
  }
  return Response.json({ sent: true });
}
