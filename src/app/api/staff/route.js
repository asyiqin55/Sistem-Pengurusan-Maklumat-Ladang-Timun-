import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/utils/rbac';
import { sql } from '@/lib/database';
import bcrypt from 'bcryptjs';

export const GET = withAdminAuth(async function(request) {
               console.log('[STAFF API] Starting GET request');
               
               try {
                 const { searchParams } = new URL(request.url);
                 const action = searchParams.get('action');
                 
                 // Handle request for users without staff records
                 if (action === 'users-without-staff') {
                   console.log('[STAFF API] Fetching users without staff records');
                   const usersWithoutStaff = await sql`
                     SELECT 
                       u.id,
                       u.username,
                       u.email,
                       u.role,
                       u.status,
                       u."createdAt"
                     FROM "User" u
                     LEFT JOIN "Staff" s ON u.id = s."userId"
                     WHERE s."userId" IS NULL
                       AND u.role IN ('staff', 'worker')
                       AND u.status = 'active'
                     ORDER BY u."createdAt" DESC
                   `;
                   
                   console.log('[STAFF API] Users without staff records found:', {
                     count: usersWithoutStaff.length
                   });
                   
                   return NextResponse.json(usersWithoutStaff);
                 }
                 
                 // Default: fetch staff list with user data
                 console.log('[STAFF API] Fetching staff from database with user data');
                 const staff = await sql`
                   SELECT 
                     s.*,
                     u.id as "user_id", u.username, u.email as "user_email", u.role as "user_role", u.status as "user_status"
                   FROM "Staff" s
                   LEFT JOIN "User" u ON s."userId" = u.id
                   ORDER BY s."createdAt" DESC
                 `;
                 
                 console.log('[STAFF API] Staff fetched from database:', {
                   totalStaff: staff.length,
                   staffWithUsers: staff.filter(s => s.user_id).length,
                   staffWithoutUsers: staff.filter(s => !s.user_id).length
                 });
                 
                 // Transform the data to include user information
                 const staffWithUserInfo = staff.map(staffMember => {
                   const { user_id, username, user_email, user_role, user_status, ...staffData } = staffMember;
                   
                   return {
                     ...staffData,
                     hasUserAccount: !!user_id,
                     user: user_id ? {
                       id: user_id,
                       username,
                       email: user_email,
                       role: user_role,
                       status: user_status
                     } : null
                   };
                 });
                 
                 console.log('[STAFF API] Response prepared successfully');
                 return NextResponse.json(staffWithUserInfo);
                 
               } catch (error) {
                 console.error('[STAFF API] Error in GET request:', {
                   message: error.message,
                   stack: error.stack,
                   code: error.code
                 });
                 return NextResponse.json(
                   { error: "Gagal mendapatkan data staf.", details: error.message }, 
                   { status: 500 }
                 );
               }
             });
;

// POST /api/staff - Handle staff creation only
export const POST = withAdminAuth(async function(request) {
  console.log('[STAFF API] Starting POST request');
  
  try {
    const data = await request.json();
    console.log('[STAFF API] Request data received:', {
      staffId: data.staffId,
      name: data.name,
      position: data.position,
      email: data.email,
      action: data.action
    });
    
    // Staff API now only handles staff creation - no user account creation
    return await createNewStaff(data);

  } catch (error) {
    console.error('Error in staff POST handler:', error);
    return NextResponse.json(
      { error: 'Gagal memproses permintaan.', details: error.message },
      { status: 500 }
    );
  }
});

