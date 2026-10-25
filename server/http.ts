import { getUser, verifyRequestOrigin, type User } from "@netlify/identity";

export const json = (data: unknown, status = 200) => Response.json(data, { status });

export const error = (message: string, status = 400) => json({ error: message }, status);

// Semua endpoint API hanya untuk pengguna yang sudah login.
// Mutasi (POST/PUT/DELETE) juga harus berasal dari origin situs sendiri.
export async function requireUser(req: Request): Promise<User | Response> {
  if (req.method !== "GET") {
    try {
      verifyRequestOrigin(req);
    } catch {
      return error("Permintaan ditolak", 403);
    }
  }
  const user = await getUser();
  if (!user) return error("Silakan login terlebih dahulu", 401);
  return user;
}

export async function readJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export const userLabel = (user: User) => user.email ?? user.id;
