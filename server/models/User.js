import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import enhancedDb from '../services/enhancedDatabase.js';
import { emailValidation } from '../utils/emailValidation.js';

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

    // Validate email format and domain using new email validation
    const emailValidationResult = emailValidation.validate(email);
    if (!emailValidationResult.valid) {
      throw new Error(emailValidationResult.error);
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

    // Create user record with validated email
    const result = await enhancedDb.insert('users', {
      email: emailValidationResult.value, // Use validated email
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
    const users = await enhancedDb.select('users', { where: 'id = $1 AND is_active = true', whereParams: [id] });
    if (users.length === 0) return null;
    
    return new User(users[0]);
  }

  // Find user by email
  static async findByEmail(email) {
    // Normalize email for consistent lookup
    const normalizedEmail = email ? email.toLowerCase() : '';
    const users = await enhancedDb.select('users', { where: 'email = $1 AND is_active = true', whereParams: [normalizedEmail] });
    if (users.length === 0) return null;
    
    return new User(users[0]);
  }

  // Get all users (admin only)
  static async findAll(limit = 50, offset = 0) {
    const users = await enhancedDb.query(`
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

    // Validate email format and domain
    const emailValidationResult = emailValidation.validate(email);
    if (!emailValidationResult.valid) {
      throw new Error('Invalid email or password');
    }

    const user = await User.findByEmail(emailValidationResult.value);
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
      'settings'
    ];

    const filteredUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        // Special validation for email updates
        if (key === 'email' && value) {
          const emailValidationResult = emailValidation.validate(value);
          if (!emailValidationResult.valid) {
            throw new Error(emailValidationResult.error);
          }
          filteredUpdates[key] = emailValidationResult.value;
        } else {
          filteredUpdates[key] = value;
        }
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid updates provided');
    }

    filteredUpdates.updated_at = new Date();

    const result = await enhancedDb.update('users', filteredUpdates, { where: 'id = $1', whereParams: [this.id] });
    
    // Update local instance
    Object.assign(this, filteredUpdates);
    
    return this;
  }

  // Update last login timestamp
  async updateLastLogin() {
    await enhancedDb.update('users', { 
      last_login: new Date() 
    }, { 
      where: 'id = $1', 
      whereParams: [this.id] 
    });
    
    this.last_login = new Date();
  }

  // Generate JWT token
  generateToken() {
    const payload = {
      id: this.id,
      email: this.email,
      role: this.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
  }

  // Create user session
  async createSession(token, userAgent, ipAddress) {
    const sessionData = {
      user_id: this.id,
      token_hash: await bcrypt.hash(token, 10),
      user_agent: userAgent,
      ip_address: ipAddress,
      created_at: new Date(),
      expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days
    };

    await enhancedDb.insert('user_sessions', sessionData);
  }

  // Invalidate user session
  async invalidateSession(token) {
    const tokenHash = await bcrypt.hash(token, 10);
    await enhancedDb.delete('user_sessions', { 
      where: 'user_id = $1 AND token_hash = $2', 
      whereParams: [this.id, tokenHash] 
    });
  }

  // Get user sessions
  async getSessions() {
    const sessions = await enhancedDb.select('user_sessions', { 
      where: 'user_id = $1', 
      whereParams: [this.id] 
    });
    return sessions;
  }

  // Check if user has verified email
  isEmailVerified() {
    return this.email_verified === true;
  }

  // Mark email as verified
  async verifyEmail() {
    await enhancedDb.update('users', { 
      email_verified: true,
      updated_at: new Date()
    }, { 
      where: 'id = $1', 
      whereParams: [this.id] 
    });
    
    this.email_verified = true;
  }

  // Check if user is admin
  isAdmin() {
    return this.role === 'admin';
  }

  // Check if user is active
  isActive() {
    return this.is_active === true;
  }

  // Deactivate user
  async deactivate() {
    await enhancedDb.update('users', { 
      is_active: false,
      updated_at: new Date()
    }, { 
      where: 'id = $1', 
      whereParams: [this.id] 
    });
    
    this.is_active = false;
  }

  // Reactivate user
  async reactivate() {
    await enhancedDb.update('users', { 
      is_active: true,
      updated_at: new Date()
    }, { 
      where: 'id = $1', 
      whereParams: [this.id] 
    });
    
    this.is_active = true;
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      role: this.role,
      is_active: this.is_active,
      email_verified: this.email_verified,
      last_login: this.last_login,
      settings: this.settings,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Get user statistics
  static async getStats() {
    const stats = await enhancedDb.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as recent_users
      FROM users
    `);
    
    return stats.rows[0];
  }

  // Search users
  static async search(query, limit = 20, offset = 0) {
    const searchQuery = `
      SELECT id, email, first_name, last_name, role, is_active, 
             email_verified, last_login, created_at, updated_at
      FROM users
      WHERE is_active = true 
        AND (
          email ILIKE $1 
          OR first_name ILIKE $1 
          OR last_name ILIKE $1
        )
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const searchTerm = `%${query}%`;
    const users = await enhancedDb.query(searchQuery, [searchTerm, limit, offset]);
    
    return users.rows.map(user => new User(user));
  }
}

export default User;