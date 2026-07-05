# LinkedIn Dashboard Skill

A self-contained skill that turns your LinkedIn data into a fully interactive analytics dashboard — with strategic analysis and 5 specific content recommendations.

This is a **multi-file fork** of the [DuncanBoyne/linkedin-dashboard-skill](https://github.com/DuncanBoyne/linkedin-dashboard-skill), heavily expanded with:

- Pre-built Python and Node.js scripts (no inline code generation needed)
- Company page analytics support (competitor comparison tables)
- Dual-format support (old `Content_*` + new `AggregateAnalytics_*` exports)
- Company page export format support (LinkedIn's newer company analytics export)
- Data segregation architecture (personal vs company data in separate files)
- Accumulation/archive pattern (never lose aged-out history)
- xlrd fallback for old binary `.xls` files
- All parsing pitfalls documented

## What it does

Drop your data in a project folder, run the skill, and it guides you through the full pipeline:

1. Collects your Apify posts export (per-post reactions, comments, reposts, format)
2. Collects your LinkedIn Analytics exports (impressions, follower counts, demographics)
3. Collects company page analytics (optional)
4. Creates your `about-me.md` (personalises the recommendations)
5. Runs `scripts/extract.py` to parse and merge all exports into a persistent archive
6. Runs `scripts/generate_dashboard.js` to produce a self-contained `dashboard.html`
7. Writes a strategic analysis with top post patterns, audience profile, and content verdict

## Dashboard panels

- **Headline cards:** impressions, engagement rate, follower count, total posts
- **Monthly trend (tabbed):** impressions, engagement rate, new followers
- **Follower growth:** weekly cumulative area chart + new followers per week
- **Post performance scatter:** quadrant analysis (Stars / Viral-Shallow / Niche-Gold / Underperformers)
- **Audience demographics:** job titles, industries, seniority, company size, locations
- **Company page analytics:** competitor comparison table (if data available)
- **Top 10 posts table:** impressions, engagements, engagement rate, clickable links

## Requirements

- Python 3 with `openpyxl`, `python-dateutil`, `xlrd` (`pip3 install openpyxl python-dateutil xlrd`)
- Node.js (any recent version)
- A free [Apify](https://apify.com) account for the posts scrape

## Installation

### As a Hermes skill

```bash
hermes skills install https://raw.githubusercontent.com/Verus-Data/linkedin-dashboard-skill/main/SKILL.md --name linkedin-dashboard --category data-science --yes
```

### As a Claude Code / Claude Desktop project

Clone the repo and point Claude to the `SKILL.md` file:

```bash
git clone https://github.com/Verus-Data/linkedin-dashboard-skill.git
cd linkedin-dashboard-skill
pip3 install openpyxl python-dateutil xlrd
```

Then reference the skill in your Claude Code session or Claude Desktop project configuration.

### As a standalone project

```bash
git clone https://github.com/Verus-Data/linkedin-dashboard-skill.git
cd linkedin-dashboard-skill
pip3 install openpyxl python-dateutil xlrd
```

## Quick start

```bash
# 1. Drop your LinkedIn Analytics exports and Apify JSON into a project folder
# 2. Run the extraction script
python3 scripts/extract.py /path/to/project

# 3. Download chart libraries (one-time)
cd /path/to/project
curl -sL https://unpkg.com/react@18/umd/react.production.min.js -o react.min.js
curl -sL https://unpkg.com/react-dom@18/umd/react-dom.production.min.js -o react-dom.min.js
curl -sL https://unpkg.com/prop-types@15.8.1/prop-types.min.js -o prop-types.min.js
curl -sL https://unpkg.com/recharts@2.12.7/umd/Recharts.js -o recharts.min.js

# 4. Generate the dashboard
node scripts/generate_dashboard.js /path/to/project

# 5. Open it
open /path/to/project/dashboard.html
```

## Data sources

**Apify posts export**
1. Go to [apify.com](https://apify.com) and create a free account
2. Search the Actor Store for `curious_coder/linkedin-post-scraper`
3. Paste your LinkedIn profile URL, set Max posts to 300+, run, export as JSON

**LinkedIn Analytics export**
1. Go to [linkedin.com/analytics/creator](https://linkedin.com/analytics/creator)
2. Set the widest date range and click Export
3. Drop the `.xlsx` into your project folder

**Company page analytics (optional)**
1. Go to [linkedin.com/analytics/page](https://linkedin.com/analytics/page)
2. Export and drop the `*competitor_analytics*.xlsx` into your project folder

> **The export is a rolling window — it only reaches back about 13 months.** The skill keeps a persistent `analytics_archive.json` and merges each new export *into* it, so history older than the window is never lost. **Keep every export you download.**

## Repository structure

```
linkedin-dashboard-skill/
├── SKILL.md                    # Self-contained skill (Hermes / Claude Code)
├── README.md                   # This file
├── LICENSE                     # MIT
├── .gitignore
├── scripts/
│   ├── extract.py              # Parse XLSX exports → JSON archive
│   └── generate_dashboard.js   # JSON → self-contained HTML dashboard
└── references/
    ├── analytics-tools-landscape.md            # Survey of open-source LinkedIn analytics tools
    ├── company-page-format.md                  # Company page analytics format reference
    └── competitor-analytics-format.md          # Company page analytics format reference
```

## Licence

MIT
