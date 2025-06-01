import { createClient } from '@/lib/supabase/client';
import { User } from '@/types/user';
import { z } from 'zod';

export const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export type AuthError = {
  message: string;
  code?: string;
};

export async function signUp({ email, password, fullName }: SignUpFormData) {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'verification',
        email,
        password,
        full_name: fullName,
        role: 'user',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || 'Failed to send verification email'
      );
    }

    // Store email temporarily for OTP verification
    sessionStorage.setItem('verifying_email', email);
    sessionStorage.setItem('verifying_password', password);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
}

export async function verifyOTP(
  email: string,
  otp: string,
  isPasswordReset: boolean
) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) throw error;

    // Clear verification data from session storage
    sessionStorage.removeItem('verifying_email');
    sessionStorage.removeItem('verifying_password');
    sessionStorage.removeItem('resetting_email');

    await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: isPasswordReset ? 'password-reset-confirmation' : 'welcome',
        email,
      }),
    });

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
}

export async function signIn({ email, password }: LoginFormData) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
}

export async function signInWithGoogle() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
}

export async function resetPassword(email: string) {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'verification',
        email,
        isPasswordReset: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send reset email');
    }

    sessionStorage.setItem('resetting_email', email);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
}

export async function updatePassword(password: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;

    // Clear reset email from session storage
    sessionStorage.removeItem('resetting_email');

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as AuthError };
  }
}

export async function signOut() {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as AuthError };
  }
}

export async function getSession() {
  try {
    const supabase = createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    return { session: null, error: error as AuthError };
  }
}

export async function getUser(): Promise<{
  user: User | null;
  error: AuthError | null;
}> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;

    if (!user) {
      return { user: null, error: null };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;

    return { user: userData as User, error: null };
  } catch (error) {
    return { user: null, error: error as AuthError };
  }
}
