import { pgTable, serial, text, integer, real, date, timestamp, index } from "drizzle-orm/pg-core";

// Master daftar areal / kampung pelayanan
export const kampung = pgTable("kampung", {
  id: serial().primaryKey(),
  nama: text().notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Rekam medis pasien per kunjungan pelayanan
export const patients = pgTable(
  "patients",
  {
    id: serial().primaryKey(),
    tanggal: date().notNull(),
    kampung: text().notNull(),
    nama: text().notNull(),
    umur: integer().notNull(),
    gender: text().notNull(), // "L" | "P"
    keluhan: text().notNull().default(""),
    td: text(),
    nadi: integer(),
    rr: integer(),
    suhu: real(),
    spo2: integer(),
    diagnosa: text().notNull(),
    obat: text().notNull().default(""),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("patients_tanggal_idx").on(t.tanggal), index("patients_kampung_idx").on(t.kampung)],
);
