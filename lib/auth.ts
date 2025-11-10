/**
 * Authentication utilities for user signup/login
 * Handles password hashing, validation, and session management
 */

import crypto from 'crypto';

// Pepper value - in production, load from environment variables
const PEPPER = process.env.PASSWORD_PEPPER;

/**
 * Generate a random salt
 */
export function generateSalt(): Buffer {
  return crypto.randomBytes(32);
}

/**
 * Hash password with salt and pepper
 */
export function hashPassword(password: string, salt: Buffer): string {
  const hash = crypto
    .createHash('sha256')
    .update(password + salt.toString('hex') + PEPPER)
    .digest('hex');
  return hash;
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, salt: Buffer, hash: string): boolean {
  const calculatedHash = hashPassword(password, salt);
  return calculatedHash === hash;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one digit' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract username from email (for initial username)
 */
export function generateUsernameFromEmail(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
}
