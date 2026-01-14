/**
 * Hash a password using SHA-256
 * Note: In production, this should be done server-side with bcrypt or similar
 */
export async function hashPassword(password: string): Promise<string> {
  console.log('[Password Utils] Hashing password:', password);
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('[Password Utils] Generated hash:', hashHex);
  return hashHex;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  console.log('[Password Utils] Verifying password:', password);
  console.log('[Password Utils] Against hash:', hash);
  const passwordHash = await hashPassword(password);
  const isValid = passwordHash === hash;
  console.log('[Password Utils] Verification result:', isValid);
  console.log('[Password Utils] Generated hash:', passwordHash);
  console.log('[Password Utils] Expected hash:', hash);
  return isValid;
}