# QC Report: PRISMA Reproducibility Audit

**Date**: 2026-02-18
**Auditor**: Prismaid QC Agent
**Status**: **PASS**

## 1. Data Consistency Check

We verified the flow of records across all stages of the review.

| Stage | Expected (Logic) | Actual (Logs) | Status |
| :--- | :--- | :--- | :--- |
| **Identification** | 338 | 338 (`search_log_prisma_s.csv`) | OK |
| **Deduplication** | 338 - 4 = 334 | 334 (`dedupe_report.md`) | OK |
| **Full Text Retrieval** | 334 - 226 = 108 | 108 (`prisma_flow_counts.md`) | OK |
| **Eligibility (Screening)** | 108 Assessed | 108 Assessed | OK |
| **Exclusions** | 66 (AI) + 1 (Human) = 67 | 67 Excluded | OK |
| **Inclusion** | 108 - 67 = 41 | 41 (`study_characteristics_table.csv`) | OK |

## 2. Source Registry Verification

* **Metric**: 21 unique sources claimed in manuscript.
* **Verification**: `supplement_sources_registry.md` lists 21 unique sources (19 Institutional + 2 Aggregators). All endpoints verified against `repositorios_brasileiros.csv`.
* **Result**: **PASS**.

## 3. Manual Exclusion Audit

* **Issue**: Initial log missed the specific ID of the manually excluded item.
* **Resolution**: Forensic analysis of `stage_2_candidates_deduped.json` vs `study_characteristics_table.csv` identified the missing record.
* **Excluded Item**: *"O uso de telas em viveiros de camarões marinhos no estuário Emas, Beberibe, CE"*
* **Reason**: Irrelevant topic (Aquaculture). AI False Positive.
* **Action**: Updated `screening_report.md` and `Exclusion_Log.txt`.

## 4. Final Recommendation

The data package is internally consistent, transparent, and reproducible. The "Not Retrieved" count (226) is explicitly explained in the manuscript as required by PRISMA 2020.
