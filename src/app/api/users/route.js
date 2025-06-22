import { NextResponse } from 'next/server';
import { sql } from '@/lib/database';

export async function GET() {
  try {
    const users = await sql`
      SELECT id, username 
      FROM "User" 
      WHERE status = 'active'
      ORDER BY username ASC
    `;

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 