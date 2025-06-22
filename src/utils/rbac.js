import { NextResponse } from 'next/server';
import { sql } from '@/lib/database';

/**
 * Extract user information from request headers
 * This assumes the user ID is passed in the Authorization header
 */
export async function getAuthenticatedUser(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '') || authHeader;
    
    console.log('[RBAC] Authentication attempt:', {
      authHeader: authHeader,
      extractedUserId: userId,
      parsedUserId: parseInt(userId)
    });
    
    if (!userId || isNaN(parseInt(userId))) {
      console.log('[RBAC] Authentication failed - invalid user ID');
      return { error: 'Authentication required', status: 401 };
    }

    console.log('[RBAC] Querying database for user:', parseInt(userId));
    const users = await sql`
      SELECT 
        u.id, u.username, u.email, u.role, u.status,
        s.id as staff_id, s."staffId" as staff_staff_id, s.name as staff_name, s.status as staff_status
      FROM "User" u
      LEFT JOIN "Staff" s ON u.id = s."userId"
      WHERE u.id = ${parseInt(userId)}
      LIMIT 1
    `;

    console.log('[RBAC] Database query result:', users);

    const user = users[0];
    if (!user) {
      console.log('[RBAC] User not found in database');
      return { error: 'User not found', status: 401 };
    }

    if (user.status !== 'active') {
      console.log('[RBAC] User account is inactive:', user.status);
      return { error: 'Account is inactive', status: 403 };
    }

    // Transform the data to match the original structure
    console.log('[RBAC] Raw user data from database:', {
      id: user.id,
      username: user.username,
      role: user.role,
      staff_id: user.staff_id,
      staff_staff_id: user.staff_staff_id,
      staff_name: user.staff_name,
      staff_status: user.staff_status
    });
    
    const transformedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      staff: user.staff_id ? {
        id: user.staff_id,
        staffId: user.staff_staff_id,
        name: user.staff_name,
        status: user.staff_status
      } : null
    };

    console.log('[RBAC] Successfully authenticated user:', {
      id: transformedUser.id,
      username: transformedUser.username,
      role: transformedUser.role,
      status: transformedUser.status
    });

    return { user: transformedUser };
  } catch (error) {
    console.error('[RBAC] Authentication error:', error);
    console.error('[RBAC] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { error: 'Authentication failed', status: 500 };
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user, requiredRoles) {
  if (!user || !user.role) return false;
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(user.role);
  }
  
  return user.role === requiredRoles;
}

/**
 * Middleware wrapper for role-based access control
 */
export function withRoleAuth(requiredRoles, handler) {
  return async function(request, context) {
    const authResult = await getAuthenticatedUser(request);
    
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const { user } = authResult;
    
    if (!hasRole(user, requiredRoles)) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }

    // Add user to request context for use in handler
    request.user = user;
    return handler(request, context);
  };
}

/**
 * Middleware wrapper for admin-only access
 */
export function withAdminAuth(handler) {
  return withRoleAuth('admin', handler);
}

/**
 * Middleware wrapper for staff-only access
 */
export function withStaffAuth(handler) {
  return withRoleAuth('staff', handler);
}

/**
 * Middleware wrapper for admin or staff access
 */
export function withAuthenticatedUser(handler) {
  return withRoleAuth(['admin', 'staff'], handler);
}

/**
 * Check if user can access specific task (for task management)
 */
export function canAccessTask(user, task) {
  if (user.role === 'admin') return true;
  if (user.role === 'staff' && task.userId === user.id) return true;
  return false;
}

/**
 * Check if user can modify task status (for staff updating their own tasks)
 */
export function canModifyTaskStatus(user, task) {
  if (user.role === 'admin') return true;
  if (user.role === 'staff' && task.userId === user.id) return true;
  return false;
}