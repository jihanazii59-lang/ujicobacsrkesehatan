import type { Config, Context } from "@netlify/functions";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { kampung, patients } from "../../db/schema.js";
import { error, json, readJson, requireUser } from "../../server/http.js";
import { normalizeKampungName } from "../../server/patient.js";

export default async (req: Request, context: Context) => {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const id = context.params.id ? Number(context.params.id) : null;
  if (context.params.id && !Number.isInteger(id)) return error("ID tidak valid", 404);

  if (req.method === "GET" && !id) {
    const rows = await db
      .select({
        id: kampung.id,
        nama: kampung.nama,
        jumlahPasien: sql<number>`(select count(*)::int from ${patients} where ${patients.kampung} = ${kampung.nama})`,
      })
      .from(kampung)
      .orderBy(asc(kampung.nama));
    return json(rows);
  }

  if ((req.method === "POST" && !id) || (req.method === "PUT" && id)) {
    const body = await readJson<{ nama?: string }>(req);
    const nama = normalizeKampungName(body?.nama);
    if (!nama) return error("Nama kampung wajib diisi");

    const [existing] = await db.select().from(kampung).where(sql`lower(${kampung.nama}) = lower(${nama})`);
    if (existing && existing.id !== id) return error(`"${nama}" sudah terdaftar`, 409);

    if (req.method === "POST") {
      const [row] = await db.insert(kampung).values({ nama }).returning();
      return json(row, 201);
    }

    // Ganti nama kampung sekaligus pada seluruh rekam medis pasiennya
    const row = await db.transaction(async (tx) => {
      const [old] = await tx.select().from(kampung).where(eq(kampung.id, id!));
      if (!old) return null;
      const [updated] = await tx.update(kampung).set({ nama }).where(eq(kampung.id, id!)).returning();
      await tx.update(patients).set({ kampung: nama }).where(eq(patients.kampung, old.nama));
      return updated;
    });
    if (!row) return error("Kampung tidak ditemukan", 404);
    return json(row);
  }

  // Menghapus kampung dari master daftar; rekam medis pasien tetap disimpan
  if (req.method === "DELETE" && id) {
    const [row] = await db.delete(kampung).where(eq(kampung.id, id)).returning();
    if (!row) return error("Kampung tidak ditemukan", 404);
    return json({ ok: true });
  }

  return error("Metode tidak didukung", 405);
};

export const config: Config = {
  path: ["/api/kampung", "/api/kampung/:id"],
};
