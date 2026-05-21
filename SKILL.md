---
name: linkedin-dashboard
description: >
  Build a full LinkedIn analytics dashboard from two data sources: a LinkedIn Analytics export (xlsx) for impressions, follower counts, and demographics, and an Apify posts export (JSON) for post-level reactions, comments, reposts, and content format analysis. Guides the user through collecting both data sources if they are missing, ensures about-me.md exists for content recommendations, then generates a self-contained interactive HTML dashboard with strategic analysis and 5 specific content recommendations. Use this skill whenever the user says "linkedin dashboard", "build my dashboard", "analyse my linkedin", "full linkedin analysis", or wants a deeper performance review than the basic analytics export provides.
---

<!--
HOW TO INSTALL THIS SKILL
=========================
1. Create the folder: ~/.claude/skills/linkedin-dashboard/
   - Mac/Linux: mkdir -p ~/.claude/skills/linkedin-dashboard
   - Windows:   mkdir "$env:USERPROFILE\.claude\skills\linkedin-dashboard"
2. Save this file as SKILL.md inside that folder.
3. Restart Claude Code (or reload the window).
4. Trigger it by saying: "linkedin dashboard", "build my dashboard", or "analyse my linkedin".

REQUIREMENTS
============
- Python 3 with openpyxl installed  (pip install openpyxl)
- Node.js (any recent version)
- A Claude Code project folder to work in

DATA SOURCES NEEDED (Claude will guide you through getting both)
================================================================
- LinkedIn Analytics export (.xlsx) from linkedin.com/analytics/creator
- Apify posts export (.json) from apify.com (free tier is sufficient)
-->

# LinkedIn Dashboard

## CRITICAL: Auto-start on load

Go straight to Step 1. Do not summarise the skill.

---

## Step 1. Check what data exists

Look in the current project folder for:

1. **Apify posts file** — a JSON file containing an array of posts with fields like `stats`, `posted_at`, `text`, `post_type`. Commonly named something like `*-all-posts.json` or `linkedin-posts.json`.
2. **LinkedIn Analytics exports** — one or more xlsx files named `Content_*.xlsx` with sheets: DISCOVERY, ENGAGEMENT, TOP POSTS, FOLLOWERS, DEMOGRAPHICS.
3. **about-me.md** — a file describing who the user is, their audience, and their content pillars.

Report what was found and what is missing. Then work through any missing items in order: Step 2 (Apify) → Step 3 (Analytics exports) → Step 4 (about-me.md) → Step 5 (build).

If all three exist, skip to Step 5.

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
> 3. Export the following date ranges — each export covers a maximum period, so you need multiple to get full history:
>    - **Last 90 days** (most recent data)
>    - **The 90 days before that** (overlap slightly — LinkedIn deduplicates)
>    - Keep going back until you have covered your full posting history
> 4. Each file downloads as `Content_STARTDATE_ENDDATE_YourName.xlsx`.
> 5. Drop all the xlsx files into this project folder.
>
> **Tip:** If you only have one or two exports that is fine. More date ranges give more complete impression and follower history.

Wait for the user to confirm the files are in place.

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

Now build the full analytics dashboard. This requires Python (openpyxl) and Node.js. Check both are available before proceeding.

### 5a. Extract and merge the Analytics xlsx data

Use Python with openpyxl to read all `Content_*.xlsx` files in the project folder. Merge the following across all files:

**ENGAGEMENT sheet** (Date, Impressions, Engagements — daily rows):
- Use date as the merge key. Where dates overlap between files, keep the higher value.

**FOLLOWERS sheet** (Date, New followers + total snapshot):
- Same date-merge approach.
- Capture all follower total snapshots (e.g. "Total followers on 8/21/2025: 5086") for calibrating cumulative totals.

**TOP POSTS sheet** (two tables: by engagements and by impressions):
- Some files have one combined sheet, some have two separate sheets ("TOP POSTS Eng" and "TOP POSTS Imp"). Handle both formats.
- Merge on post URL. Keep the highest engagement and impression values seen across files.

**DEMOGRAPHICS sheet** (category, label, percentage):
- Use the file with the widest date range.

Write the merged output to `analytics_data.json`.

