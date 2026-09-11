# Distributed Data Pipeline

A multi-source job data pipeline: it captures listings from job boards, ATS platforms and APIs across Southern Africa, then **validates, deduplicates and archives them as clean structured JSON**.

I built this to solve a real problem I kept running into: useful job information was scattered across messy pages and APIs, and broken or duplicate records kept polluting whatever I did with it. The pipeline captures live feeds, cleans every record, runs validation checks that catch broken data early, and keeps a running archive.

## How it works

```
                        ┌──────────────────────────────────────────────┐
                        │                index.js (runner)             │
                        └──────────────────────┬───────────────────────┘
                                               │ runs in parallel batches
        ┌──────────────┬───────────────┬───────┴────────┬──────────────┐
        ▼              ▼               ▼                ▼              ▼
   Adzuna API    Jooble (browser)  Indeed (DDG)   VacancyMail    ATS dorkers
   (REST)        Playwright        search pivot   iHarare        DuckDuckGo /
                                                                 Brave "site:"
        └──────────────┴───────────────┬───────────────┘
                                       ▼
                        normalize → validate → dedupe → relevance filter
                                       ▼
                       seen-history filter (no repeats between runs)
                                       ▼
              data/jobs.json (latest batch) + data/full_archive.json
```

## Sources

| Source | Method | Regions |
| --- | --- | --- |
| Adzuna | REST API | ZA |
| Jooble | Headless browser (Playwright + stealth) | ZA, ZW |
| Indeed SA | DuckDuckGo search pivot | ZA |
| VacancyMail | Direct scrape | ZW |
| iHarare Jobs | Direct scrape | ZW |
| ATS dorker | `site:` queries on DuckDuckGo against Greenhouse, Lever, Workable, Ashby, BambooHR, SmartRecruiters, PNet, Careers24 | ZA, ZW, Remote |
| Brave dorker | Same queries via Brave Search | ZA, ZW, Remote |

## Data quality pipeline

Every listing passes through the same core (`src/lib/jobs.js`):

1. **Normalize** — HTML stripped from titles, whitespace collapsed, missing fields filled with safe defaults, dates stamped `YYYY-MM-DD`.
2. **Validate** — a listing is kept only if it has a usable title and a real `http(s)` link. Broken records are dropped before they reach the archive.
3. **Deduplicate** — same link from two sources collapses to one record.
4. **Relevance filter** — titles are checked against the search term so a search for "developer" does not return "Sanitation Specialist".
5. **Seen-history** — links already captured or tracked in earlier runs are skipped.

## Quickstart

```bash
npm install
cp .env.example .env   # add your Adzuna/Jooble keys (optional but recommended)
npm start "software developer"
```

Output lands in `data/jobs.json` (latest batch) and `data/full_archive.json` (everything ever captured).

### Track a listing

```bash
npm track "https://example.com/job/123" applied
```

Marking a listing as tracked removes it from the active lists and stops it from reappearing in future runs.

## Testing

The pipeline core (normalize, validate, dedupe, storage, relevance filter) is fully offline-testable:

```bash
npm test
```

Tests use Node's built-in test runner (`node:test`) with a throwaway data directory, so no network calls and no browsers are needed.

## Docker

```bash
docker build -t job-pipeline .
docker run --rm -v $(pwd)/data:/app/data --env-file .env job-pipeline "software developer"
```

## Project structure

```
distributed-data-pipeline/
├── index.js               # Orchestrator: capture → validate → dedupe → save
├── track_job.js           # CLI: mark a listing as visited/applied
├── src/
│   ├── config.js          # Env loading, API keys, data directory
│   ├── lib/
│   │   └── jobs.js        # Pure core: normalize, validate, dedupe
│   ├── store.js           # JSON persistence (jobs, archive, history, tracked)
│   ├── utils.js           # Relevance filter
│   └── scrapers/          # One module per source
│       ├── adzuna.js
│       ├── jooble_scraper.js
│       ├── indeed_sa.js
│       ├── vacancymail_zim.js
│       ├── iharare_zim.js
│       ├── ats_dorker.js
│       └── brave_dorker.js
├── test/                  # Offline unit tests (node:test)
└── Dockerfile
```

## Notes

- Screenshots of each source are saved to `data/` while scraping (gitignored) for easy debugging.
- API scrapers skip themselves gracefully when keys are missing, so the pipeline still runs browser-only.
- Developed with AI coding agents (Cursor, GitHub Copilot) as part of a human-reviewed agentic workflow: the problem is broken into tasks, agents get context, and every line they produce is reviewed and tested before it ships.

## License

[MIT](LICENSE)