import { NextResponse } from 'next/server';
import { withAuthenticatedUser, withAdminAuth, canAccessTask, canModifyTaskStatus } from '@/utils/rbac';
import { sql } from '@/lib/database';

export const GET = withAuthenticatedUser(async function(request) {
  try {
    const { user } = request;
    console.log('[API Tasks GET] Request from user:', {
      id: user.id,
      username: user.username,
      role: user.role
    });
    
    // Build where clause based on user role
    const where = {};
    if (user.role === 'staff') {
      // Staff can only see tasks assigned to them
      where.userId = user.id;
      console.log('[API Tasks GET] Staff user - filtering by userId:', user.id);
    } else {
      console.log('[API Tasks GET] Admin user - fetching all tasks');
    }
    // Admin can see all tasks (no where clause needed)

    let tasks;
    if (user.role === 'staff') {
      // Staff can only see tasks assigned to them
      console.log('[API Tasks GET] Executing staff query...');
      tasks = await sql`
        SELECT 
          t.*,
          u.username as "assignedTo_username",
          u.id as "assignedTo_id",
          c."plotId" as "crop_plotId",
          c.id as "crop_id"
        FROM "Task" t
        LEFT JOIN "User" u ON t."userId" = u.id
        LEFT JOIN "Crop" c ON t."cropId" = c.id
        WHERE t."userId" = ${user.id}
        ORDER BY t."startDate" DESC
      `;
    } else {
      // Admin can see all tasks
      console.log('[API Tasks GET] Executing admin query...');
      tasks = await sql`
        SELECT 
          t.*,
          u.username as "assignedTo_username",
          u.id as "assignedTo_id",
          c."plotId" as "crop_plotId",
          c.id as "crop_id"
        FROM "Task" t
        LEFT JOIN "User" u ON t."userId" = u.id
        LEFT JOIN "Crop" c ON t."cropId" = c.id
        ORDER BY t."startDate" DESC
      `;
    }
    
    console.log('[API Tasks GET] Raw tasks from database:', {
      count: tasks.length,
      tasks: tasks
    });
    
    // Transform the results to match the expected structure
    const transformedTasks = tasks.map(task => ({
      ...task,
      assignedTo: {
        username: task.assignedTo_username,
        id: task.assignedTo_id
      },
      crop: task.crop_plotId ? {
        plotId: task.crop_plotId,
        id: task.crop_id
      } : null
    }));
    
    console.log('[API Tasks GET] Transformed tasks for response:', {
      count: transformedTasks.length,
      tasks: transformedTasks.map(task => ({
        id: task.id,
        taskId: task.taskId,
        name: task.name,
        status: task.status,
        priority: task.priority,
        startDate: task.startDate,
        endDate: task.endDate,
        assignedTo: task.assignedTo
      }))
    });
    
    return NextResponse.json(transformedTasks);
  } catch (error) {
    console.error('[API Tasks GET] Error fetching tasks:', error);
    console.error('[API Tasks GET] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: "Gagal mendapatkan data tugasan.", details: error.message },
      { status: 500 }
    );
  }
});

