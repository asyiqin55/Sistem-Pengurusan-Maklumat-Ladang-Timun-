import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // You can add any cleanup needed here, such as:
    // - Invalidating sessions
    // - Updating last logout time
    // - Clearing tokens

    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear any cookies if you're using them
    response.cookies.delete('auth_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}