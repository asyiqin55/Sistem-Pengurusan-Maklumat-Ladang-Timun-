import { NextResponse } from 'next/server';
import { withAuthenticatedUser, withAdminAuth } from '@/utils/rbac';
import { sql } from '@/lib/database';

export const GET = withAuthenticatedUser(async function(request, { params }) {
  const { id } = params;
  try {
    const crops = await sql`
      SELECT 
        c.*,
        u.username as "assignedUsername",
        ROUND((c.length * c.width), 2) as "calculatedSize"
      FROM "Crop" c
      LEFT JOIN "User" u ON c."userId" = u.id
      WHERE c.id = ${parseInt(id, 10)}
    `;

    if (crops.length === 0) {
      return NextResponse.json({ error: 'Plot tanaman tidak ditemui.' }, { status: 404 });
    }
    
    const crop = crops[0];
    // Add calculated plot size in readable format
    crop.plotSize = crop.calculatedSize ? `${crop.calculatedSize} m² (${crop.length}m x ${crop.width}m)` : 'N/A';
    
    return NextResponse.json(crop);

  } catch (error) {
    console.error(`Error fetching crop ${id}:`, error);
    return NextResponse.json(
      { error: 'Gagal mendapatkan data plot tanaman.', details: error.message },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async function(request, { params }) {
  const { id } = params;
  try {
    const deleteResult = await sql`
      DELETE FROM "Crop" WHERE id = ${parseInt(id, 10)}
    `;
    
    if (deleteResult.count === 0) {
      return NextResponse.json({ error: 'Plot tanaman tidak ditemui untuk dipadam.' }, { status: 404 });
    }
    // Return a success response, often no content is needed
    return new NextResponse(null, { status: 204 }); 

  } catch (error) {
    console.error(`Error deleting crop ${id}:`, error);
    // Handle potential foreign key constraint errors if tasks depend on this crop
    if (error.code === '23503') { // Foreign key constraint failed on the field
       return NextResponse.json(
        { error: 'Tidak boleh memadam plot ini kerana ia mempunyai tugasan berkaitan.' }, 
        { status: 409 } // Conflict
      );
    }
    return NextResponse.json(
      { error: 'Gagal memadam plot tanaman.', details: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async function(request, { params }) {
  const { id } = params;
  try {
    const data = await request.json();
    
    // Basic validation (add more as needed)
     if (!data.plotId || !data.status || !data.plantingDate || !data.length || !data.width) {
      return NextResponse.json(
        { error: 'Maklumat plot tidak lengkap. ID Plot, Status, Tarikh Penanaman, Panjang dan Lebar diperlukan.' }, 
        { status: 400 }
      );
    }

    const userIdInt = data.userId ? parseInt(data.userId, 10) : null;
    if (data.userId && isNaN(userIdInt)) {
      return NextResponse.json(
        { error: 'ID Pengguna tidak sah.' }, 
        { status: 400 }
      );
    }

    const updatedCropResult = await sql`
      UPDATE "Crop" SET
        "plotId" = ${data.plotId},
        length = ${parseFloat(data.length)},
        width = ${parseFloat(data.width)},
        "expectedHarvestDate" = ${data.expectedHarvestDate ? new Date(data.expectedHarvestDate) : null},
        "cropType" = 'Timun',
        status = ${data.status},
        "plantingDate" = ${new Date(data.plantingDate)},
        "expectedYield" = ${data.expectedYield},
        "actualYield" = ${data.actualYield},
        notes = ${data.notes},
        "userId" = ${userIdInt},
        "updatedAt" = NOW()
      WHERE id = ${parseInt(id, 10)}
      RETURNING *
    `;
    
    if (updatedCropResult.length === 0) {
      return NextResponse.json({ error: 'Plot tanaman tidak ditemui untuk dikemaskini.' }, { status: 404 });
    }
    
    const updatedCrop = updatedCropResult[0];
    return NextResponse.json(updatedCrop);

  } catch (error) {
    console.error(`Error updating crop ${id}:`, error);
     // Handle potential unique constraint errors (e.g., plotId already exists)
    if (error.code === '23505' && error.constraint?.includes('plotId')) {
       return NextResponse.json(
        { error: `Plot ID '${data.plotId}' sudah wujud.` },
        { status: 409 } // Conflict status
      );
    }
    return NextResponse.json(
      { error: 'Gagal mengemaskini plot tanaman.', details: error.message },
      { status: 500 }
    );
  }
});