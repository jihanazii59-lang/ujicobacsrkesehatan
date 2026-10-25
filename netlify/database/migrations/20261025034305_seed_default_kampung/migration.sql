-- Custom SQL migration file, put your code below! --
INSERT INTO "kampung" ("nama") VALUES
	('Kampung Tambat'),
	('Kampung Ngguti Bob'),
	('Kampung Semayam Indah'),
	('Kampung Bersehati'),
	('Kampung Serkambu (SOA)')
ON CONFLICT ("nama") DO NOTHING;
