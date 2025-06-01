import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import VerificationEmail from '@/components/emails/VerificationEmail';
import WelcomeEmail from '@/components/emails/WelcomeEmail';
import PasswordResetConfirmationEmail from '@/components/emails/PasswordResetConfirmationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { type, email, password, isPasswordReset, origin, full_name, role } =
      await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let data;

    switch (type) {
      case 'verification':
        try {
          const supabase = createAdminClient();
          let res;

          if (isPasswordReset) {
            res = await supabase.auth.admin.generateLink({
              type: 'recovery',
              email,
            });
          } else {
            res = await supabase.auth.admin.generateLink({
              type: 'signup',
              email,
              password,
              options: {
                data: {
                  full_name,
                  role,
                },
              },
            });

            if (res.error) {
              throw new Error(res.error.message);
            }
          }

          if (res.data.properties?.email_otp) {
            data = await resend.emails.send({
              from: 'PlaciaGH <auth@mrshadrack.com>',
              to: email,
              subject: isPasswordReset
                ? 'Reset your password'
                : 'Verify your email address',
              react: VerificationEmail({
                otp: res.data.properties?.email_otp,
                isPasswordReset: !!isPasswordReset,
              }),
            });
          } else {
            throw new Error(res.error?.message);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          return NextResponse.json(
            { data: null, error: { message: error.message, code: error.code } },
            { status: 400 }
          );
        }

        break;

      case 'welcome':
        const dashboardUrl = origin
          ? `${origin}/dashboard`
          : `${new URL(request.url).origin}/dashboard`;

        data = await resend.emails.send({
          from: 'PlaciaGH <welcome@mrshadrack.com>',
          to: email,
          subject: 'Welcome to PlaciaGH!',
          react: WelcomeEmail({
            userEmail: email,
            dashboardUrl,
          }),
        });
        break;

      case 'password-reset-confirmation':
        const loginUrl = origin
          ? `${origin}/auth/login`
          : `${new URL(request.url).origin}/auth/login`;

        data = await resend.emails.send({
          from: 'PlaciaGH <auth@mrshadrack.com>',
          to: email,
          subject: 'Your password has been reset',
          react: PasswordResetConfirmationEmail({
            userEmail: email,
            loginUrl,
          }),
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
