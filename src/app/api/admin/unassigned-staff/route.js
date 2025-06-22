import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/utils/rbac';
import { sql } from '@/lib/database';

// GET /api/admin/unassigned-staff - Get staff members without user accounts
export const GET = withAdminAuth(async function(request) {
  try {
    // Get all staff members who don't have user accounts yet
    const unassignedStaff = await sql`
      SELECT 
        s.id,
        s."staffId",
        s.name,
        s."idNumber",
        s.gender,
        s.email,
        s.phone,
        s.position,
        s.salary,
        s.status,
        s."joinDate",
        s."createdAt"
      FROM "Staff" s
      WHERE s."userId" IS NULL
        AND s.status = 'active'
      ORDER BY s.name ASC
    `;

    // Transform the data to include display names
    const transformedStaff = unassignedStaff.map(staff => ({
      id: staff.id,
      staffId: staff.staffId,
      name: staff.name,
      idNumber: staff.idNumber,
      gender: staff.gender,
      email: staff.email,
      phone: staff.phone,
      position: staff.position,
      salary: staff.salary,
      status: staff.status,
      joinDate: staff.joinDate,
      createdAt: staff.createdAt,
      displayName: `${staff.name} - ${staff.staffId} (${staff.position})`
    }));

    return NextResponse.json(transformedStaff);
  } catch (error) {
    console.error('Error fetching unassigned staff:', error);
    return NextResponse.json(
      { error: 'Gagal mendapatkan senarai staf yang belum mempunyai akaun.', details: error.message },
      { status: 500 }
    );
  }
});