import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../services/database.js';

class User {
  constructor(data = {}) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.role = data.role || 'user';
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.email_verified = data.email_verified || false;
    this.last_login = data.last_login;
    this.settings = data.settings || {};
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new user
  static async create(userData) {
    const {
      email,
      password,
      first_name,
      last_name,
      role = 'user'
    } = userData;

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      throw new Error('Email, password, first name, and last name are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user record
    const result = await db.insert('users', {
      email: email.toLowerCase(),
      password_hash,
      first_name,
      last_name,
      role,
      is_active: true,
      email_verified: false
    });

    return new User(result);
  }

  // Find user by ID
  static async findById(id) {
    const users = await db.select('users', 'id = $1 AND is_active = true', [id]);
    if (users.length === 0) return null;
    
    return new User(users[0]);
  }

  // Find user by email
  static async findByEmail(email) {
    const users = await db.select('users', 'email = $1 AND is_active = true', [email.toLowerCase()]);
    if (users.length === 0) return null;
    
    return new User(users[0]);
  }

  // Get all users (admin only)
  static async findAll(limit = 50, offset = 0) {
    const users = await db.query(`
      SELECT id, email, first_name, last_name, role, is_active, 
             email_verified, last_login, created_at, updated_at
      FROM users
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return users.rows.map(user => new User(user));
  }

  // Authenticate user with email and password
  static async authenticate(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await user.updateLastLogin();

    return user;
  }

  // Update user profile
  async update(updates) {
    const allowedUpdates = [
      'first_name',
      'last_name', 
      'email',
      'role',
      'is_active',
      'email_verified',
      'settings'
    ];
    
    const updateData = {};
    
    for (const key of allowedUpdates) {
      if (updates.hasOwnProperty(key)) {
        if (key === 'email' && updates[key]) {
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(updates[key])) {
            throw new Error('Invalid email format');
          }
          updateData[key] = updates[key].toLowerCase();
        } else if (key === 'settings' && updates[key]) {
          updateData[key] = JSON.stringify(updates[key]);
        } else {
          updateData[key] = updates[key];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    updateData.updated_at = new Date();

    const result = await db.update('users', updateData, 'id = $1', [this.id]);
    
    if (result) {
      // Parse JSON fields for the instance
      if (result.settings && typeof result.settings === 'string') {
        try {
          result.settings = JSON.parse(result.settings);
        } catch (e) {
          // Keep original value if parsing fails
        }
      }
      
      Object.assign(this, result);
      return this;
    }
    
    throw new Error('User not found');
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, this.password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    // Hash new password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const result = await db.update('users', { 
      password_hash, 
      updated_at: new Date() 
    }, 'id = $1', [this.id]);

    if (result) {
      this.password_hash = result.password_hash;
      this.updated_at = result.updated_at;
      return this;
    }

    throw new Error('Failed to update password');
  }

  // Update last login timestamp
  async updateLastLogin() {
    const now = new Date();
    await db.update('users', { last_login: now }, 'id = $1', [this.id]);
    this.last_login = now;
  }

  // Generate JWT token
  generateToken(expiresIn = '7d') {
    const secret = process.env.JWT_SECRET || 'manito-dev-secret-change-in-production';
    
    const payload = {
      id: this.id,
      email: this.email,
      role: this.role,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, secret, { 
      expiresIn,
      issuer: 'manito-debug',
      subject: String(this.id)
    });
  }

  // Verify JWT token
  static verifyToken(token) {
    const secret = process.env.JWT_SECRET || 'manito-dev-secret-change-in-production';
    
    try {
      const decoded = jwt.verify(token, secret, {
        issuer: 'manito-debug'
      });
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Create session record
  async createSession(token, userAgent = null, ipAddress = null) {
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const session = await db.insert('sessions', {
      user_id: this.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      user_agent: userAgent,
      ip_address: ipAddress
    });

    return session;
  }

  // Get user's active sessions
  async getSessions() {
    const sessions = await db.select(
      'sessions',
      'user_id = $1 AND expires_at > NOW()',
      [this.id],
      'created_at DESC'
    );

    return sessions;
  }

  // Revoke session
  async revokeSession(sessionId) {
    const result = await db.delete('sessions', 'id = $1 AND user_id = $2', [sessionId, this.id]);
    return result.length > 0;
  }

  // Revoke all sessions
  async revokeAllSessions() {
    const result = await db.delete('sessions', 'user_id = $1', [this.id]);
    return result.length;
  }

  // Get user's projects
  async getProjects(limit = 20) {
    const projects = await db.select(
      'projects',
      'user_id = $1',
      [this.id],
      'updated_at DESC',
      limit
    );

    return projects;
  }

  // Soft delete user (deactivate)
  async deactivate() {
    await this.update({ is_active: false });
    await this.revokeAllSessions();
    return this;
  }

  // Get full name
  getFullName() {
    return `${this.first_name} ${this.last_name}`.trim();
  }

  // Check if user has role
  hasRole(role) {
    return this.role === role;
  }

  // Check if user is admin
  isAdmin() {
    return this.role === 'admin';
  }

  // Serialize for API response (exclude sensitive data)
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      full_name: this.getFullName(),
      role: this.role,
      is_active: this.is_active,
      email_verified: this.email_verified,
      last_login: this.last_login,
      settings: this.settings,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Serialize for JWT payload
  toTokenPayload() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      full_name: this.getFullName()
    };
  }

  // Delete user and all associated data
  async delete() {
    // This will cascade delete all related data due to foreign key constraints
    const result = await db.delete('users', 'id = $1', [this.id]);
    return result.length > 0;
  }
}

export default User;