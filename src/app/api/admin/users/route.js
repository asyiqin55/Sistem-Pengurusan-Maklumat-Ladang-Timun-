import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/utils/rbac';
import { sql } from '@/lib/database';
import bcrypt from 'bcryptjs';

export const GET = withAdminAuth(async function(request) {
               console.log('[ADMIN USERS API] Starting GET request');
               
               try {
                 console.log('[ADMIN USERS API] Fetching users from database with staff data');
                 const users = await sql`
                   SELECT 
                     u.*,
                     s.id as "staff_id", s."staffId" as "staff_staffId", s.name as "staff_name",
                     s."idNumber" as "staff_idNumber", s.gender as "staff_gender", s.email as "staff_email",
                     s.phone as "staff_phone", s.position as "staff_position", s.salary as "staff_salary",
                     s.status as "staff_status", s."joinDate" as "staff_joinDate", s."userId" as "staff_userId",
                     s."createdAt" as "staff_createdAt", s."updatedAt" as "staff_updatedAt"
                   FROM "User" u
                   LEFT JOIN "Staff" s ON u.id = s."userId"
                   ORDER BY u."createdAt" DESC
                 `;
                 
                 console.log('[ADMIN USERS API] Users fetched from database:', {
                   totalUsers: users.length,
                   usersWithStaff: users.filter(u => u.staff_id).length,
                   usersWithoutStaff: users.filter(u => !u.staff_id).length
                 });
                 
                 // Remove password from response and transform staff data
                 const usersWithoutPassword = users.map(user => {
                   const { password, staff_id, staff_staffId, staff_name, staff_idNumber, staff_gender, 
                           staff_email, staff_phone, staff_position, staff_salary, staff_status, 
                           staff_joinDate, staff_userId, staff_createdAt, staff_updatedAt, ...userWithoutPassword } = user;
                   
                   return {
                     ...userWithoutPassword,
                     staff: staff_id ? {
                       id: staff_id,
                       staffId: staff_staffId,
                       name: staff_name,
                       idNumber: staff_idNumber,
                       gender: staff_gender,
                       email: staff_email,
                       phone: staff_phone,
                       position: staff_position,
                       salary: staff_salary,
                       status: staff_status,
                       joinDate: staff_joinDate,
                       userId: staff_userId,
                       createdAt: staff_createdAt,
                       updatedAt: staff_updatedAt
                     } : null
                   };
                 });
                 
                 console.log('[ADMIN USERS API] Response prepared successfully');
                 return NextResponse.json(usersWithoutPassword);
                 
               } catch (error) {
                 console.error('[ADMIN USERS API] Error in GET request:', {
                   message: error.message,
                   stack: error.stack,
                   code: error.code
                 });
                 return NextResponse.json(
                   { error: "Gagal mendapatkan data pengguna.", details: error.message },
                   { status: 500 }
                 );
               }
             });

export const POST = withAdminAuth(async function(request) {
               console.log('[ADMIN USERS API] Starting POST request');
               
               try {
                 const data = await request.json();
                 console.log('[ADMIN USERS API] Request data received:', {
                   username: data.username,
                   email: data.email,
                   role: data.role
                 });
             
                 // Enhanced validation
                 if (!data.username || !data.email || !data.password || !data.role) {
                   console.log('[ADMIN USERS API] Validation failed - missing required fields');
                   return NextResponse.json(
                     { error: 'Maklumat pengguna tidak lengkap. Nama pengguna, email, kata laluan dan peranan diperlukan.' }, 
                     { status: 400 }
                   );
                 }
                 
                 // Username validation
                 if (data.username.trim().length < 3) {
                   return NextResponse.json(
                     { error: 'Nama pengguna mesti sekurang-kurangnya 3 aksara.' },
                     { status: 400 }
                   );
                 }
                 
                 if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
                   return NextResponse.json(
                     { error: 'Nama pengguna hanya boleh mengandungi huruf, nombor dan underscore (_).' },
                     { status: 400 }
                   );
                 }
                 
                 // Email validation
                 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                 if (!emailRegex.test(data.email)) {
                   return NextResponse.json(
                     { error: 'Format email tidak sah.' },
                     { status: 400 }
                   );
                 }
                 
                 // Password validation
                 if (data.password.length < 6) {
                   return NextResponse.json(
                     { error: 'Kata laluan mesti sekurang-kurangnya 6 aksara.' },
                     { status: 400 }
                   );
                 }
             
                 // Validate role
                 const validRoles = ['admin', 'staff', 'worker'];
                 if (!validRoles.includes(data.role)) {
                   console.log('[ADMIN USERS API] Invalid role provided:', data.role);
                   return NextResponse.json(
                     { error: 'Peranan tidak sah. Pilih antara admin, staff, atau worker.' }, 
                     { status: 400 }
                   );
                 }
                          
                 console.log('[ADMIN USERS API] Validation passed, checking for existing users');
                 
                 // Check for existing users with same username or email
                 const existingUsers = await sql`
                   SELECT id, username, email FROM "User" 
                   WHERE username = ${data.username} OR email = ${data.email}
                 `;
                 
                 if (existingUsers.length > 0) {
                   const existingUser = existingUsers[0];
                   console.log('[ADMIN USERS API] Found existing user:', {
                     id: existingUser.id,
                     username: existingUser.username,
                     email: existingUser.email
                   });
                   
                   if (existingUser.username === data.username) {
                     return NextResponse.json(
                       { error: `Nama pengguna '${data.username}' sudah wujud.` },
                       { status: 409 }
                     );
                   }
                   if (existingUser.email === data.email) {
                     return NextResponse.json(
                       { error: `Email '${data.email}' sudah digunakan.` },
                       { status: 409 }
                     );
                   }
                 }
                 
                 console.log('[ADMIN USERS API] No existing users found, hashing password');
                 // Hash password
                 const hashedPassword = await bcrypt.hash(data.password, 12);
             
                 // Create user account only
                 console.log('[ADMIN USERS API] Creating user account');
                 
                 const newUserResult = await sql`
                   INSERT INTO "User" (username, email, password, role, status, "createdAt", "updatedAt")
                   VALUES (${data.username}, ${data.email}, ${hashedPassword}, ${data.role}, ${data.status || 'active'}, NOW(), NOW())
                   RETURNING *
                 `;
                 
                 const newUser = newUserResult[0];
                 console.log('[ADMIN USERS API] User account created successfully:', {
                   id: newUser.id,
                   username: newUser.username,
                   role: newUser.role
                 });
             
                 // Return user without password
                 const { password, ...userWithoutPassword } = newUser;
                 return NextResponse.json(userWithoutPassword, { status: 201 });
             
               } catch (error) {
                 console.error('[ADMIN USERS API] Error in POST request:', {
                   message: error.message,
                   code: error.code,
                   constraint: error.constraint,
                   stack: error.stack
                 });
                 
                 // Handle unique constraint errors
                 if (error.code === '23505') {
                   console.log('[ADMIN USERS API] Unique constraint violation:', error.constraint);
                   
                   if (error.constraint?.includes('username') || error.message?.includes('username')) {
                     return NextResponse.json(
                       { error: `Nama pengguna '${data.username}' sudah wujud.` },
                       { status: 409 }
                     );
                   }
                   if (error.constraint?.includes('email') || error.message?.includes('email')) {
                     return NextResponse.json(
                       { error: `Email '${data.email}' sudah digunakan.` },
                       { status: 409 }
                     );
                   }
                 }
                 
                 return NextResponse.json(
                   { error: 'Gagal mencipta pengguna.', details: error.message },
                   { status: 500 }
                 );
               }
             });
;

