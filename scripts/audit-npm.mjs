import { spawnSync } from 'node:child_process';

const result = spawnSync('npm audit --json', {
  encoding: 'utf8', shell: true, maxBuffer: 4 * 1024 * 1024,
});
if (result.error || !result.stdout) throw result.error ?? new Error(result.stderr || 'npm audit returned no report');
const report = JSON.parse(result.stdout);
if (!report.vulnerabilities || report.error) throw new Error('npm audit returned an invalid report');

// The upstream advisory has no published fix. Picomatch is only used by the build
// and test toolchain with repository-defined globs. The extension never ships it.
const approvedAdvisory = 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf';
const findings = Object.values(report.vulnerabilities).flatMap(({ via }) =>
  via.filter((item) => typeof item === 'object'),
);
const blocked = findings.filter((item) => ['high', 'critical'].includes(item.severity) &&
  !(item.name === 'picomatch' && item.url === approvedAdvisory && item.severity === 'high'),
);
for (const item of new Map(findings.map((finding) => [finding.url, finding])).values()) {
  console.log(`${item.severity} ${item.name} ${item.url}`);
}
if (blocked.length) process.exitCode = 1;
