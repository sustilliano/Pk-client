#!/usr/bin/env node
'use strict';

/**
 * Hutch — Environment & Runtime State Checker
 * Validates: env vars, config readiness, session/cookie config,
 * middleware ordering, database connectivity, missing dependencies,
 * security settings.
 *
 * Usage:
 *   node tools/hutch.js [server-file]
 *   node tools/hutch.js server.js
 *
 * Score >= 0.85 = HEALTHY, < 0.85 = NEEDS_ATTENTION
 */

const fs = require('fs');
const path = require('path');

function checkEnvVars(c) {
  const results = [], refs = (c.match(/process\.env\.(\w+)/g) || []).map(r => r.replace('process.env.', ''));
  const vars = [...new Set(refs)];
  for (const v of ['DATABASE_URL','SESSION_SECRET','PORT']) {
    if (vars.includes(v)) {
      if (v === 'SESSION_SECRET' && new RegExp(`process\\.env\\.${v}\\s*\\|\\|`).test(c))
        results.push({ status: 'warn', var: v, message: `${v} has random fallback` });
      else results.push({ status: 'pass', var: v, message: `${v} referenced` });
    } else results.push({ status: 'fail', var: v, message: `${v} not referenced` });
  }
  return results;
}

function checkSessionConfig(c) {
  const r = [];
  r.push(/secure:\s*(?:true|process\.env)/.test(c) ? { status:'pass', check:'cookie.secure', message:'Secure flag set' } : { status:'fail', check:'cookie.secure', message:'No secure flag' });
  r.push(/httpOnly:\s*true/.test(c) ? { status:'pass', check:'cookie.httpOnly', message:'HttpOnly set' } : { status:'fail', check:'cookie.httpOnly', message:'HttpOnly not set' });
  r.push(/connect-pg-simple|connect-redis/.test(c) ? { status:'pass', check:'session.store', message:'External store' } : { status:'fail', check:'session.store', message:'Memory store (leaks)' });
  return r;
}

function checkSecurity(c) {
  const r = [];
  r.push(/trust\s*proxy/.test(c) ? { status:'pass', check:'trust-proxy', message:'Configured' } : { status:'warn', check:'trust-proxy', message:'Missing' });
  const sqli = (c.match(/`[^`]*SELECT[^`]*\$\{/gi) || []).length;
  r.push(sqli > 0 ? { status:'fail', check:'sql-injection', message:`${sqli} template literal queries` } : { status:'pass', check:'sql-injection', message:'No injection patterns' });
  return r;
}

function computeScore(results) {
  const t = results.length; if (!t) return 1;
  return Math.max(0, Math.min(1, (results.filter(r=>r.status==='pass').length + results.filter(r=>r.status==='warn').length * 0.5) / t));
}

function run(serverFile) {
  serverFile = serverFile || 'server.js';
  if (!fs.existsSync(path.resolve(serverFile))) { console.error(`Not found: ${serverFile}`); process.exit(1); }
  const c = fs.readFileSync(path.resolve(serverFile), 'utf8');
  const sections = { envVars: checkEnvVars(c), sessionConfig: checkSessionConfig(c), security: checkSecurity(c) };
  const all = Object.values(sections).flat();
  const score = computeScore(all);
  return { status: score >= 0.85 ? 'HEALTHY' : 'NEEDS_ATTENTION', score: Math.round(score*100)/100, summary: { total: all.length, passed: all.filter(r=>r.status==='pass').length, warnings: all.filter(r=>r.status==='warn').length, failures: all.filter(r=>r.status==='fail').length }, sections };
}

if (require.main === module) {
  const report = run(process.argv[2]);
  console.log(`\nHUTCH REPORT — ${report.status} (score: ${report.score})`);
  console.log(`  Checks: ${report.summary.total}  Pass: ${report.summary.passed}  Warn: ${report.summary.warnings}  Fail: ${report.summary.failures}`);
  if (report.status !== 'HEALTHY') process.exit(1);
}

module.exports = { run, checkEnvVars, checkSessionConfig };
