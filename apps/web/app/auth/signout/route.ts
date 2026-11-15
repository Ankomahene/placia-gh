import { type NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../_lib/supabase/server';

export async function POST(req: NextRequest) {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  return NextResponse.redirect(new URL('/', req.nextUrl.origin), { status: 303 });
}
