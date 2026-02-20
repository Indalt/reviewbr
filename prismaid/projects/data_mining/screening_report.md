# Supplement 3: Screening Report

**Review Title**: Produção Científica sobre *Anacardium occidentale* no Nordeste do Brasil
**Date**: 2026-02-18

## 1. Screening Pipeline

The screening process followed a two-stage approach:

1. **AI-Assisted Screening (Stage 1)**: Classification of Title/Abstract by Gemini 2.0 Flash.
2. **Human Validation (Stage 2)**: Expert review of the subset selected by AI.

## 2. Quantitative Flow

| Stage | Input | Excluded | Output | Reasons |
| :--- | :--- | :--- | :--- | :--- |
| **Identification** | 338 | - | 338 | - |
| **Deduplication** | 338 | 4 | 334 | Duplicate Records |
| **Full-Text Retrieval** | 334 | 226 | 108 | Link Broken / Access Restricted / Embargoed / timeouts |
| **Screening (AI + Human)** | 108 | 67 | 41 | See below |

## 3. Exclusion Analysis (n=67)

### A. Automatic Exclusions (AI) - n=66

The AI model excluded 66 records based on the following pre-defined criteria:

* **Thematic Irrelevance**: Study not about *Anacardium occidentale* (e.g., mentions "Caju" only as a color or unrelated metaphor).
* **Wrong Document Type**: Conference abstracts, slides, or administrative reports.
* **Geographic Mismatch**: Studies explicitly outside the scope (though most were filtered at search level).

### B. Manual Exclusions (Human) - n=1

During the final validation of the 42 AI-selected candidates, **1 record** was removed by the human reviewer.

* **Title**: *O uso de telas em viveiros de camarões marinhos no estuário Emas, Beberibe, CE*
* **Reason**: "Critério de inclusão refinado pelo especialista na etapa final (Temática irrelevante: Aquicultura/Camarão - Falso positivo da IA)."

## 4. Final Inclusion

* **Total Included**: 41 Studies
* (See `study_characteristics_table.csv` for full list).
