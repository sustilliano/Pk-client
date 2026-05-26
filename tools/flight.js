#!/usr/bin/env node
'use strict';

/**
 * Flight — Code Flow Edge Detector
 * Ported from Rgano rgano-flight (Python → Node.js)
 *
 * Traces execution paths through Express routes and client-side JS.
 * Identifies: redirect chains, circular navigation, dead-end routes,
 * branching logic, unreachable code paths.
 *
 * Usage:
 *   node tools/flight.js [file...]
 *   node tools/flight.js                    # scans server.js + public/*.html
 *   node tools/flight.js server.js          # scan specific file
 *
 * Output: JSON report of all navigation edges, cycles, and a health score.
 * Score >= 0.85 = "LANDED" (healthy), < 0.85 = issues found.
 */

const fs = require('fs');
const path = require('path');

const REDIRECT_PATTERNS = {
  'res.redirect': /res\.redirect\(\s*(\d+)?\s*,?\s*['"`]([^'"`]+)['"`]\s*\)/g,
  'res.sendFile': /res\.sendFile\(\s*(?:path\.join\([^)]+,\s*)?['"`]([^'"`]+)['"`]/g,
  'window.location.href': /window\.location\.href\s*=\s*['"`]([^'"`]+)['"`]/g,
  'window.location.replace': /window\.location\.replace\(\s*['"`]([^'"`]+)['"`]/g,
  'location.reload': /location\.reload\(\)/g,
  'meta-refresh': /<meta\s+http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"']+)["']/gi,
  'fetch-redirect': /fetch\(['"`]([^'"`]+)['"`].*?\.then.*?location/gs,
};

const ROUTE_PATTERN = /app\.(get|post|put|delete|patch|use)\(\s*['"`]([^'"`]+)['"`]/g;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const edges = [];
  const routes = [];
  let m;
  const routeRe = new RegExp(ROUTE_PATTERN.source, 'g');
  while ((m = routeRe.exec(content)) !== null) {
    routes.push({ method: m[1].toUpperCase(), path: m[2], line: content.substring(0, m.index).split('\n').length, file: fileName });
  }
  for (const [type, pattern] of Object.entries(REDIRECT_PATTERNS)) {
    const re = new RegExp(pattern.source, pattern.flags);
    while ((m = re.exec(content)) !== null) {
      const line = content.substring(0, m.index).split('\n').length;
      let target, statusCode = null;
      if (type === 'res.redirect') { statusCode = m[1] ? parseInt(m[1]) : 302; target = m[2]; }
      else if (type === 'res.sendFile') { target = `[file:${m[1]}]`; }
      else if (type === 'location.reload') { target = '[reload]'; }
      else if (type === 'fetch-redirect') { target = `[fetch:${m[1]}→redirect]`; }
      else { target = m[1]; }
      edges.push({ type, target, statusCode, line, file: fileName, context: content.substring(Math.max(0, m.index - 40), Math.min(content.length, m.index + m[0].length + 40)).replace(/\n/g, ' ').trim() });
    }
  }
  return { routes, edges };
}

function detectCycles(edges, routes) {
  const graph = {};
  for (const edge of edges) {
    const source = inferSourceRoute(edge, routes);
    if (!graph[source]) graph[source] = [];
    graph[source].push({ target: edge.target, type: edge.type, statusCode: edge.statusCode, line: edge.line, file: edge.file });
  }
  const cycles = [], visited = new Set(), inStack = new Set();
  function dfs(node, pathSoFar) {
    if (inStack.has(node)) { cycles.push(pathSoFar.slice(pathSoFar.indexOf(node)).concat(node)); return; }
    if (visited.has(node)) return;
    visited.add(node); inStack.add(node);
    for (const neighbor of (graph[node] || [])) {
      const t = neighbor.target.startsWith('[') ? null : neighbor.target;
      if (t) dfs(t, [...pathSoFar, node]);
    }
    inStack.delete(node);
  }
  for (const node of Object.keys(graph)) dfs(node, []);
  return { graph, cycles };
}

function inferSourceRoute(edge, routes) {
  if (edge.file === 'server.js') {
    let best = '[global]';
    for (const route of routes) { if (route.file === edge.file && route.line <= edge.line) best = `${route.method} ${route.path}`; }
    return best;
  }
  return `[${edge.file}]`;
}

function detectDeadEnds(routes, edges) {
  const deadEnds = [];
  const targets = new Set(edges.filter(e => !e.target.startsWith('[')).map(e => e.target));
  const routePaths = new Set(routes.map(r => r.path));
  for (const target of targets) {
    const norm = target.split('?')[0];
    if (!routePaths.has(norm) && !norm.includes(':') && !norm.match(/\.(html|js|css|png|jpg|svg)$/)) {
      deadEnds.push({ type: 'missing_route', path: target, referencedBy: edges.filter(e => e.target === target).map(e => ({ file: e.file, line: e.line, type: e.type })) });
    }
  }
  return deadEnds;
}

function analyzeRedirectCodes(edges) {
  return edges.filter(e => e.statusCode === 301).map(e => ({ severity: 'warning', message: `301 permanent redirect at ${e.file}:${e.line} -> ${e.target}`, edge: e }));
}

function computeScore(cycles, deadEnds, redirectIssues, totalEdges) {
  let s = 1.0;
  s -= cycles.length * 0.3;
  s -= deadEnds.length * 0.1;
  s -= redirectIssues.length * 0.05;
  if (totalEdges > 10) s -= (totalEdges - 10) * 0.02;
  return Math.max(0, Math.min(1, s));
}

function run(files) {
  if (!files || files.length === 0) {
    files = ['server.js'];
    const pub = path.join(process.cwd(), 'public');
    if (fs.existsSync(pub)) files.push(...fs.readdirSync(pub).filter(f => f.endsWith('.html')).map(f => path.join('public', f)));
  }
  const allRoutes = [], allEdges = [];
  for (const file of files) {
    const fp = path.resolve(file);
    if (!fs.existsSync(fp)) { console.error(`File not found: ${file}`); continue; }
    const { routes, edges } = scanFile(fp);
    allRoutes.push(...routes); allEdges.push(...edges);
  }
  const { graph, cycles } = detectCycles(allEdges, allRoutes);
  const deadEnds = detectDeadEnds(allRoutes, allEdges);
  const redirectIssues = analyzeRedirectCodes(allEdges);
  const score = computeScore(cycles, deadEnds, redirectIssues, allEdges.length);
  return { status: score >= 0.85 ? 'LANDED' : 'TURBULENCE', score: Math.round(score * 100) / 100, summary: { files_scanned: files.length, routes_found: allRoutes.length, navigation_edges: allEdges.length, cycles_detected: cycles.length, dead_ends: deadEnds.length, redirect_warnings: redirectIssues.length }, cycles: cycles.map(c => ({ path: c, description: `Circular: ${c.join(' → ')}` })), dead_ends: deadEnds, redirect_issues: redirectIssues, routes: allRoutes, edges: allEdges, graph };
}

if (require.main === module) {
  const report = run(process.argv.slice(2));
  console.log(`\nFLIGHT REPORT — ${report.status} (score: ${report.score})`);
  console.log(`  Routes: ${report.summary.routes_found}  Edges: ${report.summary.navigation_edges}  Cycles: ${report.summary.cycles_detected}  Dead ends: ${report.summary.dead_ends}`);
  if (report.status !== 'LANDED') process.exit(1);
}

module.exports = { run, scanFile, detectCycles, detectDeadEnds };
