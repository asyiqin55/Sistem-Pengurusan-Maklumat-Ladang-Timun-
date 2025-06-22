import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/utils/rbac';
import { sql } from '@/lib/database';
import bcrypt from 'bcryptjs';

export const PUT = withAdminAuth(async function(request, { params }) {
  try {
    const userId = parseInt(params.id);
    const data = await request.json();
    
    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID pengguna tidak sah.' },
        { status: 400 }
      );
    }

    // Basic validation
    if (!data.username || !data.email || !data.role) {
      return NextResponse.json(
        { error: 'Maklumat pengguna tidak lengkap. Nama pengguna, email dan peranan diperlukan.' }, 
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'staff', 'worker'];
    if (!validRoles.includes(data.role)) {
      return NextResponse.json(
        { error: 'Peranan tidak sah. Pilih antara admin, staff, atau worker.' }, 
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await sql`
      SELECT * FROM "User" WHERE id = ${userId}
    `;

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemui.' },
        { status: 404 }
      );
    }

    const result = await sql.begin(async (sql) => {
      let updateData = {
        username: data.username,
        email: data.email,
        role: data.role,
        status: data.status || 'active'
      };

      // Hash new password if provided
      if (data.password && data.password.trim() !== '') {
        updateData.password = await bcrypt.hash(data.password, 12);
      }

      // Update user
      const updatedUserResult = await sql`
        UPDATE "User" 
        SET username = ${updateData.username}, 
            email = ${updateData.email}, 
            role = ${updateData.role}, 
            status = ${updateData.status},
            ${data.password ? sql`password = ${updateData.password},` : sql``}
            "updatedAt" = NOW()
        WHERE id = ${userId}
        RETURNING *
      `;
      
      const updatedUser = updatedUserResult[0];

      // Handle staff data if role is staff or worker
      if ((data.role === 'staff' || data.role === 'worker') && data.staffData) {
        const staffData = data.staffData;
        
        // Check if staff record exists
        const existingStaff = await sql`
          SELECT * FROM "Staff" WHERE "userId" = ${userId}
        `;

        if (existingStaff.length > 0) {
          // Update existing staff record
          await sql`
            UPDATE "Staff" 
            SET name = ${staffData.name || existingStaff[0].name},
                "idNumber" = ${staffData.idNumber || existingStaff[0].idNumber},
                gender = ${staffData.gender || existingStaff[0].gender},
                email = ${data.email},
                phone = ${staffData.phone || existingStaff[0].phone},
                position = ${staffData.position || existingStaff[0].position},
                salary = ${staffData.salary !== undefined ? parseFloat(staffData.salary) : existingStaff[0].salary},
                status = ${staffData.status || existingStaff[0].status},
                "joinDate" = ${staffData.joinDate ? new Date(staffData.joinDate) : existingStaff[0].joinDate},
                "updatedAt" = NOW()
            WHERE "userId" = ${userId}
          `;
        } else if (staffData.staffId && staffData.name && staffData.idNumber) {
          // Create new staff record if complete data provided
          await sql`
            INSERT INTO "Staff" (
              "staffId", name, "idNumber", gender, email, phone, position, salary,
              status, "joinDate", "userId", "createdAt", "updatedAt"
            ) VALUES (
              ${staffData.staffId}, ${staffData.name}, ${staffData.idNumber}, ${staffData.gender || 'Not Specified'},
              ${data.email}, ${staffData.phone || 'Not Provided'}, ${staffData.position || 'Staff'}, ${parseFloat(staffData.salary) || 0},
              ${staffData.status || 'active'}, ${staffData.joinDate ? new Date(staffData.joinDate) : new Date()},
              ${userId}, NOW(), NOW()
            )
          `;
        }
      }

      return updatedUser;
    });

    // Return user without password
    const { password, ...userWithoutPassword } = result;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle unique constraint errors
    if (error.code === '23505') {
      if (error.constraint?.includes('username')) {
        return NextResponse.json(
          { error: `Nama pengguna '${data.username}' sudah wujud.` },
          { status: 409 }
        );
      }
      if (error.constraint?.includes('email')) {
        return NextResponse.json(
          { error: `Email '${data.email}' sudah digunakan.` },
          { status: 409 }
        );
      }
      if (error.constraint?.includes('staffId')) {
        return NextResponse.json(
          { error: `ID Kakitangan '${data.staffData?.staffId}' sudah wujud.` },
          { status: 409 }
        );
      }
      if (error.constraint?.includes('idNumber')) {
        return NextResponse.json(
          { error: `Nombor IC '${data.staffData?.idNumber}' sudah wujud.` },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Gagal mengemaskini pengguna.', details: error.message },
      { status: 500 }
    );
  }
});