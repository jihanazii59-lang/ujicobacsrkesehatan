import type { Config, Context } from "@netlify/functions";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { kampung, patients } from "../../db/schema.js";
import { error, json, readJson, requireUser, userLabel } from "../../server/http.js";
import { validatePatient } from "../../server/patient.js";

// Pastikan kampung pada data pasien juga tercatat di master daftar kampung
async function ensureKampung(names: string[]) {
  const unique = [...new Set(names)];
  if (unique.length) {
    await db.insert(kampung).values(unique.map((nama) => ({ nama }))).onConflictDoNothing();
  }
}

export default async (req: Request, context: Context) => {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const id = context.params.id ? Number(context.params.id) : null;
  if (context.params.id && !Number.isInteger(id)) return error("ID tidak valid", 404);

  if (req.method === "GET" && !id) {
    const rows = await db.select().from(patients).orderBy(desc(patients.tanggal), desc(patients.id));
    return json(rows);
  }

  if (req.method === "POST" && !id) {
    const body = await readJson<Record<string, unknown>>(req);
    if (!body) return error("Data tidak valid");
    const { value, error: msg } = validatePatient(body);
    if (!value) return error(msg!);
    await ensureKampung([value.kampung]);
    const [row] = await db
      .insert(patients)
      .values({ ...value, createdBy: userLabel(user), updatedBy: userLabel(user) })
      .returning();
    return json(row, 201);
  }

  if (req.method === "PUT" && id) {
    const body = await readJson<Record<string, unknown>>(req);
    if (!body) return error("Data tidak valid");
    const { value, error: msg } = validatePatient(body);
    if (!value) return error(msg!);
    await ensureKampung([value.kampung]);
    const [row] = await db
      .update(patients)
      .set({ ...value, updatedBy: userLabel(user), updatedAt: sql`now()` })
      .where(eq(patients.id, id))
      .returning();
    if (!row) return error("Data pasien tidak ditemukan", 404);
    return json(row);
  }

  if (req.method === "DELETE" && id) {
    const [row] = await db.delete(patients).where(eq(patients.id, id)).returning({ id: patients.id });
    if (!row) return error("Data pasien tidak ditemukan", 404);
    return json({ ok: true });
  }

  // Hapus banyak data sekaligus: DELETE /api/patients { ids: [...] }
  if (req.method === "DELETE" && !id) {
    const body = await readJson<{ ids?: unknown[] }>(req);
    const ids = (body?.ids ?? []).map(Number).filter(Number.isInteger);
    if (!ids.length) return error("Tidak ada data yang dipilih");
    const rows = await db.delete(patients).where(inArray(patients.id, ids)).returning({ id: patients.id });
    return json({ deleted: rows.length });
  }

  return error("Metode tidak didukung", 405);
};

export const config: Config = {
  path: ["/api/patients", "/api/patients/:id"],
};
