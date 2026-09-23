CREATE TABLE IF NOT EXISTS "ScorecardProgramEarnings" (
    "unitid" TEXT NOT NULL,
    "cip4" TEXT NOT NULL,
    "credentialLevel" INTEGER NOT NULL,
    "medianEarnings1Yr" INTEGER,
    "medianEarnings4Yr" INTEGER,
    "medianEarnings5Yr" INTEGER,
    "earningsCount1Yr" INTEGER,
    "earningsCount4Yr" INTEGER,
    "earningsCount5Yr" INTEGER,
    "sourceRelease" TEXT NOT NULL,
    CONSTRAINT "ScorecardProgramEarnings_pkey" PRIMARY KEY ("unitid", "cip4", "credentialLevel")
);

CREATE INDEX IF NOT EXISTS "ScorecardProgramEarnings_cip4_credentialLevel_idx"
    ON "ScorecardProgramEarnings" ("cip4", "credentialLevel");

CREATE TABLE IF NOT EXISTS "ScorecardNationalEarnings" (
    "cip4" TEXT NOT NULL,
    "credentialLevel" INTEGER NOT NULL,
    "medianEarnings4Yr" INTEGER NOT NULL,
    "p25Earnings4Yr" INTEGER,
    "p75Earnings4Yr" INTEGER,
    "sourceRelease" TEXT NOT NULL,
    CONSTRAINT "ScorecardNationalEarnings_pkey" PRIMARY KEY ("cip4", "credentialLevel"),
    CONSTRAINT "ScorecardNationalEarnings_cip4_fkey" FOREIGN KEY ("cip4") REFERENCES "Major"("cip4")
);
