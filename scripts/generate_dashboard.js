#!/usr/bin/env node
/**
 * Step 5d: Generate self-contained HTML dashboard from analytics data.
 * Reads analytics_full.json and embeds all chart libraries inline.
 */

const fs = require('fs');
const path = require('path');

// Accept project directory as CLI arg, default to current dir
const PROJECT_DIR = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

// Read data
const full = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, 'analytics_full.json'), 'utf8'));

const { daily, monthly, top_posts, demographics, cumulative_followers, totals, competitor } = full;

// Format number helper
function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

// Build monthly data for charts
const monthlyData = monthly.map(m => ({
  month: m.month,
  impressions: m.impressions,
  engagements: m.engagements,
  newFollowers: m.new_followers,
  engagementRate: +(m.engagement_rate * 100).toFixed(1),
}));

// Build weekly follower data
const weeklyFollowers = [];
if (cumulative_followers && cumulative_followers.length > 0) {
  let weekStart = cumulative_followers[0].date;
  let weekNew = 0;
  let weekCum = 0;
  for (let i = 0; i < cumulative_followers.length; i++) {
    const cur = cumulative_followers[i];
    const prev = i > 0 ? cumulative_followers[i - 1] : null;
    const newFol = prev ? cur.total - prev.total : cur.total;
    weekNew += newFol;
    weekCum = cur.total;
    // Group by ISO week (approximate: every 7 days)
    if (i % 7 === 6 || i === cumulative_followers.length - 1) {
      weeklyFollowers.push({ week: cur.date, newFollowers: weekNew, total: weekCum });
      weekNew = 0;
    }
  }
}

// Build demographics by type
const demoByType = {};
for (const d of demographics) {
  if (!demoByType[d.demographic_type]) demoByType[d.demographic_type] = [];
  demoByType[d.demographic_type].push({ name: d.value, value: +(d.percentage * 100).toFixed(1) });
}

// Sort demographics descending
for (const key of Object.keys(demoByType)) {
  demoByType[key].sort((a, b) => b.value - a.value);
}

// Calculate medians for quadrant analysis
const medianImp = top_posts.length > 0
  ? top_posts.map(p => p.impressions).sort((a, b) => a - b)[Math.floor(top_posts.length / 2)]
  : 0;
const medianEng = top_posts.length > 0
  ? top_posts.map(p => p.engagements).sort((a, b) => a - b)[Math.floor(top_posts.length / 2)]
  : 0;

// Quadrant labels
function getQuadrant(imp, eng) {
  if (imp >= medianImp && eng >= medianEng) return 'Stars';
  if (imp >= medianImp && eng < medianEng) return 'Viral-Shallow';
  if (imp < medianImp && eng >= medianEng) return 'Niche-Gold';
  return 'Underperformers';
}

// Build top posts data
const topPostsData = top_posts.map(p => ({
  ...p,
  engagementRate: p.impressions > 0 ? +((p.engagements / p.impressions) * 100).toFixed(2) : 0,
  quadrant: getQuadrant(p.impressions, p.engagements),
})).sort((a, b) => b.impressions - a.impressions).slice(0, 10);

const scatterData = top_posts.map(p => ({
  ...p,
  quadrant: getQuadrant(p.impressions, p.engagements),
}));

// Build the HTML
// Read and inline library files, escaping </script> to prevent HTML breakage
function inlineLib(name) {
  const content = fs.readFileSync(path.join(PROJECT_DIR, name), 'utf8');
  return content.replace(/<\/script>/gi, '<\\/script>');
}

