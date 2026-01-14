import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Next.js API route to handle GHL OAuth callback
 * 
 * GHL redirects to: http://localhost:3000/api/auth/oauth/callback
 * This route proxies the request to the backend: http://localhost:8000/api/auth/ghl/callback
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the incoming request
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    // Build the backend callback URL with the same query parameters
    const backendUrl = new URL(`${API_BASE_URL}/api/auth/ghl/callback`);
    if (code) backendUrl.searchParams.set('code', code);
    if (state) backendUrl.searchParams.set('state', state);

    // Forward the request to the backend
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'manual', // Don't follow redirects automatically
    });

    // If the backend returns a redirect (which it should), follow it
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        return NextResponse.redirect(location);
      }
    }

    // If no redirect, return the response
    const data = await response.text();
    return NextResponse.json(
      { error: 'Unexpected response from backend', details: data },
      { status: response.status }
    );
  } catch (error) {
    console.error('[GHL OAuth Callback] Error proxying request:', error);
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${frontendUrl}/settings?ghl_error=${encodeURIComponent(String(error))}`
    );
  }
}
