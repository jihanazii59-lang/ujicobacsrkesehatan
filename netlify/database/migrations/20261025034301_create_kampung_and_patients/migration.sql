CREATE TABLE "kampung" (
	"id" serial PRIMARY KEY,
	"nama" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" serial PRIMARY KEY,
	"tanggal" date NOT NULL,
	"kampung" text NOT NULL,
	"nama" text NOT NULL,
	"umur" integer NOT NULL,
	"gender" text NOT NULL,
	"keluhan" text DEFAULT '' NOT NULL,
	"td" text,
	"nadi" integer,
	"rr" integer,
	"suhu" real,
	"spo2" integer,
	"diagnosa" text NOT NULL,
	"obat" text DEFAULT '' NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "patients_tanggal_idx" ON "patients" ("tanggal");--> statement-breakpoint
CREATE INDEX "patients_kampung_idx" ON "patients" ("kampung");