# LinkedIn Dashboard Skill for Claude Code

A Claude Code skill that turns your LinkedIn data into a fully interactive analytics dashboard — with strategic analysis and 5 specific content recommendations.

## What it does

Drop your data in a project folder, say **"linkedin dashboard"**, and Claude guides you through the full pipeline:

1. Collects your Apify posts export (per-post reactions, comments, reposts, format)
2. Collects your LinkedIn Analytics exports (impressions, follower counts, demographics)
3. Creates your `about-me.md` (personalises the recommendations)
4. Builds a self-contained `dashboard.html` — no internet required after generation
5. Writes a strategic analysis with top post patterns, audience profile, and content verdict

## Dashboard panels

- Headline cards: impressions, engagement rate, follower count, total posts
- Monthly trend (tabbed): impressions, engagement rate, new followers
- Follower growth: weekly cumulative area chart + new followers per week
- Day-of-week performance: which days get the most reactions and engagements
- Content format comparison: image vs carousel vs video vs article vs text
- Post scatter plot: quadrant analysis (Stars / Viral-Shallow / Niche-Gold / Underperformers)
- Demographics: job titles, industries, seniority, company size, locations
- Top 10 posts table: impressions, engagements, engagement rate, clickable links

## Requirements

- [Claude Code](https://claude.ai/code)
- Python 3 with openpyxl (`pip install openpyxl`)
- Node.js (any recent version)
- A free [Apify](https://apify.com) account for the posts scrape

## Installation

```bash
# Mac / Linux
mkdir -p ~/.claude/skills/linkedin-dashboard
curl -o ~/.claude/skills/linkedin-dashboard/SKILL.md \
  https://raw.githubusercontent.com/DuncanBoyneJnr/linkedin-dashboard-skill/main/SKILL.md

# Windows (PowerShell)
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills\linkedin-dashboard"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/DuncanBoyneJnr/linkedin-dashboard-skill/main/SKILL.md" `
  -OutFile "$env:USERPROFILE\.claude\skills\linkedin-dashboard\SKILL.md"
```

Or download `SKILL.md` manually and place it at:
- Mac/Linux: `~/.claude/skills/linkedin-dashboard/SKILL.md`
- Windows: `%USERPROFILE%\.claude\skills\linkedin-dashboard\SKILL.md`

Restart Claude Code, then trigger the skill by saying any of:
- `linkedin dashboard`
- `build my dashboard`
- `analyse my linkedin`
- `full linkedin analysis`

## Data sources

**Apify posts export**
1. Go to [apify.com](https://apify.com) and create a free account
2. Search the Actor Store for `curious_coder/linkedin-post-scraper`
3. Paste your LinkedIn profile URL, set Max posts to 300+, run, export as JSON

**LinkedIn Analytics export**
1. Go to [linkedin.com/analytics/creator](https://linkedin.com/analytics/creator)
2. Set a 90-day date range and click Export
3. Repeat for each 90-day window going back through your posting history
4. Drop all `.xlsx` files into your project folder

## Works alongside

- **post-writer** skill — drafts any of the 5 recommendations as a LinkedIn post in your voice
- **voice-builder** skill — builds the `voice.md` file the post-writer references

## Licence

MIT
