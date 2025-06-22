import { sql } from '@/lib/database';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser, withStaffAuth } from '@/utils/rbac';
import crypto from 'crypto';

// Helper function to validate staff user for attendance
async function validateStaffUser(user) {
  console.log('[ATTENDANCE API] Validating staff user:', {
    id: user?.id,
    role: user?.role,
    hasStaff: !!user?.staff,
    staffId: user?.staff?.id,
    staffStatus: user?.staff?.status
  });
  
  if (user.role !== 'staff') {
    return { error: 'Access denied. Staff role required.', status: 403 };
  }

  if (!user.staff) {
    return { error: 'No staff record found for this user', status: 403 };
  }

  if (user.staff.status !== 'active') {
    return { error: 'Staff account is inactive', status: 403 };
  }

  return { valid: true };
}

// Helper function to get current date as Date object (date only)
function getCurrentDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// POST /api/attendance - Punch In
export const POST = withStaffAuth(async function(request) {
  try {
    const { user } = request;
    console.log('[ATTENDANCE API POST] Starting punch in for user:', {
      id: user.id,
      username: user.username,
      role: user.role,
      staff: user.staff
    });
    
    // Validate staff user
    const staffValidation = await validateStaffUser(user);
    console.log('[ATTENDANCE API GET] Staff validation result:', staffValidation);
    if (staffValidation.error) {
      return NextResponse.json(
        { success: false, message: staffValidation.error },
        { status: staffValidation.status }
      );
    }

    const currentDate = getCurrentDate();
    console.log('[ATTENDANCE API] Current date:', currentDate, 'Staff ID:', user.staff?.id);

    // Check if attendance already exists for today
    const existingAttendanceResult = await sql`
      SELECT * FROM "Attendance" 
      WHERE "staffId" = ${user.staff.id} AND date = ${currentDate}
    `;
    
    const existingAttendance = existingAttendanceResult.length > 0 ? existingAttendanceResult[0] : null;
    console.log('[ATTENDANCE API POST] Existing attendance check:', {
      queryResultLength: existingAttendanceResult.length,
      existingAttendance: existingAttendance
    });

    if (existingAttendance) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Already punched in for today',
          attendance: existingAttendance
        },
        { status: 409 }
      );
    }

    // Create new attendance record
    console.log('[ATTENDANCE API POST] Creating new attendance record for staff ID:', user.staff.id);
    const punchInTime = new Date();
    const attendanceId = crypto.randomUUID();
    
    console.log('[ATTENDANCE API POST] Insert values:', {
      id: attendanceId,
      staffId: user.staff.id,
      punchInTime,
      date: currentDate
    });
    
    const newAttendanceResult = await sql`
      INSERT INTO "Attendance" (id, "staffId", "punchInTime", date, "createdAt", "updatedAt")
      VALUES (${attendanceId}, ${user.staff.id}, ${punchInTime}, ${currentDate}, NOW(), NOW())
      RETURNING *
    `;
    
    // Get the created attendance with staff info
    const attendanceWithStaff = await sql`
      SELECT 
        a.*,
        s.id as "staff_id", s."staffId" as "staff_staffId", s.name as "staff_name"
      FROM "Attendance" a
      LEFT JOIN "Staff" s ON a."staffId" = s.id
      WHERE a.id = ${newAttendanceResult[0].id}
    `;
    
    const newAttendance = {
      ...attendanceWithStaff[0],
      staff: {
        id: attendanceWithStaff[0].staff_id,
        staffId: attendanceWithStaff[0].staff_staffId,
        name: attendanceWithStaff[0].staff_name
      }
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully punched in',
        attendance: newAttendance
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Punch in error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/attendance - Fetch Today's Attendance Status
export const GET = withStaffAuth(async function(request) {
  try {
    const { user } = request;
    console.log('[ATTENDANCE API GET] Starting attendance check for user:', {
      id: user.id,
      username: user.username,
      role: user.role,
      staff: user.staff
    });
    
    // Validate staff user
    const staffValidation = await validateStaffUser(user);
    console.log('[ATTENDANCE API GET] Staff validation result:', staffValidation);
    if (staffValidation.error) {
      return NextResponse.json(
        { success: false, message: staffValidation.error },
        { status: staffValidation.status }
      );
    }

    const currentDate = getCurrentDate();
    console.log('[ATTENDANCE API] Current date:', currentDate, 'Staff ID:', user.staff?.id);

    // Find today's attendance record
    const todayAttendanceResult = await sql`
      SELECT 
        a.*,
        s.id as "staff_id", s."staffId" as "staff_staffId", s.name as "staff_name"
      FROM "Attendance" a
      LEFT JOIN "Staff" s ON a."staffId" = s.id
      WHERE a."staffId" = ${user.staff.id} AND a.date = ${currentDate}
    `;
    
    const todayAttendance = todayAttendanceResult.length > 0 ? {
      ...todayAttendanceResult[0],
      staff: {
        id: todayAttendanceResult[0].staff_id,
        staffId: todayAttendanceResult[0].staff_staffId,
        name: todayAttendanceResult[0].staff_name
      }
    } : null;
    
    console.log('[ATTENDANCE API GET] Today attendance result:', {
      queryResultLength: todayAttendanceResult.length,
      todayAttendance: todayAttendance
    });

    if (todayAttendance) {
      return NextResponse.json({
        success: true,
        punchedIn: true,
        punchedOut: !!todayAttendance.punchOutTime,
        attendance: todayAttendance
      });
    } else {
      return NextResponse.json({
        success: true,
        punchedIn: false,
        punchedOut: false,
        attendance: null
      });
    }

  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/attendance - Punch Out
export const PUT = withStaffAuth(async function(request) {
  try {
    const { user } = request;
    console.log('[ATTENDANCE API PUT] Starting punch out for user:', {
      id: user.id,
      username: user.username,
      role: user.role,
      staff: user.staff
    });
    
    // Validate staff user
    const staffValidation = await validateStaffUser(user);
    console.log('[ATTENDANCE API GET] Staff validation result:', staffValidation);
    if (staffValidation.error) {
      return NextResponse.json(
        { success: false, message: staffValidation.error },
        { status: staffValidation.status }
      );
    }

    const currentDate = getCurrentDate();
    console.log('[ATTENDANCE API] Current date:', currentDate, 'Staff ID:', user.staff?.id);

    // Find today's attendance record
    const existingAttendanceResult = await sql`
      SELECT * FROM "Attendance" 
      WHERE "staffId" = ${user.staff.id} AND date = ${currentDate}
    `;
    
    const existingAttendance = existingAttendanceResult.length > 0 ? existingAttendanceResult[0] : null;

    if (!existingAttendance) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No punch-in record found for today. Please punch in first.'
        },
        { status: 404 }
      );
    }

    if (existingAttendance.punchOutTime) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Already punched out for today',
          attendance: existingAttendance
        },
        { status: 409 }
      );
    }

    // Update attendance record with punch-out time
    const punchOutTime = new Date();
    console.log('[ATTENDANCE API PUT] Updating attendance with punch out time:', punchOutTime);
    
    await sql`
      UPDATE "Attendance" SET
        "punchOutTime" = ${punchOutTime},
        "updatedAt" = NOW()
      WHERE id = ${existingAttendance.id}
    `;
    
    // Get the updated attendance with staff info
    const updatedAttendanceResult = await sql`
      SELECT 
        a.*,
        s.id as "staff_id", s."staffId" as "staff_staffId", s.name as "staff_name"
      FROM "Attendance" a
      LEFT JOIN "Staff" s ON a."staffId" = s.id
      WHERE a.id = ${existingAttendance.id}
    `;
    
    const updatedAttendance = {
      ...updatedAttendanceResult[0],
      staff: {
        id: updatedAttendanceResult[0].staff_id,
        staffId: updatedAttendanceResult[0].staff_staffId,
        name: updatedAttendanceResult[0].staff_name
      }
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully punched out',
        attendance: updatedAttendance
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Punch out error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
});