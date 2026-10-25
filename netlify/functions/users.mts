import type { Config, Context } from "@netlify/functions";
import { admin, AuthError } from "@netlify/identity";
import { error, json, readJson, requireUser } from "../../server/http.js";

// Kelola akun petugas yang boleh mengakses sistem
export default async (req: Request, context: Context) => {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const id = context.params.id;

  try {
    if (req.method === "GET" && !id) {
      const users = await admin.listUsers({ perPage: 500 });
      return json(
        users.map((u) => ({
          id: u.id,
          email: u.email,
          name: (u.userMetadata?.full_name as string) || u.name || "",
          createdAt: u.createdAt,
          lastSignInAt: u.lastSignInAt,
          confirmed: Boolean(u.confirmedAt),
          isSelf: u.id === user.id,
        })),
      );
    }

    if (req.method === "POST" && !id) {
      const body = await readJson<{ email?: string; password?: string; name?: string }>(req);
      const email = body?.email?.trim().toLowerCase() ?? "";
      const password = body?.password ?? "";
      const name = body?.name?.trim() ?? "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Email tidak valid");
      if (password.length < 8) return error("Kata sandi minimal 8 karakter");
      const created = await admin.createUser({
        email,
        password,
        data: { user_metadata: { full_name: name } },
      });
      return json({ id: created.id, email: created.email }, 201);
    }

    if (req.method === "DELETE" && id) {
      if (id === user.id) return error("Tidak dapat menghapus akun Anda sendiri");
      await admin.deleteUser(id);
      return json({ ok: true });
    }
  } catch (e) {
    if (e instanceof AuthError) {
      const msg = /already/i.test(e.message) ? "Email sudah terdaftar" : e.message;
      return error(msg, e.status && e.status < 500 ? e.status : 502);
    }
    throw e;
  }

  return error("Metode tidak didukung", 405);
};

export const config: Config = {
  path: ["/api/users", "/api/users/:id"],
};
