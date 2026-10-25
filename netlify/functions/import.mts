import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { kampung, patients } from "../../db/schema.js";
import { error, json, readJson, requireUser, userLabel } from "../../server/http.js";
import { validatePatient, type PatientInput } from "../../server/patient.js";

const MAX_ROWS = 2000;

// Upload massal data pasien (baris hasil parsing file Excel/CSV di browser).
// Semua baris divalidasi dulu; jika ada yang salah, tidak ada yang disimpan.
export default async (req: Request) => {
  const user = await requireUser(req);
  if (user instanceof Response) return user;
  if (req.method !== "POST") return error("Metode tidak didukung", 405);

  const body = await readJson<{ rows?: Record<string, unknown>[] }>(req);
  const rows = Array.isArray(body?.rows) ? body.rows : [];
  if (!rows.length) return error("File tidak berisi data pasien");
  if (rows.length > MAX_ROWS) return error(`Maksimal ${MAX_ROWS} baris per upload`);

  const valid: PatientInput[] = [];
  const errors: { row: number; message: string }[] = [];
  rows.forEach((raw, i) => {
    const { value, error: msg } = validatePatient(raw ?? {});
    if (value) valid.push(value);
    else errors.push({ row: Number(raw?.__row) || i + 2, message: msg! });
  });

  if (errors.length) return json({ error: "Sebagian baris tidak valid", errors }, 422);

  const by = userLabel(user);
  await db.transaction(async (tx) => {
    const names = [...new Set(valid.map((p) => p.kampung))];
    await tx.insert(kampung).values(names.map((nama) => ({ nama }))).onConflictDoNothing();
    for (let i = 0; i < valid.length; i += 500) {
      await tx.insert(patients).values(valid.slice(i, i + 500).map((p) => ({ ...p, createdBy: by, updatedBy: by })));
    }
  });

  return json({ imported: valid.length }, 201);
};

export const config: Config = {
  path: "/api/import",
};