const reactLib = inlineLib('react.min.js');
const reactDomLib = inlineLib('react-dom.min.js');
const propTypesLib = inlineLib('prop-types.min.js');
const rechartsLib = inlineLib('recharts.min.js');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LinkedIn Analytics Dashboard</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0f1117; color: #e1e4e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
h1 { font-size: 24px; margin-bottom: 24px; color: #f0f6fc; }
h2 { font-size: 18px; margin-bottom: 16px; color: #f0f6fc; }
h3 { font-size: 14px; margin-bottom: 8px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
.card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; }
.card .value { font-size: 28px; font-weight: 700; color: #f0f6fc; }
.card .label { font-size: 12px; color: #8b949e; margin-top: 4px; }
.chart-container { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
.tabs { display: flex; gap: 4px; margin-bottom: 16px; }
.tab { padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; background: #21262d; color: #8b949e; border: 1px solid #30363d; }
.tab.active { background: #1f6feb; color: #fff; border-color: #1f6feb; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { text-align: left; padding: 8px 12px; border-bottom: 1px solid #30363d; color: #8b949e; font-weight: 600; }
td { padding: 8px 12px; border-bottom: 1px solid #21262d; }
tr:hover td { background: #161b22; }
a { color: #58a6ff; text-decoration: none; }
a:hover { text-decoration: underline; }
.quadrant-tag { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.quadrant_Stars { background: #1f6feb33; color: #58a6ff; }
.quadrant_Viral_Shallow { background: #da363333; color: #ff7b72; }
.quadrant_Niche_Gold { background: #d2992233; color: #d29922; }
.quadrant_Underperformers { background: #21262d; color: #8b949e; }
.demo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
.demo-bar { display: flex; align-items: center; margin-bottom: 6px; }
.demo-bar .label { width: 140px; font-size: 12px; color: #e1e4e8; text-align: right; padding-right: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.demo-bar .bar-bg { flex: 1; height: 18px; background: #21262d; border-radius: 3px; overflow: hidden; }
.demo-bar .bar-fill { height: 100%; background: #1f6feb; border-radius: 3px; }
.demo-bar .pct { width: 40px; font-size: 11px; color: #8b949e; padding-left: 6px; }
</style>
</head>
<body>
<h1>LinkedIn Analytics Dashboard</h1>

<div class="cards">
  <div class="card"><div class="value">${fmt(totals.total_impressions)}</div><div class="label">Total Impressions</div></div>
  <div class="card"><div class="value">${fmt(totals.total_engagements)}</div><div class="label">Total Engagements</div></div>
  <div class="card"><div class="value">${totals.total_new_followers}</div><div class="label">New Followers</div></div>
  <div class="card"><div class="value">${fmt(totals.avg_daily_impressions)}</div><div class="label">Avg Daily Impressions</div></div>
  <div class="card"><div class="value">${(totals.avg_engagement_rate * 100).toFixed(1)}%</div><div class="label">Avg Engagement Rate</div></div>
  <div class="card"><div class="value">${totals.total_days}</div><div class="label">Days Tracked</div></div>
</div>

<div class="chart-container" id="monthly-chart">
  <h2>Monthly Trend</h2>
  <div class="tabs" id="monthly-tabs">
    <div class="tab active" data-tab="impressions">Impressions + Engagements</div>
    <div class="tab" data-tab="rate">Engagement Rate</div>
    <div class="tab" data-tab="followers">New Followers</div>
  </div>
  <div id="monthly-content"></div>
</div>

<div class="chart-container" id="follower-chart">
  <h2>Follower Growth</h2>
  <div id="follower-content"></div>
</div>

<div class="chart-container" id="scatter-chart">
  <h2>Post Performance</h2>
  <div id="scatter-content"></div>
</div>

<div class="chart-container" id="demographics-chart">
  <h2>Audience Demographics</h2>
  <div class="demo-grid" id="demo-content"></div>
</div>

<div class="chart-container">
  <h2>Company Page Analytics</h2>
  <div id="competitor-content"></div>
</div>

<div class="chart-container">
  <h2>Top Posts</h2>
  <table>
    <thead><tr><th>Date</th><th>Impressions</th><th>Engagements</th><th>Eng. Rate</th><th>Quadrant</th><th>Link</th></tr></thead>
    <tbody>
      ${topPostsData.map(p => `<tr>
        <td>${p.publish_date}</td>
        <td>${fmt(p.impressions)}</td>
        <td>${fmt(p.engagements)}</td>
        <td>${p.engagementRate}%</td>
        <td><span class="quadrant-tag quadrant-${p.quadrant.replace(/[ -]/g, '_')}">${p.quadrant}</span></td>
        <td><a href="${p.post_url}" target="_blank">View Post</a></td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<script>${reactLib}</script>
<script>${reactDomLib}</script>
<script>${propTypesLib}</script>
<script>${rechartsLib}</script>
<script>
const { createElement: h, useState, useRef, useEffect } = React;
const { render } = ReactDOM;
const { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ScatterChart, Scatter, Cell, ReferenceLine } = Recharts;

// Data
const monthlyData = ${JSON.stringify(monthlyData)};
const weeklyFollowers = ${JSON.stringify(weeklyFollowers)};
const scatterData = ${JSON.stringify(scatterData)};
const demoByType = ${JSON.stringify(demoByType)};
const competitor = ${JSON.stringify(competitor)};
const medianImp = ${medianImp};
const medianEng = ${medianEng};

// Colors
const colors = { blue: '#1f6feb', green: '#3fb950', orange: '#d29922', red: '#da3633', purple: '#bc8cff', cyan: '#39d2c0' };

// Monthly tab component
function MonthlyChart() {
  const [tab, setTab] = React.useState('impressions');
  const tabs = [
    { id: 'impressions', label: 'Impressions + Engagements' },
    { id: 'rate', label: 'Engagement Rate' },
    { id: 'followers', label: 'New Followers' },
  ];

  return h('div', null,
    h('div', { className: 'tabs', style: { display: 'flex', gap: '4px', marginBottom: '16px' } },
      tabs.map(t =>
        h('div', {
          key: t.id,
          className: 'tab' + (tab === t.id ? ' active' : ''),
          onClick: () => setTab(t.id),
          style: { padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
            background: tab === t.id ? '#1f6feb' : '#21262d', color: tab === t.id ? '#fff' : '#8b949e',
            border: '1px solid ' + (tab === t.id ? '#1f6feb' : '#30363d') }
        }, t.label)
      )
    ),
    tab === 'impressions' && h(ResponsiveContainer, { width: '100%', height: 300 },
      h(ComposedChart, { data: monthlyData, margin: { top: 10, right: 30, left: 0, bottom: 0 } },
        h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#30363d' }),
        h(XAxis, { dataKey: 'month', stroke: '#8b949e', tick: { fontSize: 11 } }),
        h(YAxis, { yAxisId: 'left', stroke: '#8b949e', tick: { fontSize: 11 } }),
        h(YAxis, { yAxisId: 'right', orientation: 'right', stroke: '#8b949e', tick: { fontSize: 11 } }),
        h(Tooltip, { contentStyle: { background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e1e4e8' } }),
        h(Legend),
        h(Bar, { yAxisId: 'left', dataKey: 'impressions', fill: colors.blue, name: 'Impressions', barSize: 20 }),
        h(Bar, { yAxisId: 'left', dataKey: 'engagements', fill: colors.green, name: 'Engagements', barSize: 20 }),
        h(Line, { yAxisId: 'right', dataKey: 'newFollowers', stroke: colors.orange, name: 'New Followers', strokeWidth: 2, dot: false })
      )
    ),
    tab === 'rate' && h(ResponsiveContainer, { width: '100%', height: 300 },
      h(BarChart, { data: monthlyData, margin: { top: 10, right: 30, left: 0, bottom: 0 } },
        h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#30363d' }),
        h(XAxis, { dataKey: 'month', stroke: '#8b949e', tick: { fontSize: 11 } }),
        h(YAxis, { stroke: '#8b949e', tick: { fontSize: 11 }, domain: [0, 'auto'] }),
        h(Tooltip, { contentStyle: { background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e1e4e8' },
          formatter: (v) => v + '%' }),
        h(Legend),
        h(Bar, { dataKey: 'engagementRate', fill: colors.purple, name: 'Engagement Rate (%)', barSize: 20 })
      )
    ),
    tab === 'followers' && h(ResponsiveContainer, { width: '100%', height: 300 },
      h(BarChart, { data: monthlyData, margin: { top: 10, right: 30, left: 0, bottom: 0 } },
        h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#30363d' }),
        h(XAxis, { dataKey: 'month', stroke: '#8b949e', tick: { fontSize: 11 } }),
        h(YAxis, { stroke: '#8b949e', tick: { fontSize: 11 } }),
        h(Tooltip, { contentStyle: { background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e1e4e8' } }),
        h(Legend),
        h(Bar, { dataKey: 'newFollowers', fill: colors.orange, name: 'New Followers', barSize: 20 })
      )
    )
  );
}

// Follower growth chart
function FollowerChart() {
  if (!weeklyFollowers || weeklyFollowers.length === 0) return h('p', { style: { color: '#8b949e' } }, 'No follower data available.');
  return h(ResponsiveContainer, { width: '100%', height: 300 },
    h(ComposedChart, { data: weeklyFollowers, margin: { top: 10, right: 30, left: 0, bottom: 0 } },
      h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#30363d' }),
      h(XAxis, { dataKey: 'week', stroke: '#8b949e', tick: { fontSize: 10 } }),
      h(YAxis, { yAxisId: 'left', stroke: '#8b949e', tick: { fontSize: 11 } }),
      h(YAxis, { yAxisId: 'right', orientation: 'right', stroke: '#8b949e', tick: { fontSize: 11 } }),
      h(Tooltip, { contentStyle: { background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e1e4e8' } }),
      h(Legend),
      h(Area, { yAxisId: 'left', dataKey: 'total', fill: colors.blue, stroke: colors.blue, name: 'Total Followers', fillOpacity: 0.3 }),
      h(Bar, { yAxisId: 'right', dataKey: 'newFollowers', fill: colors.orange, name: 'New Followers/Week', barSize: 10, opacity: 0.7 })
    )
  );
}

// Scatter chart
function PostScatterChart() {
  const quadColors = { 'Stars': colors.blue, 'Viral-Shallow': colors.red, 'Niche-Gold': colors.orange, 'Underperformers': '#8b949e' };
  return h('div', null,
    h('div', { style: { display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '12px', color: '#8b949e' } },
      Object.entries(quadColors).map(([k, v]) =>
        h('span', { key: k, style: { display: 'flex', alignItems: 'center', gap: '4px' } },
          h('span', { style: { width: '10px', height: '10px', background: v, borderRadius: '2px', display: 'inline-block' } }),
          k
        )
      )
    ),
    h(ResponsiveContainer, { width: '100%', height: 350 },
      h(ScatterChart, { margin: { top: 10, right: 30, left: 0, bottom: 0 } },
        h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#30363d' }),
        h(XAxis, { dataKey: 'impressions', name: 'Impressions', stroke: '#8b949e', tick: { fontSize: 11 } }),
        h(YAxis, { dataKey: 'engagements', name: 'Engagements', stroke: '#8b949e', tick: { fontSize: 11 } }),
        h(ReferenceLine, { x: medianImp, stroke: '#30363d', strokeDasharray: '3 3' }),
        h(ReferenceLine, { y: medianEng, stroke: '#30363d', strokeDasharray: '3 3' }),
        h(Tooltip, {
          contentStyle: { background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e1e4e8' },
          formatter: (v, n) => [v, n],
          labelFormatter: (i) => scatterData[i] ? scatterData[i].post_url.substring(0, 50) + '...' : ''
        }),
        h(Scatter, { data: scatterData, fill: colors.blue },
          scatterData.map((entry, index) =>
            h(Cell, { key: index, fill: quadColors[entry.quadrant] || '#8b949e' })
          )
        )
      )
    )
  );
}

// Demographics
function Demographics() {
  const types = Object.keys(demoByType);
  return h('div', { className: 'demo-grid', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' } },
    types.map(type =>
      h('div', { key: type },
        h('h3', { style: { fontSize: '14px', marginBottom: '8px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px' } }, type),
        demoByType[type].slice(0, 8).map(item =>
          h('div', { key: item.name, className: 'demo-bar', style: { display: 'flex', alignItems: 'center', marginBottom: '4px' } },
            h('span', { className: 'label', style: { width: '140px', fontSize: '12px', color: '#e1e4e8', textAlign: 'right', paddingRight: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, item.name),
            h('div', { className: 'bar-bg', style: { flex: 1, height: '16px', background: '#21262d', borderRadius: '3px', overflow: 'hidden' } },
              h('div', { className: 'bar-fill', style: { height: '100%', width: item.value + '%', background: colors.blue, borderRadius: '3px' } })
            ),
            h('span', { className: 'pct', style: { width: '40px', fontSize: '11px', color: '#8b949e', paddingLeft: '6px' } }, item.value + '%')
          )
        )
      )
    )
  );
}

// Competitor table
function CompetitorTable() {
  if (!competitor) return h('p', { style: { color: '#8b949e' } }, 'No company page data available.');
  const sorted = [...competitor.rows].sort((a, b) => (b['New Followers'] || 0) - (a['New Followers'] || 0));
  return h('div', null,
    h('p', { style: { color: '#8b949e', fontSize: '13px', marginBottom: '12px' } },
      competitor.date_range.start + ' – ' + competitor.date_range.end),
    h('table', null,
      h('thead', null,
        h('tr', null,
          ['Page', 'New Followers', 'Posts', 'Comments', 'Comments/day', 'Reactions'].map(col =>
            h('th', { key: col, style: col === 'Page' ? {} : { textAlign: 'right' } }, col)
          )
        )
      ),
      h('tbody', null,
        sorted.map((row, i) =>
          h('tr', { key: i },
            h('td', null, row['Page'] || '—'),
            h('td', { style: { textAlign: 'right' } }, row['New Followers'] ?? 0),
            h('td', { style: { textAlign: 'right' } }, row['Posts'] ?? 0),
            h('td', { style: { textAlign: 'right' } }, row['Comments'] ?? 0),
            h('td', { style: { textAlign: 'right' } }, (row['Comments per day'] ?? 0)),
            h('td', { style: { textAlign: 'right' } }, row['Reactions'] ?? 0)
          )
        )
      )
    )
  );
}

// Render
render(h(MonthlyChart), document.getElementById('monthly-content'));
render(h(FollowerChart), document.getElementById('follower-content'));
render(h(PostScatterChart), document.getElementById('scatter-content'));
render(h(Demographics), document.getElementById('demo-content'));
if (competitor) {
  render(h(CompetitorTable), document.getElementById('competitor-content'));
}
</script>
</body>
</html>`;

const outPath = path.join(PROJECT_DIR, 'dashboard.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Wrote dashboard.html (' + (html.length / 1024).toFixed(0) + ' KB)');
