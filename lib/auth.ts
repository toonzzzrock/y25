/**
 * Authentication utilities for user signup/login
 * Handles password hashing, validation, and session management
 */

import crypto from 'crypto';
import { env } from './env';

// Pepper value - should be set in environment variables
const PEPPER = env.PEPPER_KEY || 'default-pepper-change-in-production';

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
 * Tries with the current pepper first, then falls back to default pepper for compatibility
 */
export function verifyPassword(password: string, salt: Buffer, hash: string): boolean {
  console.log('=== PASSWORD VERIFICATION DEBUG ===');
  console.log('Input password:', password);
  console.log('Salt (hex):', salt.toString('hex'));
  console.log('Stored hash:', hash);
  console.log('Current PEPPER:', PEPPER);
  
  const calculatedHash = hashPassword(password, salt);
  console.log('Calculated hash (with current PEPPER):', calculatedHash);
  
  if (calculatedHash === hash) {
    console.log('✓ Password verified with current PEPPER');
    return true;
  }
  
  // Fallback: try with default pepper for users created with old pepper
  const fallbackPepper = 'default-pepper-change-in-production';
  if (PEPPER !== fallbackPepper) {
    console.log('Trying fallback PEPPER:', fallbackPepper);
    const fallbackHash = crypto
      .createHash('sha256')
      .update(password + salt.toString('hex') + fallbackPepper)
      .digest('hex');
    console.log('Calculated hash (with fallback PEPPER):', fallbackHash);
    
    if (fallbackHash === hash) {
      console.log('✓ User verified with fallback pepper - consider re-hashing password');
      return true;
    }
  }
  
  console.log('✗ Password verification failed');
  return false;
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
