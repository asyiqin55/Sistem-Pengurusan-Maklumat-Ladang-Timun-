import { NextResponse } from 'next/server';
import { withAuthenticatedUser, withAdminAuth } from '@/utils/rbac';
import { sql } from '@/lib/database';

export const GET = withAuthenticatedUser(async function(request) {
  try {
    const crops = await sql`
      SELECT 
        c.*,
        u.username as "assignedUsername",
        ROUND((c.length * c.width), 2) as "calculatedSize"
      FROM "Crop" c
      LEFT JOIN "User" u ON c."userId" = u.id
      ORDER BY c."plantingDate" DESC
    `;
    
    // Add calculated plot size in readable format
    const cropsWithPlotSize = crops.map(crop => ({
      ...crop,
      plotSize: crop.calculatedSize ? `${crop.calculatedSize} m² (${crop.length}m x ${crop.width}m)` : 'N/A'
    }));
    
    return NextResponse.json(cropsWithPlotSize);
  } catch (error) {
    console.error("Error fetching crops:", error);
    return NextResponse.json(
      { error: "Gagal mendapatkan data tanaman.", details: error.message },
      { status: 500 }
    );
  }
});

export const POST = withAdminAuth(async function(request) {
  try {
    const data = await request.json();

    // Basic validation (more robust validation should be added)
    if (!data.plotId || !data.status || !data.plantingDate || !data.length || !data.width) {
      return NextResponse.json(
        { error: 'Maklumat plot tidak lengkap. ID Plot, Status, Tarikh Penanaman, Panjang dan Lebar diperlukan.' }, 
        { status: 400 }
      );
    }

    // Ensure userId is handled correctly (null or integer)
    const userIdInt = data.userId ? parseInt(data.userId, 10) : null;
    if (data.userId && isNaN(userIdInt)) {
      return NextResponse.json(
        { error: 'ID Pengguna tidak sah.' }, 
        { status: 400 }
      );
    }

    const newCropResult = await sql`
      INSERT INTO "Crop" (
        "plotId", length, width, "expectedHarvestDate", "cropType", status,
        "plantingDate", "expectedYield", "actualYield", notes, "userId",
        "createdAt", "updatedAt"
      ) VALUES (
        ${data.plotId}, ${parseFloat(data.length)}, ${parseFloat(data.width)}, 
        ${data.expectedHarvestDate ? new Date(data.expectedHarvestDate) : null}, 
        'Timun', ${data.status}, ${new Date(data.plantingDate)}, 
        ${data.expectedYield}, ${data.actualYield}, ${data.notes}, ${userIdInt},
        NOW(), NOW()
      ) RETURNING *
    `;
    
    const newCrop = newCropResult[0];

    return NextResponse.json(newCrop, { status: 201 }); // Return 201 Created status

  } catch (error) {
    console.error('Error creating crop:', error);
    // Handle potential unique constraint errors (e.g., plotId already exists)
    if (error.code === '23505' && error.constraint?.includes('plotId')) {
       return NextResponse.json(
        { error: `Plot ID '${data.plotId}' sudah wujud.` },
        { status: 409 } // Conflict status
      );
    }
    return NextResponse.json(
      { error: 'Gagal mencipta plot tanaman.', details: error.message },
      { status: 500 }
    );
  } finally {
     // Optional disconnect
     // await prisma.$disconnect();
  }
});