// Function to create new staff member
async function createNewStaff(data) {
  console.log('[STAFF API] Starting createNewStaff function');
  
  // Enhanced validation for staff creation
  const requiredFields = ['name', 'idNumber', 'gender', 'email', 'phone', 'salary'];
  
  // Add userId validation for new workflow
  if (data.action === 'create-staff-with-user' && !data.userId) {
    return NextResponse.json(
      { error: 'Pengguna mesti dipilih untuk mengaitkan rekod kakitangan.' },
      { status: 400 }
    );
  }
  
  const missingFields = requiredFields.filter(field => !data[field] || String(data[field]).trim() === '');
  
  console.log('[STAFF API] Validating required fields:', {
    requiredFields,
    missingFields,
    hasAllFields: missingFields.length === 0,
    action: data.action,
    userId: data.userId
  });
  
  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: `Maklumat tidak lengkap. Medan berikut diperlukan: ${missingFields.join(', ')}` },
      { status: 400 }
    );
  }
  
  // Name validation
  if (data.name.trim().length < 2) {
    return NextResponse.json(
      { error: 'Nama mesti sekurang-kurangnya 2 aksara.' },
      { status: 400 }
    );
  }
  
  // IC Number validation (Malaysian IC format)
  const icPattern = /^\d{6}[\s-]?\d{2}[\s-]?\d{4}$/;
  if (!icPattern.test(data.idNumber.replace(/\s/g, ''))) {
    return NextResponse.json(
      { error: 'Format nombor IC tidak sah. Contoh format yang betul: 900101-01-1234' },
      { status: 400 }
    );
  }
  
  // Phone validation (Malaysian phone format)
  const phonePattern = /^(\+?6?01[0-9][\s-]?\d{3}[\s-]?\d{4}|\+?6?0[2-9][\s-]?\d{3}[\s-]?\d{4})$/;
  if (!phonePattern.test(data.phone.replace(/\s/g, ''))) {
    return NextResponse.json(
      { error: 'Format nombor telefon tidak sah. Contoh: 013-1234567' },
      { status: 400 }
    );
  }

  // Validate gender
  if (!['Lelaki', 'Perempuan'].includes(data.gender)) {
    return NextResponse.json(
      { error: 'Jantina tidak sah. Pilih antara Lelaki atau Perempuan.' },
      { status: 400 }
    );
  }

  // Enhanced salary validation
  const salary = parseFloat(data.salary);
  if (isNaN(salary) || salary < 0) {
    return NextResponse.json(
      { error: 'Gaji mesti berupa nombor positif.' },
      { status: 400 }
    );
  }
  if (salary > 100000) {
    return NextResponse.json(
      { error: 'Gaji tidak boleh melebihi RM 100,000.' },
      { status: 400 }
    );
  }

  // Enhanced email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return NextResponse.json(
      { error: 'Format email tidak sah.' },
      { status: 400 }
    );
  }
  
  // Position is automatically set to "Staff"
  
  // Join date validation
  if (data.joinDate) {
    const joinDate = new Date(data.joinDate);
    const today = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(today.getFullYear() + 1);
    
    if (joinDate > oneYearFromNow) {
      return NextResponse.json(
        { error: 'Tarikh mula kerja tidak boleh lebih dari 1 tahun dari sekarang.' },
        { status: 400 }
      );
    }
  }

  try {
    console.log('[STAFF API] All validations passed, creating staff record in database');
    
    // If linking with user, verify user exists and is available
    if (data.userId) {
      console.log('[STAFF API] Verifying user exists and is available for linking');
      const userCheck = await sql`
        SELECT u.id, u.username, u.email, u.role, s."userId" as existing_staff_user_id
        FROM "User" u
        LEFT JOIN "Staff" s ON u.id = s."userId"
        WHERE u.id = ${parseInt(data.userId, 10)}
      `;
      
      if (userCheck.length === 0) {
        return NextResponse.json(
          { error: 'Pengguna yang dipilih tidak wujud.' },
          { status: 400 }
        );
      }
      
      const user = userCheck[0];
      if (user.existing_staff_user_id) {
        return NextResponse.json(
          { error: 'Pengguna ini sudah mempunyai rekod kakitangan.' },
          { status: 409 }
        );
      }
      
      console.log('[STAFF API] User verification passed:', {
        userId: user.id,
        username: user.username,
        role: user.role
      });
    }
    
    // Generate unique staff ID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const generatedStaffId = `STF${timestamp}${random.toString().padStart(4, '0')}`;
    console.log('[STAFF API] Generated staff ID:', { staffId: generatedStaffId });
    
    // Normalize phone and IC numbers for storage
    const normalizedPhone = data.phone.replace(/[\s-]/g, '');
    const normalizedIdNumber = data.idNumber.replace(/[\s-]/g, '');
    
    // Create new staff member with optional user linking
    const newStaffResult = await sql`
      INSERT INTO "Staff" (
        "staffId", name, "idNumber", gender, email, phone, position, salary, 
        status, "joinDate", "userId", "createdAt", "updatedAt"
      )
      VALUES (
        ${generatedStaffId}, ${data.name.trim()}, ${normalizedIdNumber}, ${data.gender}, 
        ${data.email.toLowerCase().trim()}, ${normalizedPhone}, 'Staff', ${salary},
        ${data.status || 'active'}, ${data.joinDate || new Date().toISOString()}, 
        ${data.userId ? parseInt(data.userId, 10) : null}, NOW(), NOW()
      )
      RETURNING *
    `;

    const newStaff = newStaffResult[0];
    console.log('[STAFF API] Staff created successfully:', {
      id: newStaff.id,
      staffId: newStaff.staffId,
      name: newStaff.name,
      position: newStaff.position,
      linkedUserId: newStaff.userId
    });
    
    return NextResponse.json(newStaff, { status: 201 });

  } catch (error) {
    console.error('[STAFF API] Error creating staff in database:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      stack: error.stack
    });
    
    // Handle unique constraint errors
    if (error.code === '23505') {
      console.log('[STAFF API] Unique constraint violation detected:', error.constraint);
      if (error.constraint?.includes('staffId')) {
        return NextResponse.json(
          { error: `ID Staf '${data.staffId}' sudah wujud.` },
          { status: 409 }
        );
      }
      if (error.constraint?.includes('idNumber')) {
        return NextResponse.json(
          { error: `Nombor IC '${data.idNumber}' sudah digunakan.` },
          { status: 409 }
        );
      }
      if (error.constraint?.includes('email')) {
        return NextResponse.json(
          { error: `Email '${data.email}' sudah digunakan.` },
          { status: 409 }
        );
      }
      if (error.constraint?.includes('userId')) {
        return NextResponse.json(
          { error: 'Pengguna ini sudah mempunyai rekod kakitangan.' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Gagal mencipta rekod staf baru.', details: error.message },
      { status: 500 }
    );
  }
}


// Staff API now focuses purely on HR management - no user account operations 