// POST /api/tasks - Create new task (Admin only)
export const POST = withAuthenticatedUser(async function(request) {
  try {
    const data = await request.json();

    // Basic validation
    if (!data.taskId || !data.name || !data.userId || !data.startDate || !data.endDate || !data.status) {
      return NextResponse.json(
        { error: 'Maklumat tugasan tidak lengkap (ID Tugasan, Nama, Pengguna, Tarikh Mula, Tarikh Akhir, Status diperlukan).' },
        { status: 400 }
      );
    }

    // Validate user exists
    const assignedUsers = await sql`
      SELECT id FROM "User" WHERE id = ${parseInt(data.userId)}
    `;

    if (assignedUsers.length === 0) {
      return NextResponse.json(
        { error: 'Pengguna yang ditugaskan tidak ditemui.' },
        { status: 404 }
      );
    }

    // Validate crop if provided
    let cropId = null;
    if (data.cropId) {
      cropId = parseInt(data.cropId);
      const crops = await sql`
        SELECT id FROM "Crop" WHERE id = ${cropId}
      `;
      if (crops.length === 0) {
        return NextResponse.json(
          { error: 'Plot tanaman tidak ditemui.' },
          { status: 404 }
        );
      }
    }

    const newTaskResult = await sql`
      INSERT INTO "Task" (
        "taskId", name, description, "userId", "cropId", 
        "startDate", "endDate", status, priority, notes, attachments,
        "createdAt", "updatedAt"
      ) VALUES (
        ${data.taskId}, ${data.name}, ${data.description}, ${parseInt(data.userId)}, ${cropId},
        ${new Date(data.startDate)}, ${new Date(data.endDate)}, ${data.status}, ${data.priority || 'medium'}, ${data.notes}, ${data.attachments || null},
        NOW(), NOW()
      ) RETURNING *
    `;
    
    const taskId = newTaskResult[0].id;
    
    // Get the created task with related data
    const newTask = await sql`
      SELECT 
        t.*,
        u.username as "assignedTo_username",
        u.id as "assignedTo_id",
        c."plotId" as "crop_plotId",
        c.id as "crop_id"
      FROM "Task" t
      LEFT JOIN "User" u ON t."userId" = u.id
      LEFT JOIN "Crop" c ON t."cropId" = c.id
      WHERE t.id = ${taskId}
    `;
    
    const transformedTask = {
      ...newTask[0],
      assignedTo: {
        username: newTask[0].assignedTo_username,
        id: newTask[0].assignedTo_id
      },
      crop: newTask[0].crop_plotId ? {
        plotId: newTask[0].crop_plotId,
        id: newTask[0].crop_id
      } : null
    };

    return NextResponse.json(transformedTask, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);
    if (error.code === '23505' && error.constraint?.includes('taskId')) {
      return NextResponse.json(
        { error: `ID Tugasan '${data.taskId}' sudah wujud.` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal mencipta tugasan.', details: error.message },
      { status: 500 }
    );
  }
});

// PUT /api/tasks - Update task (Admin can update all, Staff can only update status of their own tasks)
export const PUT = withAuthenticatedUser(async function(request) {
  try {
    const { user } = request;
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: 'ID tugasan diperlukan.' },
        { status: 400 }
      );
    }

    // Get the existing task
    const existingTasks = await sql`
      SELECT * FROM "Task" WHERE id = ${parseInt(data.id)}
    `;

    if (existingTasks.length === 0) {
      return NextResponse.json(
        { error: 'Tugasan tidak ditemui.' },
        { status: 404 }
      );
    }
    
    const existingTask = existingTasks[0];

    // Check permissions
    if (user.role === 'staff') {
      // Staff can only update their own tasks and only the status
      if (existingTask.userId !== user.id) {
        return NextResponse.json(
          { error: 'Anda hanya boleh mengemaskini tugasan anda sendiri.' },
          { status: 403 }
        );
      }
      
      // Staff can only update status
      if (Object.keys(data).some(key => key !== 'id' && key !== 'status' && key !== 'notes')) {
        return NextResponse.json(
          { error: 'Anda hanya boleh mengemaskini status dan nota tugasan.' },
          { status: 403 }
        );
      }
    }

    // Build update data based on role
    const updateData = {};
    
    if (user.role === 'admin') {
      // Admin can update everything
      if (data.taskId) updateData.taskId = data.taskId;
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.userId) updateData.userId = parseInt(data.userId);
      if (data.cropId !== undefined) updateData.cropId = data.cropId ? parseInt(data.cropId) : null;
      if (data.startDate) updateData.startDate = new Date(data.startDate);
      if (data.endDate) updateData.endDate = new Date(data.endDate);
      if (data.priority) updateData.priority = data.priority;
      if (data.attachments !== undefined) updateData.attachments = data.attachments;
    }
    
    // Both admin and staff can update status and notes
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Build the SQL update query dynamically
    if (Object.keys(updateData).length > 0) {
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      Object.entries(updateData).forEach(([key, value]) => {
        updateFields.push(`"${key}" = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      });
      
      updateFields.push('"updatedAt" = NOW()');
      
      const query = `
        UPDATE "Task" 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `;
      
      await sql.unsafe(query, [...updateValues, parseInt(data.id)]);
    }
    
    // Get the updated task with related data
    const updatedTaskResult = await sql`
      SELECT 
        t.*,
        u.username as "assignedTo_username",
        u.id as "assignedTo_id",
        c."plotId" as "crop_plotId",
        c.id as "crop_id"
      FROM "Task" t
      LEFT JOIN "User" u ON t."userId" = u.id
      LEFT JOIN "Crop" c ON t."cropId" = c.id
      WHERE t.id = ${parseInt(data.id)}
    `;
    
    const updatedTask = {
      ...updatedTaskResult[0],
      assignedTo: {
        username: updatedTaskResult[0].assignedTo_username,
        id: updatedTaskResult[0].assignedTo_id
      },
      crop: updatedTaskResult[0].crop_plotId ? {
        plotId: updatedTaskResult[0].crop_plotId,
        id: updatedTaskResult[0].crop_id
      } : null
    };

    return NextResponse.json(updatedTask);

  } catch (error) {
    console.error('Error updating task:', error);
    if (error.code === '23505' && error.constraint?.includes('taskId')) {
      return NextResponse.json(
        { error: `ID Tugasan '${data.taskId}' sudah wujud.` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal mengemaskini tugasan.', details: error.message },
      { status: 500 }
    );
  }
});

// DELETE /api/tasks - Delete task (Admin only)
export const DELETE = withAdminAuth(async function(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID tugasan diperlukan.' },
        { status: 400 }
      );
    }

    const deleteResult = await sql`
      DELETE FROM "Task" WHERE id = ${parseInt(id)}
    `;
    
    if (deleteResult.count === 0) {
      return NextResponse.json(
        { error: 'Tugasan tidak ditemui untuk dipadam.' },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Gagal memadam tugasan.', details: error.message },
      { status: 500 }
    );
  }
});