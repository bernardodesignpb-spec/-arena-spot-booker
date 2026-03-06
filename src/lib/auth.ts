const ADMIN_HASH_KEY = "ala-beach-admin-hash";
const SESSION_KEY = "ala-beach-admin-session";
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function setupAdminPassword(password: string): Promise<void> {
  const hash = await hashPassword(password);
  localStorage.setItem(ADMIN_HASH_KEY, hash);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const storedHash = localStorage.getItem(ADMIN_HASH_KEY);
  if (!storedHash) {
    // First access — set this password as the admin password
    await setupAdminPassword(password);
    return true;
  }
  const hash = await hashPassword(password);
  return hash === storedHash;
}

export function createSession(): void {
  const session = {
    expires: Date.now() + SESSION_DURATION,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function isSessionValid(): boolean {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return false;
  try {
    const session = JSON.parse(data);
    return session.expires > Date.now();
  } catch {
    return false;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isPasswordConfigured(): boolean {
  return localStorage.getItem(ADMIN_HASH_KEY) !== null;
}
