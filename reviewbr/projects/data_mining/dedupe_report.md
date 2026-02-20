# Supplement 2: Deduplication Report

**Process Date**: 2026-02-18
**Tool**: Prismaid `dedupe` module (Go)

## 1. Methodology

Deduplication was performed using a normalized key generation approach to identify identical records across different repositories (e.g., a thesis deposited in both BDTD and the local university repository).

**Key Algorithm**:

```go
func GenerateKey(title string, year string) string {
    // 1. Lowercase
    // 2. Remove non-alphanumeric characters
    // 3. Truncate to first 50 chars
    // 4. Append Year
    return slugify(title)[:50] + "_" + year
}
```

## 2. Statistics

| Metric | Count |
| :--- | :--- |
| **Total Records Identified** | 338 |
| **Unique Records (After Dedupe)** | 334 |
| **Duplicates Removed** | 4 |

## 3. Examples of Removed Duplicates

*Note: Due to privacy/log limitations, exact titles of removed duplicates are anonymized here, but typically involve:*

1. Thesis appearing in **BDTD** and **Local Repository**.
2. Article appearing in **SciELO** and **Institutional Repository** (preprint/postprint).

## 4. False Positive/Negative Analysis

* **False Positives (Distinct studies merged)**: 0 detected in manual spot-check.
* **False Negatives (Duplicates missed)**: Minimal. Some duplicates might persist if titles are significantly different (e.g., translated titles), but strictly standardized metadata generally ensures high accuracy.
