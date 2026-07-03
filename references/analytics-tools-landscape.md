# LinkedIn Analytics Tools Landscape

Research conducted 2026-06-30. Summary of open-source tools for parsing downloadable LinkedIn analytics exports.

## Personal/Creator Analytics (supported)

These tools handle the personal LinkedIn Analytics XLSX export (from linkedin.com/analytics/creator):

| Tool | Type | Sheets Handled | Notes |
|------|------|---------------|-------|
| **DuncanBoyne/linkedin-dashboard-skill** | Hermes skill (markdown guide) | DISCOVERY, ENGAGEMENT, TOP POSTS, FOLLOWERS, DEMOGRAPHICS | Complete pipeline: extract → archive → analyze → visualize. Both old (Content_*) and new (AggregateAnalytics_*) XLSX formats. |
| **phildini/linkedin-analytics-to-sqlite** | pip package | Same 5 sheets | SQLite output. No visualization. |
| **houseoffoss/linkedin-insights** | Next.js app | Same 5 sheets | Client-side only. Requires browser. |

All three handle the same personal analytics export format. The DuncanBoyne skill is the most complete for our use case (dashboard output).

## Company Page Analytics (NOT supported)

**No open-source tools found** that parse LinkedIn company page analytics exports. Searches performed:
- GitHub: "linkedin company page analytics export parser" — 0 results
- GitHub: "linkedin company analytics xlsx" — 0 results
- GitHub: "linkedin company insights parser" — 0 results

The company analytics export format is likely different from the personal format:
- Different sheet names (possibly "Visitors", "Updates", "Followers" instead of "DISCOVERY", "ENGAGEMENT", etc.)
- Different column structure (company metrics like follower demographics, visitor stats, update engagement)
- Different date granularity (weekly/monthly vs daily)

## Next Steps for Company Analytics

1. Obtain a sample company analytics XLSX export from LinkedIn
2. Inspect sheet names and column structure with openpyxl
3. Determine if the format is similar enough to extend extract.py, or if a separate parser is needed
4. Update the overlay skill with company analytics support

## API-Based Alternatives

For programmatic access (beyond downloadable exports):
- **LinkedIn Marketing API** — requires developer app approval, not available for personal use
- **Apify LinkedIn Company Scraper** — third-party, requires Apify credits, not a native LinkedIn export
- **PhantomBuster** — third-party, similar to Apify

These are alternatives to the export-based approach, not replacements. The export-based approach is preferred because it's official, free, and doesn't require API credentials.
