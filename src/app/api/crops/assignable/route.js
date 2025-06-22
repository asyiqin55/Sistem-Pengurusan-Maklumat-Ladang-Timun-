import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/utils/rbac';
import { sql } from '@/lib/database';

export const GET = withAdminAuth(async function(request) {
  try {
    // Get all crops that can have tasks assigned (active crops)
    const assignableCrops = await sql`
      SELECT 
        c.id,
        c."plotId",
        c."cropType",
        c.status,
        c."plantingDate",
        c.length,
        c.width,
        ROUND((c.length * c.width), 2) as "calculatedSize",
        u.username as "assigned_username"
      FROM "Crop" c
      LEFT JOIN "User" u ON c."userId" = u.id
      WHERE c.status IN ('Ditanam', 'Sedang Tumbuh', 'Siap Dituai')
      ORDER BY c."plotId" ASC
    `;

    // Transform the data to include display names and additional info
    const transformedCrops = assignableCrops.map(crop => ({
      id: crop.id,
      plotId: crop.plotId,
      cropType: crop.cropType,
      status: crop.status,
      plantingDate: crop.plantingDate,
      size: crop.calculatedSize,
      assignedTo: crop.assigned_username,
      displayName: `${crop.plotId} - ${crop.cropType || 'Timun'} (${crop.calculatedSize}m²)`,
      statusInfo: `${crop.status} - Ditanam: ${new Date(crop.plantingDate).toLocaleDateString('ms-MY')}`
    }));

    return NextResponse.json(transformedCrops);
  } catch (error) {
    console.error('Error fetching assignable crops:', error);
    return NextResponse.json(
      { error: 'Gagal mendapatkan senarai plot yang boleh ditugaskan.', details: error.message },
      { status: 500 }
    );
  }
});