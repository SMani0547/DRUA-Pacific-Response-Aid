# Pacific Response Intelligence

**Hackathon Submission**
**Team:** Abhishek Swamy, Shiva Goundar, Pranav

---

## The Problem

When a cyclone, flood, or landslide hits Fiji and the wider Pacific, emergency operations centers are flooded with fragmented information: SMS reports from villages, radio calls from district officers, weather feeds, hospital updates, and social media chatter. A duty officer in Suva may have to decide within minutes:

- Which village do we send the last available rescue boat to?
- Do we evacuate Rakiraki or Ba first?
- Where is the water shortage most likely to become a health crisis in the next 24 hours?

Today those decisions are made by scrolling through spreadsheets, WhatsApp groups, and phone calls. The data exists, but it is slow, unranked, and not decision-ready. People die because the *ordering* of the response is wrong, not because help was unavailable.

## The Users

- **Emergency Operations Center (EOC) duty officers** at Fiji's National Disaster Management Office (NDMO) and equivalents across the Pacific.
- **District Disaster Coordinators** who need a live ranked view of their district.
- **NGO and Red Cross field teams** deciding where to deploy limited boats, medical teams, and water tankers.
- **AI agents and downstream systems** (via MCP) that need structured decision intelligence rather than a screen to look at.

## The Decision We Accelerate

> *"Of all the incidents happening right now, which one should the next available team be sent to, and why?"*

This is a ranking + explanation problem under time pressure. Every minute a duty officer spends triaging by hand is a minute a rescue team is idle.

---

## What We Built

A decision-support dashboard plus an agent-callable API that ingests community emergency reports, scores them, ranks them, and generates a plain-language response summary for the operations center.

### 1. Ingestion
- **CSV upload** for field reports from district coordinators (with a permissive parser that tolerates the messy real-world formats officers actually send).
- **Structured incident schema**: area, issue type, severity, people affected, resource status, road access.
- Designed to plug into **Google Cloud Storage** as the landing zone for batch drops from districts and NGOs.

### 2. Pipeline (Cleaning, Modeling, Ranking)
- Normalization of severity, area names, and numeric fields.
- **AI Risk Score (0–100)** computed per incident from severity, population affected, resource availability, and access constraints.
- Aggregation rollups by area and by issue type, designed to run as **BigQuery** queries at scale (schema, area rollup, issue rollup, and top-10 query artifacts are included in the repo).

### 3. Acceleration Layer
- **NVIDIA RAPIDS / cuDF (cudf.pandas)** for the scoring and rollup stage. When district feeds scale from hundreds of rows (a single event) to millions (a season of reports across the Pacific), cuDF drops the risk-scoring + rollup step from tens of seconds on pandas to sub-second on a single GPU. That is the difference between a dashboard that refreshes *while the officer is still reading it* and one that lags behind the event.
- **RAPIDS Accelerator for Apache Spark** on **Google Cloud Managed Service for Apache Spark** for the historical layer: multi-year Pacific incident archives used to calibrate the risk model.
- **NVIDIA GPUs on Google Cloud** host the accelerated jobs — no on-prem hardware required for a small island nation's EOC.
- A benchmark artifact (`rapids-benchmark-proof.png`) is included showing the speedup on our representative workload.

### 4. Intelligence Layer
- **Gemini (Enterprise Agent Platform)** generates the human-readable *Response Summary*: which area to prioritize, why, what resources are needed, and the recommended next action.
- Prompt is grounded strictly on the ranked incident list — no hallucinated areas, no invented casualty numbers.

### 5. Output
- A clean, deep-blue enterprise dashboard with:
  - Top-line stats (reports, high-risk areas, people affected, teams available)
  - Ranked priority reports table with risk scores and recommended actions
  - Gemini-generated response summary
  - Area status view
- **Looker**-ready aggregates for executive reporting to ministries and donors.

### 6. Agent-Ready Decision Tools (MCP)
The same decision intelligence is exposed as a **Model Context Protocol** endpoint at `/mcp`, so AI agents (ChatGPT, Claude, Cursor, custom agents) and future emergency systems can call it directly without scraping the UI:

- `list_priority_reports` — ranked incidents, filterable by severity and limit
- `get_area_status` — current risk, status, and recommended action for one area
- `response_summary` — Gemini-authored situational summary plus top-line stats

This turns the dashboard into a *service*, not just a page.

---

## Why Acceleration Matters Here

This is not "acceleration for the leaderboard." In a disaster, the value of an insight decays by the minute.

| Stage | Without acceleration | With RAPIDS + GPU on GCP |
| --- | --- | --- |
| Score + rank 1M historical incidents | tens of seconds to minutes | sub-second |
| Refresh live rollups as new reports arrive | noticeable lag, batch feel | continuous, "live" feel |
| Recalibrate risk model on multi-season archive | overnight Spark job | interactive |

Faster processing → lower time-to-insight → the duty officer sees the *right* ranking *before* the next radio call comes in. That is the operational responsiveness improvement.

---

## Stack Summary

**Google Cloud (data & application layer)**
- BigQuery (rollups, top-N queries, historical archive)
- Cloud Storage (district CSV drop zone)
- Managed Service for Apache Spark (historical calibration)
- Gemini Enterprise Agent Platform (response summary generation)
- Looker (executive reporting surface)

**NVIDIA acceleration layer**
- RAPIDS / cuDF (`cudf.pandas`) for scoring and rollups
- RAPIDS Accelerator for Apache Spark
- NVIDIA GPUs on Google Cloud

**Application layer**
- TanStack Start (React 19, SSR) dashboard
- MCP server exposing the three decision tools over JSON-RPC at `/mcp`

---

## Live Endpoints

- Dashboard: `https://pacific-response-aid.lovable.app`
- MCP endpoint (for AI agents): `https://pacific-response-aid.lovable.app/mcp`

---

## Team

- **Abhishek Swamy**
- **Shiva Goundar**
- **Pranav**
