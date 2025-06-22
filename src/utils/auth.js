import { sql } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function authenticateUser(username, password) {
  try {
    console.log('Authenticating user:', username);
    const users = await sql`
      SELECT * FROM "User" 
      WHERE username = ${username} OR email = ${username}
      LIMIT 1
    `;

    const user = users[0];
    if (!user) {
      console.log('User not found');
      return { error: 'Invalid username or password' };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password');
      return { error: 'Invalid username or password' };
    }

    // Update last login
    await sql`
      UPDATE "User" 
      SET "lastLogin" = ${new Date()}, "updatedAt" = ${new Date()}
      WHERE id = ${user.id}
    `;

    console.log('Authentication successful for user:', user.username);
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Authentication failed' };
  }
}

export async function getUserById(id) {
  try {
    console.log('Getting user by ID:', id);
    const users = await sql`
      SELECT * FROM "User" 
      WHERE id = ${id}
      LIMIT 1
    `;

    const user = users[0];
    if (!user) {
      console.log('User not found');
      return { error: 'User not found' };
    }

    console.log('User found:', user.username);
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  } catch (error) {
    console.error('Get user error:', error);
    return { error: 'Failed to get user' };
  }
} 