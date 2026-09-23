CREATE TABLE IF NOT EXISTS "MajorOccupation" (
    "cip4" TEXT NOT NULL,
    "socCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "matchedCip6Count" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    CONSTRAINT "MajorOccupation_pkey" PRIMARY KEY ("cip4", "socCode"),
    CONSTRAINT "MajorOccupation_cip4_fkey" FOREIGN KEY ("cip4") REFERENCES "Major"("cip4")
);

CREATE INDEX IF NOT EXISTS "MajorOccupation_cip4_matchedCip6Count_idx"
    ON "MajorOccupation" ("cip4", "matchedCip6Count");

CREATE TABLE IF NOT EXISTS "GraduateProgram" (
    "unitid" TEXT NOT NULL,
    "cip4" TEXT NOT NULL,
    "awardLevel" INTEGER NOT NULL,
    "completionsTotal" INTEGER NOT NULL,
    "sourceYear" INTEGER NOT NULL,
    CONSTRAINT "GraduateProgram_pkey" PRIMARY KEY ("unitid", "cip4", "awardLevel"),
    CONSTRAINT "GraduateProgram_unitid_fkey" FOREIGN KEY ("unitid") REFERENCES "Institution"("unitid"),
    CONSTRAINT "GraduateProgram_cip4_fkey" FOREIGN KEY ("cip4") REFERENCES "Major"("cip4")
);

CREATE INDEX IF NOT EXISTS "GraduateProgram_cip4_completionsTotal_idx"
    ON "GraduateProgram" ("cip4", "completionsTotal");
