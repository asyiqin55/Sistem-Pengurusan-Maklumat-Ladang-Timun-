import { NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Find user by username
    const users = await sql`
      SELECT id, username, password, role, status
      FROM "User" 
      WHERE username = ${username}
    `;
    
    const user = users.length > 0 ? users[0] : null;

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Account is inactive' },
        { status: 403 }
      );
    }

    // Update last login
    await sql`
      UPDATE "User" SET
        "lastLogin" = NOW(),
        "updatedAt" = NOW()
      WHERE id = ${user.id}
    `;

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (caughtError) {
    // Log the error appropriately
    if (caughtError instanceof Error) {
      console.error('Login error:', caughtError.message);
      if (caughtError.stack) {
        console.error('Stack trace:', caughtError.stack);
      }
    } else {
      const message = 'Login error: An unexpected issue occurred.';
      const details = (caughtError !== undefined && caughtError !== null) ? String(caughtError) : 'The caught error object was null or undefined.';
      console.error(message, details);
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}