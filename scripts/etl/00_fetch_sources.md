# IPEDS & CIP Data Sources

This document tracks the sources and manual steps required to refresh the data for the institution and major taxonomy.

## 1. CIP (Classification of Instructional Programs)
- **Source**: [NCES CIP Download](https://nces.ed.gov/ipeds/cipcode/resources.aspx?y=56)
- **File**: `CIP 2020 to CIP 2020 Crosswalk` (Exported as CSV)
- **Local Path**: `data/IPEDS.csv` (Renamed for simplicity in this project)
- **Description**: Provides the mapping of 6-digit and 4-digit codes to program titles and definitions.

## 2. IPEDS Institutional Characteristics (ICHD)
- **Source**: [IPEDS Complete Data Files](https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx?year=2024&surveyNumber=1)
- **File**: `HD2024` (Institutional Characteristics Header)
- **Local Path**: `data/hd2024.csv`
- **Description**: Contains directory information: UNITID, name, city, state, control (public/private), etc.

## 3. IPEDS Completions (C)
- **Source**: [IPEDS Complete Data Files](https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx?year=2024&surveyNumber=3)
- **File**: `C2024_A` (Completions)
- **Local Path**: `data/c2024_a.csv`
- **Description**: Award counts by institution and 6-digit CIP code.

## ETL Execution Order
1. `npx tsx scripts/etl/01_load_cip.ts` - Builds the major taxonomy.
2. `npx tsx scripts/etl/02_load_ipeds_institutions.ts` - Builds the school directory.
3. `npx tsx scripts/etl/03_load_completions.ts` - Links schools to majors via completion volume.
