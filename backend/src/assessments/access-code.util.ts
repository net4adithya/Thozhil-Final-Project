/**
 * Generates a cryptographically random 6-character access code.
 * Characters: uppercase A-Z and digits 0-9 only.
 */

import * as crypto from 'crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;

export function generateAccessCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    // Use crypto.randomInt for unbiased, secure random selection
    const idx = crypto.randomInt(0, ALPHABET.length);
    code += ALPHABET[idx];
  }
  return code;
}

/**
 * Validates an access code string:
 * - exactly 6 characters
 * - only uppercase A-Z and digits 0-9 (after uppercasing input)
 */
export function isValidAccessCode(code: string): boolean {
  if (typeof code !== 'string') return false;
  const normalized = code.toUpperCase();
  return /^[A-Z0-9]{6}$/.test(normalized);
}
