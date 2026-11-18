'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Resend } from 'resend';
import { z } from 'zod';
import { isAdminId, serviceDb, supabaseServer } from '../_lib/auth';

/**
 * Sends a sign-in code, but only to admins. Everyone gets the same answer, so the page doesn't
 * reveal who is an admin. No account is ever created here. The code comes from Supabase's
 * generateLink (nothing sent by Supabase) and is checked in the browser with verifyOtp.
 */

const Email = z.email().max(200);
const WINDOW_MS = 10 * 60_000;
const hits = new Map<string, number[]>();
let resend: Resend | null = null;

function limited(key: string, max: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

export type SendResult = { ok: true } | { ok: false; error: 'invalid' | 'limited' | 'failed' };

export async function sendCode(raw: string): Promise<SendResult> {
  const parsed = Email.safeParse(raw.trim().toLowerCase());
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const email = parsed.data;
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (limited(`ip:${ip}`, 8) || limited(`to:${email}`, 4)) return { ok: false, error: 'limited' };

  const db = serviceDb();
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!db || !key || !from) return { ok: false, error: 'failed' };

  // Check first: generateLink would create an account for an unknown address.
  const { data: adminId } = await db.rpc(
    'admin_id_for_email' as never,
    { p_email: email } as never,
  );
  // Unknown address or not an admin: same answer as success, nothing sent, nothing created.
  if (!adminId || !(await isAdminId(adminId as unknown as string))) return { ok: true };

  const link = await db.auth.admin.generateLink({ type: 'magiclink', email });
  const code = link.data?.properties?.email_otp;
  if (link.error || !code) return { ok: false, error: 'failed' };

  resend ??= new Resend(key);
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `${code} is your Placia Admin code`,
    text: `Your Placia Admin sign-in code is ${code}\n\nIt expires in an hour. If you didn't ask for it, ignore this email.`,
    html: `<div style="font-family:Helvetica,Arial,sans-serif;max-width:440px;margin:0 auto;padding:32px 24px;color:#1b211e">
<p style="font-size:20px;font-weight:700;color:#006d47;margin:0 0 24px">Placia Admin</p>
<p style="margin:0 0 16px">Your sign-in code:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:0 0 24px">${code}</p>
<p style="font-size:13px;color:#5b635f;margin:0">It expires in an hour. If you didn't ask for it, ignore this email.</p>
</div>`,
  });
  if (error) {
    console.error('admin sign-in email failed', error.message);
    return { ok: false, error: 'failed' };
  }
  return { ok: true };
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect('/signin');
}
