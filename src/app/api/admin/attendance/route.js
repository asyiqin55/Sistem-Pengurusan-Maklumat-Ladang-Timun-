import { sql } from '@/lib/database';
import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/utils/rbac';

// GET /api/admin/attendance - Admin view of all attendance records
export const GET = withAdminAuth(async function(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const staffId = searchParams.get('staffId');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    let whereConditions = [];
    let queryParams = [];
    
    if (startDate && endDate) {
      whereConditions.push('a.date >= $' + (queryParams.length + 1));
      queryParams.push(new Date(startDate));
      whereConditions.push('a.date <= $' + (queryParams.length + 1));
      queryParams.push(new Date(endDate));
    } else if (startDate) {
      whereConditions.push('a.date >= $' + (queryParams.length + 1));
      queryParams.push(new Date(startDate));
    } else if (endDate) {
      whereConditions.push('a.date <= $' + (queryParams.length + 1));
      queryParams.push(new Date(endDate));
    }

    if (staffId && !isNaN(parseInt(staffId))) {
      whereConditions.push('a."staffId" = $' + (queryParams.length + 1));
      queryParams.push(parseInt(staffId));
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get attendance records with pagination
    const attendanceQuery = `
      SELECT 
        a.*,
        s.id as "staff_id", s."staffId" as "staff_staffId", s.name as "staff_name", s.position as "staff_position",
        u.username as "staff_user_username", u.email as "staff_user_email"
      FROM "Attendance" a
      LEFT JOIN "Staff" s ON a."staffId" = s.id
      LEFT JOIN "User" u ON s."userId" = u.id
      ${whereClause}
      ORDER BY a.date DESC, a."punchInTime" DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as count
      FROM "Attendance" a
      ${whereClause}
    `;
    
    const [attendanceRecords, totalCountResult] = await Promise.all([
      sql.unsafe(attendanceQuery, [...queryParams, limit, skip]),
      sql.unsafe(countQuery, queryParams)
    ]);
    
    const totalCount = parseInt(totalCountResult[0].count);

    // Calculate working hours for each record and transform staff data
    const attendanceWithHours = attendanceRecords.map(record => {
      let workingHours = null;
      if (record.punchInTime && record.punchOutTime) {
        const punchIn = new Date(record.punchInTime);
        const punchOut = new Date(record.punchOutTime);
        const diffMs = punchOut - punchIn;
        workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimal places
      }
      
      const { staff_id, staff_staffId, staff_name, staff_position, staff_user_username, staff_user_email, ...attendanceData } = record;

      return {
        ...attendanceData,
        workingHours,
        staff: staff_id ? {
          id: staff_id,
          staffId: staff_staffId,
          name: staff_name,
          position: staff_position,
          user: {
            username: staff_user_username,
            email: staff_user_email
          }
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      data: attendanceWithHours,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Admin attendance fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/admin/attendance/summary - Get attendance summary statistics
export const POST = withAdminAuth(async function(request) {
  try {
    const body = await request.json();
    const { startDate, endDate } = body;

    let whereConditions = [];
    let queryParams = [];
    
    if (startDate && endDate) {
      whereConditions.push('date >= $1');
      whereConditions.push('date <= $2');
      queryParams.push(new Date(startDate), new Date(endDate));
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get summary statistics
    const totalAttendanceQuery = `SELECT COUNT(*) as count FROM "Attendance" ${whereClause}`;
    const completedAttendanceQuery = `SELECT COUNT(*) as count FROM "Attendance" ${whereClause ? whereClause + ' AND' : 'WHERE'} "punchOutTime" IS NOT NULL`;
    const staffListQuery = `SELECT id, "staffId", name, position FROM "Staff" WHERE status = 'active'`;
    
    const [
      totalAttendanceResult,
      completedAttendanceResult,
      staffList
    ] = await Promise.all([
      sql.unsafe(totalAttendanceQuery, queryParams),
      sql.unsafe(completedAttendanceQuery, queryParams),
      sql`SELECT id, "staffId", name, position FROM "Staff" WHERE status = 'active'`
    ]);
    
    const totalAttendance = parseInt(totalAttendanceResult[0].count);
    const completedAttendance = parseInt(completedAttendanceResult[0].count);

    // Calculate average working hours for completed attendance
    const completedRecordsQuery = `
      SELECT "punchInTime", "punchOutTime" 
      FROM "Attendance" 
      ${whereClause ? whereClause + ' AND' : 'WHERE'} "punchOutTime" IS NOT NULL
    `;
    
    const completedRecords = await sql.unsafe(completedRecordsQuery, queryParams);

    let averageWorkingHours = 0;
    if (completedRecords.length > 0) {
      const totalHours = completedRecords.reduce((sum, record) => {
        const punchIn = new Date(record.punchInTime);
        const punchOut = new Date(record.punchOutTime);
        const hours = (punchOut - punchIn) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      averageWorkingHours = Math.round((totalHours / completedRecords.length) * 100) / 100;
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalAttendance,
        completedAttendance,
        incompleteAttendance: totalAttendance - completedAttendance,
        averageWorkingHours,
        totalStaff: staffList.length
      },
      staffList
    });

  } catch (error) {
    console.error('Admin attendance summary error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
});