import { NextResponse } from 'next/server';
import { withAuthenticatedUser } from '@/utils/rbac';
import { sql } from '@/lib/database';

export const GET = withAuthenticatedUser(async function(request) {
  try {
    // Get all crops that can have tasks assigned (active crops)
    const assignablePlots = await sql`
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
      WHERE c.status IN ('Ditanam', 'Sedang Tumbuh', 'Siap Dituai', 'Aktif', 'Penuaian', 'Selesai')
      ORDER BY c."plotId" ASC
    `;

    // Transform the data to include display names and additional info
    const transformedPlots = assignablePlots.map(plot => ({
      id: plot.id,
      plotId: plot.plotId,
      cropType: plot.cropType,
      status: plot.status,
      plantingDate: plot.plantingDate,
      size: plot.calculatedSize,
      assignedTo: plot.assigned_username,
      displayName: `${plot.plotId} - ${plot.cropType || 'Timun'} (${plot.calculatedSize}m²)`,
      statusInfo: `${plot.status} - Ditanam: ${new Date(plot.plantingDate).toLocaleDateString('ms-MY')}`
    }));

    return NextResponse.json(transformedPlots);
  } catch (error) {
    console.error('Error fetching assignable plots:', error);
    return NextResponse.json(
      { error: 'Gagal mendapatkan senarai plot yang boleh ditugaskan.', details: error.message },
      { status: 500 }
    );
  }
});