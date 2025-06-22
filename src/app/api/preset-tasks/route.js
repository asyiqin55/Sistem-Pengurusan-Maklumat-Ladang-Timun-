import { NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import { withAuthenticatedUser, withAdminAuth } from '@/utils/rbac';

export const GET = withAuthenticatedUser(async function(request) {
  try {
    const presetTasks = await sql`
      SELECT * FROM "PresetTask" ORDER BY "createdAt" DESC
    `;
    return NextResponse.json(presetTasks);
  } catch (error) {
    console.error("Error fetching preset tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch preset tasks.", details: error.message },
      { status: 500 }
    );
  }
});

export const POST = withAdminAuth(async function(request) {
  try {
    const data = await request.json();
    
    // Basic validation
    if (!data.name || !data.description) {
      return NextResponse.json(
        { error: "Name and description are required." }, 
        { status: 400 }
      );
    }

    // Generate unique taskId in format TSK001, TSK002, etc.
    const lastPresetTaskResult = await sql`
      SELECT "taskId" FROM "PresetTask" ORDER BY "taskId" DESC LIMIT 1
    `;
    
    const lastPresetTask = lastPresetTaskResult.length > 0 ? lastPresetTaskResult[0] : null;

    let nextNumber = 1;
    if (lastPresetTask && lastPresetTask.taskId) {
      // Extract number from last taskId (e.g., "TSK001" -> 1)
      const lastNumber = parseInt(lastPresetTask.taskId.replace('TSK', ''), 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Format number to 3 digits with leading zeros
    const taskId = `TSK${nextNumber.toString().padStart(3, '0')}`;

    // Check if taskId already exists (extra safety)
    const existingTasks = await sql`
      SELECT id FROM "PresetTask" WHERE "taskId" = ${taskId}
    `;

    if (existingTasks.length > 0) {
      return NextResponse.json(
        { error: "Generated task ID already exists. Please try again." },
        { status: 409 }
      );
    }

    const newPresetTaskResult = await sql`
      INSERT INTO "PresetTask" (
        "taskId", name, description, "createdAt", "updatedAt"
      ) VALUES (
        ${taskId}, ${data.name}, ${data.description}, NOW(), NOW()
      ) RETURNING *
    `;
    
    const newPresetTask = newPresetTaskResult[0];

    return NextResponse.json(newPresetTask, { status: 201 });

  } catch (error) {
    console.error("Error creating preset task:", error);
    
    // Handle unique constraint errors
    if (error.code === '23505' && error.constraint?.includes('taskId')) {
      return NextResponse.json(
        { error: "Task ID already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create preset task.", details: error.message },
      { status: 500 }
    );
  }
});