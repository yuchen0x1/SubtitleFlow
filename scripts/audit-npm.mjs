import { spawnSync } from 'node:child_process';

const result = spawnSync('npm audit --json', {
  encoding: 'utf8', shell: true, maxBuffer: 4 * 1024 * 1024,
});
if (result.error || !result.stdout) throw result.error ?? new Error(result.stderr || 'npm audit returned no report');
const jsonStart = result.stdout.search(/^[\[{]/m);
if (jsonStart < 0) throw new Error(result.stderr || 'npm audit returned no JSON report');
const report = JSON.parse(result.stdout.slice(jsonStart));
// npm 10+ may return a bare "{}" or a plain string when there are no findings.
// An empty audit is valid; only reject responses that cannot be interpreted.
// npm can emit unrelated lifecycle warnings before the JSON payload. Read the
// error field only from the parsed JSON report, not from wrapper output.
if (report.error && typeof report.error === 'string') throw new Error(report.error);
if (report.error && typeof report.error === 'object' && report.error.code) {
  throw new Error(String(report.error.summary ?? report.error.code));
}
const vulnerabilities = report.vulnerabilities && typeof report.vulnerabilities === 'object' ? report.vulnerabilities : {};

// The upstream advisory has no published fix. Picomatch is only used by the build
// and test toolchain with repository-defined globs. The extension never ships it.
const approvedAdvisory = 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf';
const findings = Object.values(vulnerabilities).flatMap((entry) => {
  const via = entry && typeof entry === 'object' && Array.isArray(entry.via) ? entry.via : [];
  return via.filter((item) => typeof item === 'object');
});
const blocked = findings.filter((item) => ['high', 'critical'].includes(item.severity) &&
  !(item.name === 'picomatch' && item.url === approvedAdvisory && item.severity === 'high'),
);
for (const item of new Map(findings.map((finding) => [finding.url, finding])).values()) {
  console.log(`${item.severity} ${item.name} ${item.url}`);
}
if (blocked.length) process.exitCode = 1;
