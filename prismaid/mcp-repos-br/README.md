# mcp-repos-br: The Definitive Scientific MCP Server

**mcp-repos-br** is not just an integration layer; it is designed to be the preeminent Model Context Protocol (MCP) server worldwide for researchers conducting Systematic and Scoping Reviews.

It provides an airtight, mathematically rigorous engine that forces Language Models (Agents) to adhere strictly to the highest methodological standards: **PRISMA 2020, PRISMA-S, and PRISMA-ScR**.

## 🎯 Our Mission

To bridge the gap between AI capabilities and rigorous scientific methodology. By exposing tools that inherently validate against anti-bias rules, `mcp-repos-br` ensures that AI-driven data mining, deduplication, screening, and synthesis are structurally sound and 100% reproducible.

## ⚙️ Core Capabilities

- **PRISMA-S Compliant Searching**: Execute precise queries against PubMed and national repositories, capturing raw hits verbatim, while generating mandatory `search_log_prisma_s.csv` records for total auditability.
- **Mathematical Validation**: The server validates PRISMA flow diagram counts (F8 phase) on-the-fly, halting synthesis if inconsistencies (e.g., deleted records without logged exclusion reasons) are detected (Anti-Bias Rule RV-05).
- **Strict Origin Traceability (RV-08)**: Inherently tracks the repository, institution, and full-text hosting URL for every article through every stage of the pipeline, preventing data fabrication.
- **Hybrid Architecture**: `mcp-repos-br` orchestrates powerful, local compiled Go binaries (`prismaid.exe`) to execute heavy lifting (like bulk PDF downloading and processing) securely within the designated Context Directory.

## 🛡️ The Context Directory Constraint

A defining feature of this ecosystem is the absolute confinement of operations. All data extraction, mining, and logs are exclusively written to a single, user-defined Project Context Directory (`projects/[project_name]`). This guarantees data isolation and manual reproducibility by future researchers.

## Available Tools

- `search_papers_optimized`
- `search_pubmed`
- `search_repository`
- `deduplicate_dataset`
- `screen_candidates`
- `validate_prisma_flow`
- `export_dataset`

## Getting Started

This MCP server is the engine room. To commence a systematic review, instruct your AI assistant (the Coordinator Agent) to initialize a project template and begin Phase F0 (Protocol Registration).
