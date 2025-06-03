import WelcomeEmail from '@/components/emails/WelcomeEmail';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();

    try {
      // Exchange the code for a session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.exchangeCodeForSession(code);

      if (sessionError) {
        console.error('Error exchanging code for session:', sessionError);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      // Check if the user is an admin
      const { data: profile } = await supabase
        .from('users')
        .select('role, first_login')
        .eq('id', session?.user.id)
        .single();

      // Redirect based on user role
      if (profile?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      if (profile?.first_login) {
        await supabase
          .from('users')
          .update({ first_login: false })
          .eq('id', session?.user.id);

        //send welcome email
        const dashboardUrl = `${new URL(request.url).origin}/dashboard`;

        if (session && session.user.email) {
          await resend.emails.send({
            from: 'PlaciaGH <welcome@mrshadrack.com>',
            to: session.user.email,
            subject: 'Welcome to PlaciaGH!',
            react: WelcomeEmail({
              userEmail: session.user.email,
              dashboardUrl,
            }),
          });
        }
      }

      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      console.error('Error in auth callback:', error);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // If no code is present, redirect to login
  return NextResponse.redirect(new URL('/auth/login', request.url));
}