Then build derived datasets:
- **Monthly aggregates**: sum impressions, engagements, new followers per month. Calculate engagement rate (engagements / impressions).
- **Cumulative follower series**: anchor on the earliest total snapshot, reconstruct backwards and forwards from daily new follower data.
- **analytics_full.json**: final output containing `daily`, `monthly`, `top_posts`, `demographics`, and `totals`.

### 5b. Process the Apify posts JSON

Read the Apify posts JSON. Filter out reposts (post_type === 'repost'). For each remaining post extract:
- Date, day of week, month
- Reactions (total and by type: like, love, celebrate, insight, support, funny)
- Comments, reposts
- Total engagements (reactions + comments + reposts)
- Content format (image / carousel / video / article / text)
- Post URL and first 100 chars of text

Write compact output to `scatter_compact.json` (array of arrays to minimise size).

Compute aggregates:
- By day of week: average reactions, average engagements, post count
- By content format: average reactions, average engagements, post count
- Top hashtags by frequency

### 5c. Download chart library dependencies

Check if the following files already exist in the project folder. Download any that are missing:
- `react.min.js` — from `https://unpkg.com/react@18/umd/react.production.min.js`
- `react-dom.min.js` — from `https://unpkg.com/react-dom@18/umd/react-dom.production.min.js`
- `prop-types.min.js` — from `https://unpkg.com/prop-types@15.8.1/prop-types.min.js`
- `recharts.min.js` — from `https://unpkg.com/recharts@2.12.7/umd/Recharts.js`

These are inlined into the final HTML so the dashboard works offline.

### 5d. Generate the HTML dashboard

Write a Node.js generator script (`generate_dashboard.js`) that reads `analytics_full.json`, `scatter_compact.json`, and the four library files, and writes a single self-contained `dashboard.html`.

**Critical: apostrophes in analysis text strings**
All analysis text embedded as JavaScript string literals must use properly escaped apostrophes. In Node.js template literals, `\\'` in the source produces `\'` in the output HTML, which JavaScript correctly parses as an escaped apostrophe in a single-quoted string. Unescaped apostrophes will silently break the page with no visible error. After generating the file, always validate the embedded script with `node --check`.

The dashboard must include these panels:

**Headline cards:**
- Total impressions, total engagements (LinkedIn metric), current followers, new followers gained, average daily impressions, average engagement rate, total posts

**Monthly trend (tabbed):**
- Tab 1: impressions (bars) + engagements (bars) + new followers (line) — dual y-axis
- Tab 2: engagement rate per month (bar, highlight above/below average)
- Tab 3: new followers per month (bars)

**Follower growth (weekly area chart):**
- Cumulative total (area) + new followers per week (bars) — dual y-axis

**Day-of-week performance (from Apify data):**
- Average reactions and average engagements per post by day — highlight Tuesday and Thursday if they lead

**Content format comparison (from Apify data):**
- Average reactions, average engagements, post count by format (image / carousel / video / article / text)

**Post performance scatter (from Analytics top posts):**
- X: impressions, Y: engagements
- Four quadrants based on medians: Stars / Viral-Shallow / Niche-Gold / Underperformers
- Hover tooltip with date and link to post

**Demographics (from Analytics):**
- Horizontal bar charts: job titles, industries, seniority, company size, top locations

**Top 10 posts table (from Analytics):**
- Date, impressions, engagements, engagement rate, quadrant label, clickable link

**Visual rules:**
- Dark background `#0f1117`
- All numbers formatted: `67K` not `67000`
- Fully self-contained — no CDN calls, no external dependencies

Run `node generate_dashboard.js` and confirm the file was written without errors. Then open `dashboard.html` in the browser.

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

## Rules

- Use numbers, not adjectives. "Engagement rate is 2.3%" beats "engagement is strong".
- Never invent metrics not present in the data.
- If data is missing (no Apify file, no demographics, partial date range) flag it clearly rather than silently working around it.
- After generating the HTML, always validate with `node --check` before declaring it done.
- If the dashboard opens blank, check the browser console. The most common causes are: CDN scripts not loaded (fix: inline them), unescaped apostrophes in JS string literals (fix: use `\\'` in template literal source), or `</script>` appearing inside the script block (fix: escape as `<\/script>`).
- British English unless about-me.md specifies otherwise.
- Never use em dashes.
- Recommend running this monthly. One month of data is context. Twelve months is a strategy.
