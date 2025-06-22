import { NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import { withAuthenticatedUser, withAdminAuth } from '@/utils/rbac';

export const GET = withAuthenticatedUser(async function(request, { params }) {
  const { id } = params;
  try {
    const presetTasks = await sql`
      SELECT * FROM "PresetTask" WHERE id = ${parseInt(id, 10)}
    `;

    if (presetTasks.length === 0) {
      return NextResponse.json(
        { error: 'Preset task not found.' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(presetTasks[0]);

  } catch (error) {
    console.error(`Error fetching preset task ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch preset task.', details: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async function(request, { params }) {
  const { id } = params;
  try {
    const data = await request.json();
    
    // Basic validation
    if (!data.name || !data.description) {
      return NextResponse.json(
        { error: 'Name and description are required.' }, 
        { status: 400 }
      );
    }

    const updatedPresetTaskResult = await sql`
      UPDATE "PresetTask" SET
        name = ${data.name},
        description = ${data.description},
        "updatedAt" = NOW()
      WHERE id = ${parseInt(id, 10)}
      RETURNING *
    `;

    if (updatedPresetTaskResult.length === 0) {
      return NextResponse.json(
        { error: 'Preset task not found.' }, 
        { status: 404 }
      );
    }
    
    const updatedPresetTask = updatedPresetTaskResult[0];

    return NextResponse.json(updatedPresetTask);

  } catch (error) {
    console.error(`Error updating preset task ${id}:`, error);
    

    return NextResponse.json(
      { error: 'Failed to update preset task.', details: error.message },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async function(request, { params }) {
  const { id } = params;
  try {
    const deleteResult = await sql`
      DELETE FROM "PresetTask" WHERE id = ${parseInt(id, 10)}
    `;

    if (deleteResult.count === 0) {
      return NextResponse.json(
        { error: 'Preset task not found.' }, 
        { status: 404 }
      );
    }

    // Return a success response with no content
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`Error deleting preset task ${id}:`, error);
    

    return NextResponse.json(
      { error: 'Failed to delete preset task.', details: error.message },
      { status: 500 }
    );
  }
});