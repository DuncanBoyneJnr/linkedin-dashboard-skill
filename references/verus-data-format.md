# Verus-Data Format Reference

LinkedIn's newer export format for company page analytics. Files may be old binary `.xls` (CDFV2) — handled via xlrd fallback in `extract.py`.

## File Detection

Files matching `verus-data_*.xls` or `verus-data_*.xlsx` are detected by the glob patterns in `extract.py:main()`.

## Sheet Structure

### New followers (daily time series)
| Column | Type | Example |
|--------|------|---------|
| Date | string (MM/DD/YYYY) | 06/29/2025 |
| Sponsored followers | float | 0.0 |
| Organic followers | float | 5.0 |
| Auto-invited followers | float | 0.0 |
| Total followers | float | 5.0 |

### Location / Job function / Seniority / Industry / Company size (demographics)
| Column | Type | Example |
|--------|------|---------|
| Category label | string | "New York City Metropolitan Area" |
| Total followers | float | 4.0 |

### Metrics (daily engagement)
| Column | Type | Example |
|--------|------|---------|
| Date | string (MM/DD/YYYY) | 06/29/2025 |
| Impressions | float | 135.0 |
| Unique impressions | float | 100.0 |
| Engagement rate | float | 0.7 |

### All posts (per-post metrics)
| Column | Type | Example |
|--------|------|---------|
| Date | string (MM/DD/YYYY) | 09/12/2025 |
| Post URL | string | https://www.linkedin.com/posts/... |
| Impressions | float | 2362.0 |
| Engagements | float | 67.0 |
| Engagement rate | float | 2.84 |

### Visitor metrics (daily page views)
| Column | Type | Example |
|--------|------|---------|
| Date | string (MM/DD/YYYY) | 06/29/2025 |
| Page views | float | 5.0 |
| Unique visitors | float | 3.0 |

### Visitor demographics (Location, Job function, Seniority, Industry, Company size)
Same structure as follower demographics but prefixed with "Visitor " in the sheet name.

## Extraction Pattern

```python
# In extract_xlsx():
if "New followers" in sheet_names:
    result["followers"] = extract_followers_new(wb["New followers"])
    result["follower_demographics"] = extract_demographics_new(wb, sheet_names)

if "Metrics" in sheet_names:
    result["engagement"] = extract_engagement_new(wb["Metrics"])

if "All posts" in sheet_names:
    result["top_posts"] = extract_all_posts_new(wb["All posts"])

if "Visitor metrics" in sheet_names:
    result["visitors"] = extract_visitors_new(wb["Visitor metrics"])
    result["visitor_demographics"] = extract_demographics_new(wb, sheet_names)
```

## xlrd Fallback

Old `.xls` files (CDFV2 binary format) are handled by `load_workbook_safe()`:

1. Try `openpyxl.load_workbook()` first
2. On `BadZipFile` or `InvalidFileException`, fall back to `xlrd.open_workbook()`
3. Wrap the xlrd workbook in `XlrdWorkbookWrapper` (adapter class) to match openpyxl's API

The adapter classes (`XlrdSheetWrapper`, `XlrdWorkbookWrapper`) implement `iter_rows(values_only=True)` and `.title` / `.worksheets` to match openpyxl's interface, so all extraction functions work unchanged.
