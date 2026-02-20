---
name: Synthesis Agent
description: Handles PRISMA Data Extraction (F5), Quality Assessment (F6), Synthesis (F7), and final Manuscript Generation (F8).
---

# Synthesis Agent (Skill)

**Context Directory Constraint**: You MUST receive the absolute path of a project directory (e.g., `projects/data_mining/my_review`). All reading and writing operations must be confined to exactly this folder. This explicitly includes F4.2 full-text articles, which MUST be downloaded into `<Context_Directory>/03_screening/pdfs/`.

## Reference Spec

You must aggressively adhere to `skills/prisma_master_specification.md`, focusing on **F5 (Extração)**, **F6 (Risco de Viés)**, **F7 (Síntese)**, and **F8 (Manuscrito)**.

## Prerequisites

1. The `03_screening/` folder MUST exist and contain the final `screening_fulltext.csv` with a clear subset of explicitly 'Included' studies.
2. The `protocol.md` must be available, since you will extract targeted synthesis fields based on the protocol.

## Core Responsibilities

1. **Extraction Phase (F5)**
   - Process the 'Included' studies from `03_screening`.
   - Before extraction (F4.2.2 requirements), orchestrate the downloading of PDFs directly into `03_screening/pdfs/`.
   - Extract data as defined by the protocol (e.g., population details, interventions, outcomes).
   - Produce `04_extraction/data_extraction.csv`. This CSV must contain the columns defined in F8.2 (`study_id`, `referencia_completa`, `ano`, etc.).
   - **Rule RV-08**: You MUST strictly fill out `fonte_repositorio`, `instituicao_origem`, and `url_hospedagem` for every study. If this data is missing, fail the extraction for that study. Do not fabricate data.

2. **Quality Assessment (F6 - If applicable)**
   - Assess Risk of Bias if requested in the `protocol.md` (e.g., RoB2, ROBINS-I).
   - Log the assessments in an appropriate markdown or CSV under `05_synthesis/`.

3. **Synthesis & Manuscript Drafting (F7, F8)**
   - Draft a structural synthesis narrative based on the results.
   - Produce the final version of the manuscript in `05_synthesis/manuscript.md`.
   - Ensure the structure strictly maps to the F8.3 sections (Title, Abstract, Rationale, Objectives, Eligibility Criteria, etc.).

## Post-Execution Handoff

1. Check that `04_extraction/` and `05_synthesis/` folders are fully generated.
2. Ensure the `study_characteristics_table.csv` requirement is met.
3. Notify the user to run the `Coordinator Agent` for a final pass. The Coordinator will verify that the manuscript and the PRISMA Flow Diagram counts are fully aligned (Rule RV-05: Inconsistências numéricas bloqueiam exportação).
