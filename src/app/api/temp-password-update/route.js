import { NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import bcrypt from 'bcryptjs';

// GET - Fetch all users for selection
export const GET = async function(request) {
  try {
    const users = await sql`
      SELECT 
        u.id, u.username, u.email, u.role, u.status,
        s.name as "staff_name", s."staffId" as "staff_staffId"
      FROM "User" u
      LEFT JOIN "Staff" s ON u.id = s."userId"
      ORDER BY u.username ASC
    `;
    
    // Transform the results to match the expected structure
    const transformedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      staff: user.staff_name ? {
        name: user.staff_name,
        staffId: user.staff_staffId
      } : null
    }));
    
    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Gagal mendapatkan data pengguna.", details: error.message },
      { status: 500 }
    );
  }
};

// PUT - Update user password
export const PUT = async function(request) {
  try {
    const data = await request.json();

    // Basic validation
    if (!data.userId || !data.newPassword) {
      return NextResponse.json(
        { error: 'ID Pengguna dan kata laluan baru diperlukan.' }, 
        { status: 400 }
      );
    }

    // Validate password length
    if (data.newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.' }, 
        { status: 400 }
      );
    }

    // Check if user exists
    const users = await sql`
      SELECT id, username FROM "User" WHERE id = ${parseInt(data.userId, 10)}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemui.' }, 
        { status: 404 }
      );
    }
    
    const user = users[0];

    // Hash the new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 12);

    // Update the password
    await sql`
      UPDATE "User" SET
        password = ${hashedPassword},
        "updatedAt" = NOW()
      WHERE id = ${parseInt(data.userId, 10)}
    `;

    return NextResponse.json({ 
      success: true, 
      message: `Kata laluan untuk pengguna '${user.username}' telah berjaya dikemaskini.` 
    });

  } catch (error) {
    console.error('Error updating password:', error);
    
    return NextResponse.json(
      { error: 'Gagal mengemaskini kata laluan.', details: error.message },
      { status: 500 }
    );
  }
};