import { NextResponse } from 'next/server';

const ALLOWED_ADMINS = [
  'akmaladnan009@gmail.com',
  'dummy@seeport.com',
];

/**
 * Validates a Supabase JWT Bearer token from request headers.
 * Returns { valid: true, email } or { valid: false, error }
 */
export async function validateAdminToken(request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or malformed Authorization header' };
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return { valid: false, error: 'No token provided' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { valid: false, error: 'Server auth configuration missing' };
  }

  try {
    // Verify token against Supabase auth
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseServiceRoleKey,
      },
    });

    if (!response.ok) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    const user = await response.json();
    const email = user?.email;

    if (!email || !ALLOWED_ADMINS.includes(email)) {
      return { valid: false, error: 'Unauthorized — admin access only' };
    }

    return { valid: true, email };
  } catch (err) {
    return { valid: false, error: 'Token validation failed: ' + err.message };
  }
}

/**
 * Returns a 401 Unauthorized response.
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}
