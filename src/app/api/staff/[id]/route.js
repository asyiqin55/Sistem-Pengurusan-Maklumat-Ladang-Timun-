import { sql } from '@/lib/database';
import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/utils/rbac';


// GET /api/staff/:id - Fetch a single staff member
export const GET = withAdminAuth(async function(request, { params }) {
  const { id } = params;
  try {
    const staffMembers = await sql`
      SELECT * FROM "Staff" WHERE id = ${parseInt(id, 10)}
    `;

    if (staffMembers.length === 0) {
      return NextResponse.json({ error: 'Staf tidak ditemui.' }, { status: 404 });
    }
    return NextResponse.json(staffMembers[0]);

  } catch (error) {
    console.error(`Error fetching staff ${id}:`, error);
    return NextResponse.json(
      { error: 'Gagal mendapatkan data staf.', details: error.message },
      { status: 500 }
    );
  }
});

// PUT /api/staff/:id - Update a staff member
export const PUT = withAdminAuth(async function(request, { params }) {
  const { id } = params;
  try {
    const data = await request.json();
    
     // Basic validation
     if (!data.staffId || !data.name || !data.idNumber || !data.email || !data.position || data.salary == null) {
      return NextResponse.json(
        { error: 'Maklumat staf tidak lengkap.' }, 
        { status: 400 }
      );
    }

    const salaryFloat = parseFloat(data.salary);
    if (isNaN(salaryFloat)) {
       return NextResponse.json(
        { error: 'Gaji mesti dalam format nombor.' },
        { status: 400 }
      );
    }

    const updatedStaffResult = await sql`
      UPDATE "Staff" SET
        "staffId" = ${data.staffId},
        name = ${data.name},
        "idNumber" = ${data.idNumber},
        gender = ${data.gender},
        email = ${data.email},
        phone = ${data.phone},
        position = ${data.position},
        salary = ${salaryFloat},
        status = ${data.status},
        "joinDate" = ${data.joinDate ? new Date(data.joinDate) : null},
        "updatedAt" = NOW()
      WHERE id = ${parseInt(id, 10)}
      RETURNING *
    `;
    
    if (updatedStaffResult.length === 0) {
      return NextResponse.json({ error: 'Staf tidak ditemui untuk dikemaskini.' }, { status: 404 });
    }
    
    const updatedStaff = updatedStaffResult[0];
    return NextResponse.json(updatedStaff);

  } catch (error) {
    console.error(`Error updating staff ${id}:`, error);
    // Handle potential unique constraint errors 
    if (error.code === '23505') {
       return NextResponse.json(
        { error: `Staf dengan maklumat tersebut sudah wujud.` },
        { status: 409 } 
      );
    }
    return NextResponse.json(
      { error: 'Gagal mengemaskini data staf.', details: error.message },
      { status: 500 }
    );
  }
});

// DELETE /api/staff/:id - Delete a staff member
export const DELETE = withAdminAuth(async function(request, { params }) {
  const { id } = params;
  try {
    const deleteResult = await sql`
      DELETE FROM "Staff" WHERE id = ${parseInt(id, 10)}
    `;
    
    if (deleteResult.count === 0) {
      return NextResponse.json({ error: 'Staf tidak ditemui untuk dipadam.' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 }); 

  } catch (error) {
    console.error(`Error deleting staff ${id}:`, error);
    // Handle potential foreign key constraints if staff is linked elsewhere
    if (error.code === '23503') {
      return NextResponse.json({ error: 'Tidak boleh memadam staf kerana masih terdapat rekod berkaitan.' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Gagal memadam staf.', details: error.message },
      { status: 500 }
    );
  }
});