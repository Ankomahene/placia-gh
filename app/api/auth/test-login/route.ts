import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    // Verify PIN
    const testPin = process.env.TEST_LOGIN_PIN;
    if (!testPin || pin !== testPin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Get test credentials from environment
    const testEmail = process.env.TEST_LOGIN_EMAIL;
    const testPassword = process.env.TEST_LOGIN_PASSWORD;

    if (!testEmail || !testPassword) {
      return NextResponse.json(
        { error: 'Test credentials not configured' },
        { status: 500 }
      );
    }
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      return NextResponse.json({ error: 'Test login failed' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      isAdmin: data?.user?.user_metadata?.role === 'admin',
    });
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
