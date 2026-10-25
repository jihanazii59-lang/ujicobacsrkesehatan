// Validasi & normalisasi data pasien yang dipakai oleh input manual dan upload file.

export type PatientInput = {
  tanggal: string;
  kampung: string;
  nama: string;
  umur: number;
  gender: "L" | "P";
  keluhan: string;
  td: string | null;
  nadi: number | null;
  rr: number | null;
  suhu: number | null;
  spo2: number | null;
  diagnosa: string;
  obat: string;
};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

const optNumber = (v: unknown, integer = true): number | null => {
  const s = str(v).replace(",", ".");
  if (!s || s === "-") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return integer ? Math.round(n) : Math.round(n * 10) / 10;
};

const normalizeGender = (v: unknown): "L" | "P" | null => {
  const s = str(v).toUpperCase();
  if (["L", "LAKI-LAKI", "LAKI LAKI", "LAKI", "PRIA", "M", "MALE"].includes(s)) return "L";
  if (["P", "PEREMPUAN", "WANITA", "F", "FEMALE"].includes(s)) return "P";
  return null;
};

export const normalizeKampungName = (v: unknown) => {
  const s = str(v).replace(/\s+/g, " ");
  if (!s) return "";
  return /^kampung\s/i.test(s) ? "Kampung " + s.slice(8).trim() : "Kampung " + s;
};

const isValidDate = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
};

export function validatePatient(raw: Record<string, unknown>): { value?: PatientInput; error?: string } {
  const tanggal = str(raw.tanggal);
  const nama = str(raw.nama);
  const kampung = normalizeKampungName(raw.kampung);
  const umur = optNumber(raw.umur);
  const gender = normalizeGender(raw.gender);
  const diagnosa = str(raw.diagnosa);

  if (!isValidDate(tanggal)) return { error: "Tanggal pelaksanaan tidak valid (format YYYY-MM-DD)" };
  if (!nama) return { error: "Nama pasien wajib diisi" };
  if (!kampung) return { error: "Kampung wajib diisi" };
  if (umur === null || umur < 0 || umur > 120) return { error: "Umur harus angka 0–120" };
  if (!gender) return { error: "Jenis kelamin harus L atau P" };
  if (!diagnosa) return { error: "Diagnosa wajib diisi" };

  const td = str(raw.td);
  return {
    value: {
      tanggal,
      kampung,
      nama,
      umur,
      gender,
      keluhan: str(raw.keluhan),
      td: td && td !== "-" ? td : null,
      nadi: optNumber(raw.nadi),
      rr: optNumber(raw.rr),
      suhu: optNumber(raw.suhu, false),
      spo2: optNumber(raw.spo2),
      diagnosa,
      obat: str(raw.obat),
    },
  };
}
