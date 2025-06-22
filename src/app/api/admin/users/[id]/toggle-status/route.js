import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/utils/rbac';
import { sql } from '@/lib/database';

export const PATCH = withAdminAuth(async function(request, { params }) {
  try {
    const userId = parseInt(params.id);
    
    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID pengguna tidak sah.' },
        { status: 400 }
      );
    }

    // Get current user status
    const currentUser = await sql`
      SELECT id, status, username FROM "User" WHERE id = ${userId}
    `;

    if (currentUser.length === 0) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemui.' },
        { status: 404 }
      );
    }

    const newStatus = currentUser[0].status === 'active' ? 'inactive' : 'active';

    // Update user status
    const updatedUser = await sql`
      UPDATE "User" 
      SET status = ${newStatus}, "updatedAt" = NOW()
      WHERE id = ${userId}
      RETURNING id, username, email, role, status, "lastLogin", "createdAt", "updatedAt"
    `;

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'Gagal mengemaskini status pengguna.' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUser[0]);

  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: 'Ralat dalaman pelayan.', details: error.message },
      { status: 500 }
    );
  }
});