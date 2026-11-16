import { type NextRequest, NextResponse } from 'next/server';
import { siteOrigin } from '../../_lib/safe-next';
import { supabaseServer } from '../../_lib/supabase/server';

export async function POST(req: NextRequest) {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  return NextResponse.redirect(new URL('/', siteOrigin(req) ?? req.nextUrl.origin), {
    status: 303,
  });
}
