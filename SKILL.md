---
name: linkedin-dashboard
description: >
  Build a full LinkedIn analytics dashboard from two data sources: a LinkedIn Analytics export (xlsx) for impressions, follower counts, and demographics, and an Apify posts export (JSON) for post-level reactions, comments, reposts, and content format analysis. Also supports company page analytics exports (both the standard competitor format and LinkedIn's newer company page export format). Guides the user through collecting both data sources if they are missing, ensures about-me.md exists for content recommendations, then runs pre-built Python and Node.js scripts to extract, merge, and generate a self-contained interactive HTML dashboard with strategic analysis and 5 specific content recommendations. Use this skill whenever the user says "linkedin dashboard", "build my dashboard", "analyse my linkedin", "full linkedin analysis", or wants a deeper performance review than the basic analytics export provides.
metadata:
  requires:
    commands:
      - python3
      - node
    pip:
      - openpyxl
      - python-dateutil
      - xlrd
---

# LinkedIn Dashboard

A self-contained Hermes skill that turns your LinkedIn data into a fully interactive analytics dashboard — with strategic analysis and 5 specific content recommendations.

## What's included

- **`scripts/extract.py`** — Parses LinkedIn Analytics XLSX exports in multiple formats (personal, company page, LinkedIn's newer company page format), merges with persistent archive, outputs structured JSON
- **`scripts/generate_dashboard.js`** — Reads extracted JSON and generates a self-contained interactive HTML dashboard with React + Recharts (libraries inlined)
- **`references/`** — Format references for all supported export types

## Prerequisites

1. **Install Python dependencies:**
   ```bash
   pip3 install openpyxl python-dateutil xlrd
   ```

2. **Get your data sources:**
   - **Apify posts export** — JSON file from apify.com (per-post reactions, comments, reposts)
   - **LinkedIn Analytics exports** — XLSX from linkedin.com/analytics/creator
   - **Company page analytics** (optional) — XLSX from linkedin.com/analytics/page
   - **about-me.md** — describes who you are, your audience, and content pillars

---

## Step 1. Check what data exists

Look in the current project folder for:

1. **Apify posts file** — a JSON file containing an array of posts with fields like `stats`, `posted_at`, `text`, `post_type`. Commonly named something like `*-all-posts.json` or `linkedin-posts.json`.
2. **LinkedIn Analytics exports** — one or more xlsx files in **two possible formats**, both with sheets DISCOVERY, ENGAGEMENT, TOP POSTS, FOLLOWERS, DEMOGRAPHICS:
   - **Old format:** filenames start with `Content_` (numbers stored as integers; demographics percentages as decimals).
   - **New format (LinkedIn's current export):** filenames start with `AggregateAnalytics_` (numbers stored as **text strings**; demographics percentages as `"2%"` / `"< 1%"` strings). LinkedIn switched to this format in 2026.
   - Exports usually download to the user's **Downloads** folder, not the project folder. Check both.
3. **Company page analytics** (optional) — files matching `*competitor_analytics*.xlsx` or `*competitor*.xlsx`
4. **Company page format** (optional) — LinkedIn's newer company page analytics export, auto-detected by sheet names
5. **A persistent archive** — `analytics_archive.json` if a previous run created one. **This is the source of truth, not the raw exports.** See the accumulation rule below.
6. **about-me.md** — a file describing who the user is, their audience, and their content pillars.

Report what was found and what is missing. Then work through any missing items in order: Step 2 (Apify) → Step 3 (Analytics exports) → Step 4 (about-me.md) → Step 5 (build).

If the analytics data, an Apify file, and about-me.md all exist, skip to Step 5.

---

## CRITICAL: Accumulate, never replace

LinkedIn Analytics exports are a **rolling window** — the current export reaches back roughly 13 months and no further. Every new export silently drops the oldest dates off the back. If you build the dashboard from only the latest export, all history older than that window is permanently lost.

Therefore the skill maintains a **persistent archive** (`analytics_archive.json`) that is merged forward, never overwritten:

- **Seed** from the existing archive (if one exists) so aged-out dates survive.
- **Merge** every export found (old OR new format) by **date key**.
- On overlap, **keep the higher value** — LinkedIn revises recent numbers upward as late engagement lands.
- **Never delete** a date that is in the archive but absent from the current export.
- Always **back up** the existing archive before writing (e.g. `analytics_archive.backup-YYYYMMDD.json`).

This means users should keep every export they ever download — old `Content_*.xlsx` files are often the only copy of their oldest history once those dates age out of LinkedIn's window.

---

## Step 2. Get the Apify posts export (if missing)

The Apify posts export gives per-post data: reactions broken down by type (like, love, celebrate, insight), comments, reposts, post text, media type, and post URL. LinkedIn's own export does not include this level of post detail.

Tell the user:

> To get your posts data from Apify:
>
> 1. Go to **apify.com** and create a free account (the free tier is enough for one scrape).
> 2. In the Actor Store, search for **"LinkedIn Post Scraper"** or **"LinkedIn Profile Posts"**. A reliable option is `curious_coder/linkedin-post-scraper`.
> 3. In the actor settings, paste your LinkedIn profile URL (e.g. `https://www.linkedin.com/in/yourname`).
> 4. Set **Max posts** to 300+ to capture your full history.
> 5. Run the actor. It takes 2-5 minutes.
> 6. When complete, click **Export** → choose **JSON** → download the file.
> 7. Drop the file into this project folder and tell me the filename.
>
> **Note:** LinkedIn may require you to be logged in. If the actor asks for cookies, follow its documentation to extract your LinkedIn session cookie from your browser.

Wait for the user to confirm the file is in place.

---

## Step 3. Get the LinkedIn Analytics exports (if missing)

The Analytics export gives daily impressions, reach, follower counts, demographics, and top posts ranked by impressions — data that is not available in the Apify scrape.

Tell the user:

> To get your LinkedIn Analytics export:
>
> 1. Go to **linkedin.com/analytics/creator** (you must be a creator or have a business page).
> 2. In the top right, you will see a date range selector and an **Export** button.
> 3. Set the **widest date range LinkedIn allows** and click Export. The current export covers the full available window (about 13 months) in a single file.
> 4. The file downloads as `AggregateAnalytics_YourName_STARTDATE_ENDDATE.xlsx` (new format) or `Content_..._YourName.xlsx` (older format). Either works.
> 5. Leave it in **Downloads** or drop it into this project folder — the skill checks both.
>
> **Important:** The export only reaches back about 13 months. If you have run this before, the skill merges the new file *into* your existing archive rather than replacing it, so older history is preserved. **Keep every export you download** — old `Content_*.xlsx` files may be the only copy of your oldest data once those dates age out of LinkedIn's window.

Wait for the user to confirm the files are in place.

### Company page analytics (optional)

If the user manages a LinkedIn company page, they can also export company page analytics:

> To get your company page analytics:
>
> 1. Go to **linkedin.com/analytics/page** and select your company page.
> 2. Look for an **Export** button — the file downloads as `*competitor_analytics*.xlsx`.
> 3. Drop it into the project folder alongside your personal analytics.

---

## Step 4. Create about-me.md (if missing)

`about-me.md` is used to personalise the content recommendations at the end of the dashboard. Without it, the recommendations are generic rather than specific to your goals, audience, and positioning.

Ask the following questions one at a time, or all together if the user prefers:

1. **Who are you?** — Your name, role, and one-line professional description.
2. **Who is your target audience?** — Who you are trying to reach on LinkedIn.
3. **What are your 3-5 content pillars?** — The main topics you post about.
4. **What is your goal on LinkedIn?** — Awareness, leads, community, job search, thought leadership, etc.
5. **What do you do that most people in your field do not?** — Your specific angle or differentiator.
6. **What tone do you write in?** — Formal, conversational, technical, story-driven, direct, etc.

Once you have the answers, create `about-me.md` in the project folder with this structure:

```markdown
# About Me

**Name:** [name]
**Role:** [role and one-liner]

## Target Audience
[who they are trying to reach]

## Content Pillars
1. [pillar 1]
2. [pillar 2]
3. [pillar 3]
[add more if needed]

## LinkedIn Goal
[their stated goal]

## Differentiator
[what sets them apart]

## Tone
[their tone description]
```

Confirm the file was created before moving to Step 5.

---

## Step 5. Build the dashboard

Now build the full analytics dashboard using the pre-built scripts. This requires Python (openpyxl, python-dateutil, xlrd) and Node.js. Check both are available before proceeding.

### 5a. Extract and merge into the persistent archive

Run the extraction script from the project directory:

```bash
python3 path/to/scripts/extract.py [project_dir]
```

- `project_dir` — optional, defaults to current directory
- Auto-detects format by sheet names (no manual format selection needed)
- Handles old `.xls` binary format via xlrd fallback (openpyxl → xlrd on BadZipFile/InvalidFileException)
- Maintains a persistent archive (`analytics_archive.json`) — never drops old data
- Outputs: `analytics_full.json`, `analytics_archive.json`, `analytics_data.json`

The script reads every `.xlsx` and `.xls` file in the project folder (auto-detecting format by sheet names). It handles all format differences automatically:

- **New-format files** (`AggregateAnalytics_*`) — numbers stored as text strings, demographics as `"2%"` strings
- **Old-format files** (`Content_*`) — numbers as integers, demographics as decimals
- **Company page files (competitor format)** — single COMPETITORS sheet with date range + data rows
- **Company page files (newer format)** — separate sheets for followers, metrics, posts, visitors, and demographics

### 5b. Process the Apify posts JSON

The script also looks for Apify JSON exports in the project folder. If found, it processes them into `scatter_compact.json` with per-post metrics broken down by day of week, content format, and hashtag frequency.

### 5c. Download chart library dependencies

Check if the following files already exist in the project folder. Download any that are missing:

```bash
curl -sL https://unpkg.com/react@18/umd/react.production.min.js -o react.min.js
curl -sL https://unpkg.com/react-dom@18/umd/react-dom.production.min.js -o react-dom.min.js
curl -sL https://unpkg.com/prop-types@15.8.1/prop-types.min.js -o prop-types.min.js
curl -sL https://unpkg.com/recharts@2.12.7/umd/Recharts.js -o recharts.min.js
```

These are inlined into the final HTML so the dashboard works offline.

### 5d. Generate the HTML dashboard

Run the dashboard generator:

```bash
node path/to/scripts/generate_dashboard.js [project_dir]
```

- Reads `analytics_full.json` and the four library files
- Writes a single self-contained `dashboard.html` with React + Recharts
- Dark theme (`#0f1117`), all numbers formatted (67K not 67000)
- Fully offline — no CDN calls, no external dependencies

**Dashboard panels:**

- **Headline cards:** Total impressions, total engagements, current followers, new followers gained, average daily impressions, average engagement rate, total days tracked
- **Monthly trend (tabbed):** Tab 1: impressions + engagements + new followers (dual y-axis). Tab 2: engagement rate per month. Tab 3: new followers per month
- **Follower growth (weekly area chart):** Cumulative total (area) + new followers per week (bars) — dual y-axis
- **Post performance scatter:** X: impressions, Y: engagements. Four quadrants based on medians: Stars / Viral-Shallow / Niche-Gold / Underperformers. Hover tooltip with date and link to post
- **Audience demographics:** Horizontal bar charts by demographic type (job titles, industries, seniority, company size, locations)
- **Company page analytics (if available):** Competitor comparison table sorted by new followers
- **Top 10 posts table:** Date, impressions, engagements, engagement rate, quadrant label, clickable link

### 5e. Full pipeline

```bash
# 1. Extract analytics data (handles personal + company page formats)
python3 scripts/extract.py /path/to/project

# 2. Download chart libraries (one-time)
cd /path/to/project
curl -sL https://unpkg.com/react@18/umd/react.production.min.js -o react.min.js
curl -sL https://unpkg.com/react-dom@18/umd/react-dom.production.min.js -o react-dom.min.js
curl -sL https://unpkg.com/prop-types@15.8.1/prop-types.min.js -o prop-types.min.js
curl -sL https://unpkg.com/recharts@2.12.7/umd/Recharts.js -o recharts.min.js

# 3. Generate dashboard
node scripts/generate_dashboard.js /path/to/project

# 4. Open in browser
open /path/to/project/dashboard.html
```

### 5f. Verify

After generating, confirm:
- `dashboard.html` was written without errors
- Open it in the browser and check it renders
- If the dashboard opens blank, check the browser console. Common causes: CDN scripts not loaded (fix: inline them), unescaped apostrophes in JS string literals, or `</script>` appearing inside the script block.

---

## Step 6. Written strategic analysis

After the dashboard renders, write a strategic analysis directly in the conversation. Structure it as follows:

### Performance Summary
- Total impressions and engagements over the full tracked period
- Engagement rate vs LinkedIn benchmark (1-2% is typical for content accounts)
- Trajectory: growing, plateauing, or declining — use monthly trend to determine
- Note any viral events (months with impressions 3x the average) and what caused them

### Follower Growth Story
- Starting point, ending point, total gain and period
- Months with highest new follower acquisition and what was posted then
- Current monthly run rate and 6-month projection at that pace

### Top Post Patterns
- What the top 5 posts by impressions have in common (format, hook structure, topic, day)
- What the top 5 by engagements have in common
- Where they diverge — posts that got reach but not engagement, and what that signals
- Day-of-week pattern from Apify data: which days outperform and by how much

### Audience Profile
- Who the audience is, from demographics (seniority, industry, company size, location)
- What content the demographic data implies will resonate
- Any audience segments that are surprising given the content pillars in about-me.md

### Content Format Verdict
- Which formats (image / carousel / video / article / text) deliver the highest average engagements
- Which are being over- or under-used relative to their performance
- One format the data suggests should be used more

### 5 Specific Content Recommendations

Read `about-me.md` before writing these. Each recommendation must connect the data pattern to the user's stated goals and audience.

Each recommendation includes:
- **The idea**: a specific post angle or series concept, not a vague category
- **Why the data supports it**: cite the specific metric or pattern
- **Which audience segment it targets**: use the demographics data
- **Expected impact**: be specific — high repost rate, high comment rate, follower acquisition, etc.
- **When to post it**: day of week based on the timing analysis

---

## Step 7. Offer the next move

After the analysis:

> Want me to draft one of these 5 recommendations as a full LinkedIn post?
> Just say which number and I will call the post-writer skill — it will use your about-me.md and voice.md to write it in your voice.

---

## Data Flow

```
XLSX exports → scripts/extract.py → analytics_archive.json (persistent source of truth)
                                    → analytics_personal.json (personal profile: impressions, engagements, followers, top_posts, demographics)
                                    → analytics_company.json (company page: page_views, unique_visitors, visitor_demographics, competitor, top_posts)
                                    → analytics_data.json (working copy of archive)

analytics_personal.json → scripts/generate_dashboard.js → dashboard_personal.html (standalone)
analytics_company.json  → scripts/generate_dashboard.js → dashboard_company.html (standalone)
```

Personal and company data are kept in separate files. The HTML generator reads `top_posts` from whatever file it's given — no special-casing needed.

## File Format Support

### Personal/Creator Analytics (AggregateAnalytics_*)

| Sheet | Content | Columns |
|-------|---------|---------|
| ENGAGEMENT | Daily impressions, engagements | Date, Impressions, Clicks, Likes, Comments, Reposts, Sends, Engagement rate |
| FOLLOWERS | Daily new followers + snapshots | Date, New followers, Total followers (snapshot rows) |
| TOP POSTS | Per-post metrics | Date, Post URL, Impressions, Engagements, Engagement rate |
| DEMOGRAPHICS | Audience breakdown | Category, Name, Value (percent) |

Numbers may be stored as text strings ("6530") and demographics as percent strings ("2%"). Both are handled automatically.

### Company Page Analytics (*competitor_analytics*)

| Sheet | Content | Columns |
|-------|---------|---------|
| COMPETITORS | Aggregate company page metrics | Page, New Followers, Posts, Comments, Comments per day, Reactions |

Format: Row 1 = date range, Row 2 = headers, Row 3+ = data rows.

### Company Page Format (newer export)

LinkedIn's newer company page analytics export format. Files may be old binary `.xls` (CDFV2) — handled via xlrd fallback.

| Sheet | Content | Columns |
|-------|---------|---------|
| New followers | Daily follower counts | Date, Sponsored followers, Organic followers, Auto-invited followers, Total followers |
| Location | Follower geography | Location, Total followers |
| Job function | Follower job functions | Job function, Total followers |
| Seniority | Follower seniority levels | Seniority, Total followers |
| Industry | Follower industries | Industry, Total followers |
| Company size | Follower company sizes | Company size, Total followers |
| Metrics | Daily engagement metrics | Date, Impressions, Unique impressions, Engagement rate |
| All posts | Per-post metrics | Date, Post URL, Impressions, Engagements, Engagement rate |
| Visitor metrics | Daily page views | Date, Page views, Unique visitors |
| Visitor location | Visitor geography | Location, Total visitors |
| Visitor job function | Visitor job functions | Job function, Total visitors |
| Visitor seniority | Visitor seniority levels | Seniority, Total visitors |
| Visitor industry | Visitor industries | Industry, Total visitors |
| Visitor company size | Visitor company sizes | Company size, Total visitors |

## Archive Merge Rules

- **Engagement data** — merged by date key; higher values win on overlap
- **Follower data** — merged by date key; higher values win on overlap
- **Visitor data** — merged by date key; higher values win on overlap
- **Top posts** — merged by post URL; deduplicated
- **Demographics** — last file's data wins (widest date range)
- **Follower/visitor demographics** — last file's data wins
- **Competitor data** — last file's data wins
- **Follower snapshots** — accumulated (all snapshots kept)

## Rules

- Use numbers, not adjectives. "Engagement rate is 2.3%" beats "engagement is strong".
- Never invent metrics not present in the data.
- If data is missing (no Apify file, no demographics, partial date range) flag it clearly rather than silently working around it.
- After generating the HTML, always open it in the browser to verify before declaring it done.
- If the dashboard opens blank, check the browser console. The most common causes are: CDN scripts not loaded (fix: inline them), unescaped apostrophes in JS string literals (fix: use `\\'` in template literal source), or `</script>` appearing inside the script block (fix: escape as `<\\/script>`).
- British English unless about-me.md specifies otherwise.
- Never use em dashes.
- Recommend running this monthly. One month of data is context. Twelve months is a strategy.
