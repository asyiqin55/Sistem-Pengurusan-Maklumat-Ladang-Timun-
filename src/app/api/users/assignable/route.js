import { NextResponse } from 'next/server';
import { withAuthenticatedUser } from '@/utils/rbac';
import { sql } from '@/lib/database';

export const GET = withAuthenticatedUser(async function(request) {
  try {
    // Get all active users that can be assigned tasks (staff and worker roles)
    const assignableUsers = await sql`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        s.name as "staff_name",
        s.position as "staff_position"
      FROM "User" u
      LEFT JOIN "Staff" s ON u.id = s."userId"
      WHERE u.status = 'active' 
        AND u.role IN ('staff', 'worker')
      ORDER BY u.role DESC, u.username ASC
    `;

    // Transform the data to include display names
    const transformedUsers = assignableUsers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      staffName: user.staff_name,
      staffPosition: user.staff_position,
      displayName: user.staff_name 
        ? `${user.staff_name} (${user.username})` 
        : user.username
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Error fetching assignable users:', error);
    return NextResponse.json(
      { error: 'Gagal mendapatkan senarai pekerja yang boleh ditugaskan.', details: error.message },
      { status: 500 }
    );
  }
});