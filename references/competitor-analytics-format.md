# Competitor Analytics Format Reference

LinkedIn's company page analytics export format. Downloaded from linkedin.com/analytics/page.

## File Detection

Files matching `*competitor_analytics*.xlsx` or `*competitor*.xlsx` are detected by the glob patterns in `extract.py:main()`.

## Sheet Structure

### COMPETITORS (single sheet)

| Row | Content | Example |
|-----|---------|---------|
| 1 | Date range (start, end) | 6/29/2025, 6/28/2026 |
| 2 | Column headers | Page, New Followers, Posts, Comments, Comments per day, Reactions |
| 3+ | Data rows | Verus Data, LLC, 19, 4, 0, 0, 1 |

### Columns

| Column | Type | Example |
|--------|------|---------|
| Page | string | "Verus Data, LLC" |
| New Followers | float | 19.0 |
| Posts | float | 4.0 |
| Comments | float | 0.0 |
| Comments per day | float | 0.0 |
| Reactions | float | 1.0 |

## Extraction Pattern

```python
# In extract_competitor_analytics():
wb = load_workbook_safe(filepath)  # NOT read_only — may miss rows
sheet = wb["COMPETITORS"]
rows = list(sheet.iter_rows(values_only=True))
# Row 1: date range
# Row 2: headers
# Row 3+: data
```

## Pitfall: read_only=True

The competitor file may have only 3 rows. In `read_only=True` mode, openpyxl's optimized XML parser may return only 1 row. Always use `read_only=False` (default) for these files.

## Archive Structure

```json
{
  "source_type": "competitor",
  "date_range": {
    "start": "2025-06-29",
    "end": "2026-06-28"
  },
  "headers": ["Page", "New Followers", "Posts", "Comments", "Comments per day", "Reactions"],
  "rows": [
    {
      "Page": "Verus Data, LLC",
      "New Followers": 19,
      "Posts": 4,
      "Comments": 0,
      "Comments per day": 0,
      "Reactions": 1
    }
  ]
}
```
